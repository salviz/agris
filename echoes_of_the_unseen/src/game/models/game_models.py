from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any # Added Any for PlayerAction parameters
import uuid

class Player(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "The Listener" # Default player name
    preferences: Dict[str, str] = {"tts_voice": "en-US-Standard-C", "tts_speed": "normal"}
    # Add other player-specific attributes here, e.g., achievements

class InteractableObject(BaseModel):
    id: str
    name: str
    description: str # Base description
    detailed_description: Optional[str] = None # Revealed on closer examination
    interaction_sfx: Optional[str] = None # Sound effect key for ElevenLabs
    related_clues: List[str] = [] # IDs of clues revealed by interacting

class Exit(BaseModel):
    direction: str # e.g., "north", "east", "through the archway"
    to_location_id: str # ID of the location this exit leads to
    description: Optional[str] = None # e.g., "A dimly lit corridor stretches to the north."

class Location(BaseModel):
    id: str
    name: str
    description_template: str # Base description, potentially with placeholders for dynamic elements
    ambient_sfx_key: Optional[str] = None # Key for ambient sound effect from ElevenLabs
    objects: List[InteractableObject] = []
    exits: List[Exit] = []
    visited: bool = False

class GameSession(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player: Player = Field(default_factory=Player)
    current_location_id: str
    game_state: Dict[str, any] = {} # For flags, quest progress, etc.
    inventory: List[str] = [] # List of item IDs
    discovered_clues: List[str] = [] # List of clue IDs
    log: List[str] = [] # Chronological log of key events/narrations
    last_updated: str # ISO format timestamp

# Example of how you might structure clues if needed later
# class Clue(BaseModel):
#     id: str
#     text: str
#     audio_representation: Optional[str] = None # e.g., a recorded echo

class PlayerAction(BaseModel):
    session_id: str
    action: str
    parameters: Optional[Dict[str, Any]] = None
