import datetime
import uuid
from typing import Dict, Any, Optional, Tuple

from ..models.game_models import GameSession, Player, Location, InteractableObject, Exit
from ..services import firestore_service

# --- Game Initialization and Session Management ---
async def start_new_game_session(player_name: Optional[str] = "The Listener") -> GameSession:
    session_id = str(uuid.uuid4())
    player = Player(name=player_name if player_name else "The Listener")

    # Define a default starting location
    start_location_data = {
        "id": "listener_study",
        "name": "The Listener's Study",
        "description_template": "You are in your study. It's quiet, save for the gentle hum of your old computer in the corner. A large wooden desk stands before you, and a rain-streaked window looks out onto the street.",
        "ambient_sfx_key": "study_ambience_hum",
        "objects": [
            {
                "id": "desk", "name": "Desk", 
                "description": "A large, sturdy wooden desk. It looks mostly clear.",
                "detailed_description": "The desk is made of dark oak. The surface is cool to the touch. Most of it is clear, but there's a small, almost hidden drawer on the underside.",
                # Custom state for the desk, e.g., if the drawer is found
            },
            {
                "id": "window", "name": "Window",
                "description": "The window shows a grey, rainy day outside.",
                "detailed_description": "Raindrops trace paths down the glass, distorting the view of the empty street. The latch seems secure."
            },
            {
                "id": "computer", "name": "Computer",
                "description": "Your old computer hums quietly in the corner.",
                "detailed_description": "It's an older model, but reliable. The screen is dark right now, but the power LED is on."
            }
        ],
        "exits": [
            {"direction": "hallway", "to_location_id": "placeholder_hallway", "description": "A door leads to the hallway."}
        ],
        "visited": True # First location is always visited
    }
    start_location = Location(**start_location_data)
    
    # Save this initial location to Firestore
    # This should ideally be part of a separate setup script or admin interface
    # but for self-contained testing of this phase, we ensure it exists.
    existing_location = await firestore_service.get_location_data(start_location.id)
    if not existing_location:
        await firestore_service.set_document("locations", start_location.id, start_location.model_dump())

    timestamp = datetime.datetime.utcnow().isoformat()
    # Initialize game_state with a place for object states
    initial_game_state = {
        "story_events": [], 
        "current_puzzle": None,
        "object_states": { # Track states of objects, e.g., if a drawer was found
            "listener_study": { # Location ID
                "desk": {"drawer_found": False} # Object ID
            }
        }
    }
    
    game_session_data = {
        "session_id": session_id,
        "player": player.model_dump(),
        "current_location_id": start_location.id,
        "game_state": initial_game_state,
        "inventory": [],
        "discovered_clues": [],
        "log": [f"Game started for {player.name} at {timestamp} in {start_location.name}."],
        "last_updated": timestamp
    }
    
    session = GameSession(**game_session_data)
    await firestore_service.save_game_session(session_id, session.model_dump())
    print(f"New game session {session_id} created for player {player.name}.")
    return session

async def get_current_game_session(session_id: str) -> Optional[GameSession]:
    session_data = await firestore_service.get_game_session(session_id)
    if session_data:
        return GameSession(**session_data)
    return None

async def get_current_location(session: GameSession) -> Optional[Location]:
    location_data = await firestore_service.get_location_data(session.current_location_id)
    if location_data:
        return Location(**location_data)
    print(f"Warning: Location {session.current_location_id} not found in Firestore.")
    return None

