# Local Qwen Agent

A safe, reliable local desktop AI agent that uses a locally downloaded Qwen model (via Ollama) as its language/reasoning engine.

## Features
- **Local AI:** Connects to your local Qwen model. No cloud LLM required.
- **Application Control:** Open and close registered applications.
- **Safety First:** Strict safety layer. The LLM cannot execute arbitrary shell commands. Only registered apps can be launched or closed.
- **Confirmation System:** Requires explicit confirmation before closing applications.
- **Local Memory:** Remembers aliases and settings using JSON files (`config.json` and `registry.json`).

## Installation

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Make sure you have Ollama running locally with a Qwen model installed. For example:
   ```bash
   ollama run qwen2.5:1.5b
   ```

3. Run the application:
   ```bash
   python main.py
   ```

## Configuration
The `config.json` and `registry.json` files are automatically created on the first run.
- **config.json**: Edit this to change the model name, API URL, or disable close confirmations.
- **registry.json**: Edit this to add new applications (e.g., `"spotify": "Spotify.exe"`).

## Example Commands
- "Open Calculator"
- "Launch VS Code"
- "Close Notepad"
- "What applications are running?"
