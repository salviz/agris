from google.cloud import firestore
from typing import Optional, Dict, Any
# from ..models.game_models import GameSession, Location # This will cause circular import if models also import services.
# For now, we'll work with dicts for Firestore and validate with Pydantic models at API boundaries or service inputs.

# Initialize Firestore client
# For App Engine, client initialization without arguments often works as project is inferred.
# For local development, GOOGLE_APPLICATION_CREDENTIALS env var should be set.
db = firestore.AsyncClient()

async def get_document(collection: str, document_id: str) -> Optional[Dict[str, Any]]:
    """Fetches a document from Firestore."""
    doc_ref = db.collection(collection).document(document_id)
    doc = await doc_ref.get()
    if doc.exists:
        return doc.to_dict()
    return None

async def set_document(collection:str, document_id: str, data: Dict[str, Any]) -> None:
    """Sets/replaces a document in Firestore."""
    doc_ref = db.collection(collection).document(document_id)
    await doc_ref.set(data)

async def update_document(collection:str, document_id: str, data: Dict[str, Any]) -> None:
    """Updates a document in Firestore."""
    doc_ref = db.collection(collection).document(document_id)
    await doc_ref.update(data)

# Specific game functions (examples, to be refined)
# These will use the generic functions above.
# It's better to have these specific functions in game_logic.py or a dedicated session_manager.py
# to decouple Firestore generic access from game-specific logic.
# For now, as placeholders:

async def get_game_session(session_id: str) -> Optional[Dict[str, Any]]:
    return await get_document("game_sessions", session_id)

async def save_game_session(session_id: str, session_data: Dict[str, Any]) -> None:
    # session_data should be a dict representation of GameSession model
    await set_document("game_sessions", session_id, session_data)

async def get_location_data(location_id: str) -> Optional[Dict[str, Any]]:
    return await get_document("locations", location_id)

# Example: If you had a global game settings collection
# async def get_game_settings() -> Optional[Dict[str, Any]]:
#     return await get_document("configuration", "game_settings")

print("Firestore service initialized.")
