from google.cloud import aiplatform
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
            client_options = {"api_endpoint": f"{self.location}-aiplatform.googleapis.com"}
            self.tts_client = TextToSpeechClient(client_options=client_options)
            print(f"TtsService initialized with project: {self.project_id}, location: {self.location}, endpoint: {client_options['api_endpoint']}")
        except Exception as e:
            print(f"Error initializing TextToSpeechClient: {e}")
            self.tts_client = None

    async def synthesize_speech(
        self, text: str, voice_name: Optional[str] = "en-US-Standard-C",
        speaking_rate: Optional[float] = 1.0, pitch: Optional[float] = 0.0,
        output_format: str = "MP3"
    ) -> Optional[bytes]:
        if not self.tts_client:
            print("TTS Service: Client not initialized.")
            return None
        if not text:
            print("TTS Service: No text provided.")
            return None
        
        synthesis_input = SynthesisInput(text=text)
        voice_params = VoiceSelectionParams(name=voice_name)
        audio_config = AudioConfig(
            audio_encoding=output_format.upper(),
            speaking_rate=speaking_rate,
            pitch=pitch
        )
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
