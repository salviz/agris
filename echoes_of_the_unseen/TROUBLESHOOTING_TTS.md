# Troubleshooting `tts_service.py` Creation Issue

## 1. The Problem: 'Turn Budget Exceeded' Error

I have been encountering a persistent "Could not complete the subtask within the turn budget" error when attempting to create or update certain Python files, most notably `src/game/services/tts_service.py` and also when trying to save complex changes to `src/game/core/game_logic.py`.

**My Understanding of the Error:**

When I delegate a task (like writing a file) to a worker agent, the system allocates a certain amount of time or resources for that action (a "turn"). If the action takes too long for the system to fully process and register its results (e.g., writing the file to the underlying storage and making it visible to my other tools), the operation is cut off, and I receive this "turn budget exceeded" error.

Even though the worker agent often reports that it *has* successfully written the file's content from its perspective, the subsequent "turn budget" error indicates that this change isn't reliably saved or recognized by the overall system in time for me to proceed. This means that later operations, like committing the code, would likely use an older or incomplete version of the affected files.

## 2. Attempts Made

I have made multiple attempts to create/update `src/game/services/tts_service.py`, including:
*   Focused subtasks to write only this single file.
*   Retrying after some time had passed, at your request.
*   Ensuring the worker agent had the exact, complete code.
*   The worker agent even identified and corrected a typo in one version of the code I provided.

Despite these efforts, every attempt to write `tts_service.py` with its full intended content has resulted in the "turn budget exceeded" error, immediately after the worker reported success.

A similar issue occurred when trying to save substantial updates to `src/game/core/game_logic.py` for scene interactions.

## 3. Intended Content for `src/game/services/tts_service.py`

This file is crucial for integrating real Text-to-Speech functionality using Google Vertex AI (simulating Gemini capabilities). Below is the full Python code that should be in this file:

```python
from google.cloud import aiplatform
# Corrected import path:
from google.cloud.aiplatform_v1beta1.services.text_to_speech_client import TextToSpeechClient
from google.cloud.aiplatform_v1beta1.types import SynthesizeSpeechRequest, VoiceSelectionParams, AudioConfig, SynthesisInput
from typing import Optional, Dict
import os
import asyncio

GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")
GCP_LOCATION = os.getenv("GCP_LOCATION", "us-central1")

class TtsService:
    def __init__(self, project_id: Optional[str] = None, location: Optional[str] = None):
        self.project_id = project_id or GCP_PROJECT_ID
        self.location = location or GCP_LOCATION
        if not self.project_id:
            print("Warning: GCP_PROJECT_ID is not set. TTS Service might not function.")
            self.tts_client = None
            return
        try:
            # The regional endpoint is usually like {location}-aiplatform.googleapis.com
            client_options = {"api_endpoint": f"{self.location}-aiplatform.googleapis.com"}
            self.tts_client = TextToSpeechClient(client_options=client_options)
            print(f"TtsService initialized with project: {self.project_id}, location: {self.location}, endpoint: {client_options['api_endpoint']}")
        except Exception as e:
            print(f"Error initializing TextToSpeechClient: {e}")
            self.tts_client = None

    async def synthesize_speech(
        self, text: str, voice_name: Optional[str] = "en-US-Standard-C", # Example, check Vertex AI docs for Gemini voices
        speaking_rate: Optional[float] = 1.0,
        pitch: Optional[float] = 0.0, # Range: -20.0 to 20.0
        output_format: str = "MP3" # MP3, LINEAR16, OGG_OPUS
    ) -> Optional[bytes]:
        if not self.tts_client:
            print("TTS Service: Client not initialized.")
            return None
        if not text:
            print("TTS Service: No text provided.")
            return None

        synthesis_input = SynthesisInput(text=text)
        # VoiceSelectionParams might differ for Gemini specific models.
        voice_params = VoiceSelectionParams(name=voice_name)
        audio_config = AudioConfig(
            audio_encoding=output_format.upper(), # Enum expects uppercase
            speaking_rate=speaking_rate,
            pitch=pitch
        )

        # Note: To use a specific Gemini model like "gemini-2.5-pro-preview-tts",
        # the 'model' parameter might need to be added to SynthesizeSpeechRequest
        # if the client library version supports it: model="gemini-2.5-pro-preview-tts"
        request = SynthesizeSpeechRequest(
            input=synthesis_input,
            voice=voice_params,
            audio_config=audio_config,
        )
        
        try:
            print(f"TTS Service: Synthesizing: '{text[:30]}...' voice: {voice_name}")
            # The client's synthesize_speech is synchronous.
            # Call it in a thread to avoid blocking asyncio event loop.
            response = await asyncio.to_thread(self.tts_client.synthesize_speech, request=request)
            print("TTS Service: Speech synthesized.")
            return response.audio_content
        except Exception as e:
            print(f"TTS Service: Error during synthesis: {e}")
            return None
```

## 4. How to Manually Add/Edit This File

1.  **Navigate** to the project directory: `echoes_of_the_unseen/`.
2.  Inside this directory, navigate to `src/game/services/`.
3.  **Create a new file** named `tts_service.py` if it doesn't exist, or open it if it does.
4.  **Copy and paste** the entire Python code block from Section 3 above into this `tts_service.py` file. Ensure no extra characters or formatting issues are introduced.
5.  **Save the file.**

## 5. Other Affected Files (Potentially Incomplete)

*   **`src/game/core/game_logic.py`**: This file also had issues saving its most recent intended changes, which included more detailed scene interactions for "The Listener's Study." The version currently in the system might be from an earlier stage.
*   **`src/main.py`**: This file was intended to be updated to use the real `TtsService`. Due to the issues with `tts_service.py`, `main.py` was last configured to use a `MockTTSClient` as a fallback.
*   **`src/game/services/__init__.py`**: This file should ideally export `TtsService` from `tts_service.py`. It was last configured to *not* do this, to prevent errors if `tts_service.py` was missing or incorrect. If `tts_service.py` is manually created, this `__init__.py` file should be updated to:
    ```python
    from .firestore_service import db, get_document, set_document, update_document, get_game_session, save_game_session, get_location_data
    from .tts_service import TtsService # Add this line

    __all__ = [
        "TtsService", # Add this
        "db", "get_document", "set_document", "update_document", 
        "get_game_session", "save_game_session", "get_location_data"
    ]
    ```

## 6. Next Steps After Manual File Creation

If you manually create/update `tts_service.py` (and ideally `services/__init__.py`), please let me know. I can then try to:
1.  Re-attempt the integration of the real `TtsService` into `main.py`.
2.  Re-attempt saving the more detailed `game_logic.py`.
3.  Proceed with further development steps.

Alternatively, we can continue using the `MockTTSClient` for now and defer full TTS integration.
```
