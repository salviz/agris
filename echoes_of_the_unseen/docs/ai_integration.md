## 6. AI-Powered Audio and Interaction Experience
AI is central to creating the dynamic, immersive, and accessible audio world of "Echoes of the Unseen."

### 6.1. Text-to-Speech (TTS)
*   **Primary Narration and Dialogue**: Google's Gemini 2.5 Pro (or a similar high-quality model available via API) will be used for the main game narration and character dialogues. The goal is to achieve natural, expressive speech.
*   **Voice Variety**: Different voices will be assigned to different characters and the narrator. If the API allows, voice characteristics (pitch, speed, emotion) might be dynamically adjusted based on context.
*   **Accessibility**: High-quality TTS is inherently accessible. Options for changing voice or speed will be considered.

### 6.2. Procedural Sound Effect Generation
*   **ElevenLabs Sound Effects API (or similar)**: This will be used to generate a wide range of sound effects on demand. Instead of relying solely on a pre-recorded sound library, this allows for more dynamic and unique audio events.
*   **Examples**: Footsteps on different surfaces, environmental ambiances (rain, wind, city hum), object interaction sounds (door creaks, clock ticking variations, paper rustling), and abstract sounds for "sonic echoes."
*   **Layering and Real-time Modification**: The system will aim to layer sounds to create rich soundscapes. Some parameters of generated sounds (e.g., intensity, frequency) might be modified in real-time based on game events.

### 6.3. LLM for Dynamic Narrative and Dialogue
*   **Google's Gemini 2.5 Pro (or similar)**:
    *   **Dynamic Dialogue Generation**: While key plot dialogues might be scripted, LLMs can generate responses for less critical NPC interactions, or variations in dialogue based on player actions or previously discovered clues. This can make the game world feel more reactive.
    *   **Hint System/Clue Interpretation**: The LLM can provide contextual hints if the player is stuck, or offer interpretations of complex "sonic echoes" if the player requests assistance.
    *   **Environmental Descriptions**: Generate varied descriptions of environments or objects based on player interaction or location.
*   **Prompt Engineering**: Significant effort will be invested in designing effective prompts to guide the LLM's output, ensuring it aligns with the game's tone, narrative, and the specific context of the interaction. Guardrails will be implemented to prevent inappropriate or nonsensical responses.

### 6.4. Voice Command Input
*   **Google Cloud Speech-to-Text API**: This will be the primary method for player input, enhancing immersion.
*   **Natural Language Understanding (NLU)**: While simple commands ("go north," "examine clock") will be the baseline, the system will aim for some level of NLU to interpret more complex player utterances.
*   **Contextual Awareness**: The recognized commands will be interpreted based on the current game state. For example, "look at it" would refer to the object most recently mentioned or interacted with.
*   **Grammar and Command Design**:
    *   A clear voice command grammar will be designed and communicated to the player (e.g., through a tutorial or help system).
    *   Focus on action verbs relevant to gameplay: `examine [object]`, `go [direction/location]`, `talk to [character]`, `use [item] on [object/character]`, `listen for echoes`.
    *   Feedback mechanism for misunderstood commands.

**Table 2: AI Service Integration Summary**
| AI Feature                      | Google Technology / Service (Primary Choice) | Backup/Alternative    | Key Considerations                                                                 |
| :------------------------------ | :------------------------------------------- | :-------------------- | :--------------------------------------------------------------------------------- |
| Text-to-Speech (TTS)            | Gemini 2.5 Pro (via API) / Google Cloud TTS  | Other commercial TTS  | Voice quality, emotional range, latency, cost.                                     |
| Procedural Sound Effects        | ElevenLabs API                               | Custom sound library  | Variety, controllability, integration ease, cost.                                  |
| Dynamic Dialogue / Narrative    | Gemini 2.5 Pro (via API)                     | Simpler rule-based system | Prompt engineering, coherence, preventing off-topic responses, latency, cost.    |
| Voice Command Input             | Google Cloud Speech-to-Text                  | Keyboard input only   | Accuracy, NLU capabilities, latency, handling accents/noise.                       |

#### 6.4.1. Command Structure Examples:
*   **Movement**: "Go North", "Move to the square", "Enter the shop", "Follow the sound of water."
*   **Interaction**: "Examine the desk", "Pick up the key", "Talk to the merchant", "Listen to the echoes from the alley."
*   **Inventory (Conceptual)**: "Use the old key on the locked chest", "Check my sound journal."
*   **Game Control**: "Repeat last description", "What are my options?", "Save game", "Help."

#### 6.4.2. Feedback for Voice Commands:
*   **Confirmation**: Narrator confirms valid commands implicitly ("You move towards the old library...") or explicitly for critical actions ("Are you sure you want to accuse Silas?").
*   **Error Handling**: If a command isn't understood: "I didn't quite catch that. Could you try rephrasing? You could say 'go to [location]' or 'examine [object]'." Or, "You can't do that right now."
*   **Contextual Prompts**: After describing a scene, the narrator might suggest possible actions: "The old chest is locked. You could try to examine it more closely, or perhaps look for a key."

#### 6.4.3. "Tuning" Sonic Echoes (Voice Interaction Example):
*   **Narrator**: "You sense a faint sonic echo around the broken music box. It's distorted, like multiple sounds overlaid."
*   **Player**: "Try to isolate the melody."
*   **System**: (Applies filter, plays a clearer melody)
*   **Narrator**: "The haunting melody becomes clearer. It sounds familiar..."
*   **Player**: "Focus on the background noise."
*   **System**: (Reduces melody, enhances background sounds like a distant conversation)
*   **Narrator**: "Beneath the tune, you can just make out the faint murmur of two voices, too indistinct to understand yet."
This iterative interaction, guided by voice, makes the player an active participant in the discovery process.
