

## Add Voice Input to Music AI Assistant

### What It Does

Adds a microphone button next to the send button in the Music AI chat. Tap it to speak your question -- the browser converts your speech to text and sends it automatically.

### How It Works

Uses the browser's built-in Speech Recognition API (Web Speech API) -- no extra dependencies or API keys needed. Supported in Chrome, Edge, Safari, and most mobile browsers.

- Tap the mic icon to start listening
- The mic icon pulses/animates while recording
- Speech is transcribed into the input field
- When you stop speaking, the message sends automatically
- If the browser doesn't support speech recognition, the mic button simply won't appear

### File to Change

**`src/components/practice-log/MusicAI.tsx`**

1. Add a `Mic` icon import from lucide-react
2. Add state for `isListening` (boolean)
3. Add a `SpeechRecognition` ref and a `toggleListening` function that:
   - Creates a `webkitSpeechRecognition` / `SpeechRecognition` instance
   - Sets language to `"en-US"` and `interimResults = false`
   - On result: sets the input text and calls `send()`
   - On end: sets `isListening` to false
4. Add a mic button between the text input and the send button, styled with a pulse animation when active
5. Only render the mic button if `SpeechRecognition` is available in the browser

### No Existing Features Affected

The existing text input and send button remain unchanged. The mic button is purely additive.

