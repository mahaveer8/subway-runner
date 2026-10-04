import requests
import json
import memory

# System prompt forcing JSON output for specific tools
SYSTEM_PROMPT = """You are a desktop automation agent. Your job is to translate user requests into structured tool calls.
You must output ONLY valid JSON. Do not include markdown formatting or extra text.
Available tools:
- {"action": "open_application", "application": "app_name"}
- {"action": "close_application", "application": "app_name"}
- {"action": "is_application_running", "application": "app_name"}
- {"action": "list_running_applications"}

Example 1:
User: "Open Chrome"
Output: {"action": "open_application", "application": "Chrome"}

Example 2:
User: "Close Spotify"
Output: {"action": "close_application", "application": "Spotify"}

Example 3:
User: "What apps are running?"
Output: {"action": "list_running_applications"}
"""

def parse_user_intent(user_input):
    """
    Calls the local Qwen model to parse intent.
    Returns a dictionary with the parsed tool call or an error.
    """
    config = memory.get_config()
    api_url = config.get("api_url", "http://127.0.0.1:11434/api/generate")
    model_name = config.get("model_name", "qwen 3:1.7b")
    
    payload = {
        "model": model_name,
        "prompt": f"{SYSTEM_PROMPT}\n\nUser: \"{user_input}\"\nOutput:",
        "stream": False,
        "format": "json" # Ollama supports enforcing JSON format
    }
    
    try:
        response = requests.post(api_url, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        response_text = data.get("response", "").strip()
        
        # Try to parse the response as JSON
        try:
            parsed_json = json.loads(response_text)
            return parsed_json
        except json.JSONDecodeError:
            return {"error": "Model did not return valid JSON.", "raw_response": response_text}
            
    except requests.exceptions.RequestException as e:
        return {"error": f"Failed to connect to local Qwen model: {str(e)}"}