# --- Core Game Loop Logic ---
async def process_player_action(session_id: str, action: str, params: Optional[Dict[str, Any]] = None) -> Tuple[Optional[GameSession], str]:
    if params is None:
        params = {}

    session = await get_current_game_session(session_id)
    if not session:
        return None, "Error: Game session not found."

    current_location = await get_current_location(session)
    if not current_location:
        return session, "Error: Current location data not found. Critical error."

    response_message = f"Action '{action}' received."
    player_action_logged = True # Flag to control generic logging

    # Ensure object_states for the current location exists in session.game_state
    if session.current_location_id not in session.game_state.get("object_states", {}):
        session.game_state.setdefault("object_states", {})[session.current_location_id] = {}


    if action == "look":
        objects_in_location = ", ".join([obj.name for obj in current_location.objects]) if current_location.objects else "nothing of note"
        exits_available = ", ".join([f"{ex.direction} (to {ex.to_location_id})" for ex in current_location.exits]) if current_location.exits else "no obvious exits"
        response_message = f"{current_location.description_template} You observe: {objects_in_location}. Exits are: {exits_available}."
        session.log.append(f"Player looked around {current_location.name}.")
        player_action_logged = False

    elif action == "examine":
        target_name = params.get("target")
        if target_name:
            found_object = next((obj for obj in current_location.objects if obj.name.lower() == target_name.lower()), None)
            if found_object:
                # Default detailed description
                response_message = found_object.detailed_description or found_object.description
                
                # Scene-specific logic for "listener_study"
                if session.current_location_id == "listener_study":
                    loc_object_states = session.game_state["object_states"].setdefault(session.current_location_id, {})
                    obj_state = loc_object_states.setdefault(found_object.id, {})

                    if found_object.id == "desk":
                        if not obj_state.get("drawer_found"):
                            response_message += " As you run your hands along the underside, you discover a small, almost invisible drawer!"
                            obj_state["drawer_found"] = True
                            session.log.append("Player found the hidden drawer on the desk.")
                        else:
                            response_message += " You remember finding the hidden drawer earlier. It's currently closed."
                    # Add more object-specific examination logic here
                
                session.log.append(f"Player examined '{found_object.name}'. Message: {response_message}")
            else:
                response_message = f"You don't see '{target_name}' here to examine."
                session.log.append(f"Player tried to examine non-existent '{target_name}'.")
        else:
            response_message = "Examine what? Please specify a target."
        player_action_logged = False # Specific logging done inside

    elif action == "move":
        direction = params.get("direction")
        if direction:
            chosen_exit = next((ex for ex in current_location.exits if ex.direction.lower() == direction.lower()), None)
            if chosen_exit:
                new_location_data = await firestore_service.get_location_data(chosen_exit.to_location_id)
                if new_location_data:
                    session.current_location_id = chosen_exit.to_location_id
                    new_location = Location(**new_location_data)
                    session.log.append(f"Moved to {new_location.name} via {direction}.")
                    response_message = f"You move {direction}. {new_location.description_template}"
                    if session.current_location_id not in session.game_state.get("object_states", {}):
                         session.game_state.setdefault("object_states", {})[session.current_location_id] = {}

                elif chosen_exit.to_location_id == "placeholder_hallway": # Fallback for testing
                    placeholder_loc_data = {
                        "id": "placeholder_hallway", "name": "A Dusty Hallway", 
                        "description_template": "You are in a dusty hallway. It's quite featureless, except for a door back to the study.",
                        "objects": [],
                        "exits": [{"direction": "study", "to_location_id": "listener_study", "description": "The door back to the study."}]
                    }
                    if not await firestore_service.get_location_data("placeholder_hallway"):
                        await firestore_service.set_document("locations", "placeholder_hallway", placeholder_loc_data)
                    
                    session.current_location_id = "placeholder_hallway"
                    session.log.append(f"Moved to placeholder_hallway via {direction}.")
                    response_message = f"You move {direction}. {placeholder_loc_data['description_template']}"
                    if session.current_location_id not in session.game_state.get("object_states", {}):
                         session.game_state.setdefault("object_states", {})[session.current_location_id] = {}
                else:
                    response_message = f"The path {direction} leads to an unknown place."
            else:
                response_message = f"You can't move {direction} from here."
        else:
            response_message = "Move where? Please specify a direction."
        player_action_logged = False # Specific logging done inside
    
    else:
        response_message = f"Unknown or unsupported action: '{action}'."
        session.log.append(f"Player attempted unknown action: '{action}' with params: {params}.")
        player_action_logged = False

    if player_action_logged: # Log generic actions if not specifically logged above
        session.log.append(f"Processed action: '{action}' with params: {params}. Response: '{response_message}'")

    session.last_updated = datetime.datetime.utcnow().isoformat()
    await firestore_service.save_game_session(session.session_id, session.model_dump())

    return session, response_message

print("Game logic module initialized with enhanced scene interaction.")
