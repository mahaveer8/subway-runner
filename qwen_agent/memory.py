import json
import os

CONFIG_FILE = "config.json"
REGISTRY_FILE = "registry.json"

DEFAULT_CONFIG = {
    "model_name": "qwen 3:1.7b",
    "api_url": "http://127.0.0.1:11434/api/generate",
    "runtime_type": "ollama",
    "require_confirmation_for_close": True
}

DEFAULT_REGISTRY = {
    "chrome": "chrome.exe",
    "notepad": "notepad.exe",
    "calculator": "calc.exe",
    "vscode": "Code.exe",
    "spotify": "Spotify.exe",
    "edge": "msedge.exe"
}

def load_json(filepath, default_data):
    if not os.path.exists(filepath):
        with open(filepath, 'w') as f:
            json.dump(default_data, f, indent=4)
        return default_data
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return default_data

def save_json(filepath, data):
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4)

def get_config():
    return load_json(CONFIG_FILE, DEFAULT_CONFIG)

def save_config(config):
    save_json(CONFIG_FILE, config)

def get_registry():
    return load_json(REGISTRY_FILE, DEFAULT_REGISTRY)

def save_registry(registry):
    save_json(REGISTRY_FILE, registry)

def add_to_registry(app_name, executable):
    registry = get_registry()
    registry[app_name.lower()] = executable
    save_registry(registry)
