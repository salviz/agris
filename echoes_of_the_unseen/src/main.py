from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
import datetime
import uuid # Keep for session_id if needed, though game_logic handles it now
from typing import Optional, Dict, Any # Keep for Pydantic models

from .game.models.game_models import GameSession, PlayerAction # Add PlayerAction
from .game.core import game_logic # Import the new game_logic module
# from .game.services import firestore_service # game_logic now uses this directly

# Mock clients (keep as is for now from previous step)
class MockTTSClient:
    def __init__(self): print("MockTTSClient initialized")
    def synthesize(self, text): return f"Synthesized audio for: {text}"
class MockLLMClient:
    def __init__(self): print("MockLLMClient initialized")
    def generate_text(self, prompt): return f"Generated text for prompt: {prompt}"
class MockSFXClient:
    def __init__(self): print("MockSFXClient initialized")
    def generate_sfx(self, description): return f"Generated SFX for: {description}"
class MockSTTClient:
    def __init__(self): print("MockSTTClient initialized")
    def recognize(self, audio): return "Recognized text from audio (mock)"

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up application lifespan...")
    app.state.tts_client = MockTTSClient()
    app.state.llm_client = MockLLMClient()
    app.state.sfx_client = MockSFXClient()
    app.state.stt_client = MockSTTClient()
    print("AI and DB clients (mocked/real) are being initialized.")
    yield
    print("Shutting down application lifespan...")

app = FastAPI(
    title="Echoes of the Unseen",
    description="An immersive AI-powered audio game for blind users.",
    version="0.1.1", # Increment version
    lifespan=lifespan
)

@app.get("/", tags=["General"])
async def root():
    return {
        "message": "Welcome to Echoes of the Unseen API",
        "status": "Healthy",
        "version": app.version,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

@app.get("/health", tags=["General"])
async def health_check():
    return {"status": "ok", "timestamp": datetime.datetime.utcnow().isoformat()}

@app.post("/game/start", response_model=GameSession, status_code=201, tags=["Game"])
async def start_game_endpoint(player_name: Optional[str] = "The Listener"):
    """Starts a new game session and returns the initial session state."""
    try:
        session = await game_logic.start_new_game_session(player_name)
        return session
    except Exception as e:
        print(f"Error starting game: {str(e)}") # Log error
        raise HTTPException(status_code=500, detail=f"Failed to start new game: {str(e)}")

# Define PlayerAction model if not already in game_models.py (it should be there or defined here)
# For clarity, let's assume it's better in game_models.py
# If it's not, add it:
# from pydantic import BaseModel
# class PlayerAction(BaseModel):
#     session_id: str
#     action: str
#     parameters: Optional[Dict[str, Any]] = None

@app.post("/game/action", tags=["Game"])
async def game_action_endpoint(player_action: PlayerAction): # PlayerAction model from game.models
    """
    Processes a player action within a given session.
    Returns the updated session state and a message.
    """
    try:
        updated_session, message = await game_logic.process_player_action(
            player_action.session_id, 
            player_action.action, 
            player_action.parameters
        )
        if not updated_session:
            raise HTTPException(status_code=404, detail=message) # e.g. session not found
        
        # The TTS service will eventually narrate this message
        # For now, we return it along with the session
        return {"session_state": updated_session, "narration_message": message}
    except Exception as e:
        print(f"Error processing action: {str(e)}") # Log error
        raise HTTPException(status_code=500, detail=f"Failed to process action: {str(e)}")

# Make sure PlayerAction is defined or imported. Add to game_models.py if not present.
# In echoes_of_the_unseen/src/game/models/game_models.py, add:
# class PlayerAction(BaseModel):
#     session_id: str
#     action: str
#     parameters: Optional[Dict[str, Any]] = None
# And ensure it's in echoes_of_the_unseen/src/game/models/__init__.py's __all__ list.


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
