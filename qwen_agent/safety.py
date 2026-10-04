import app_controller
import memory

def execute_tool(intent, app_name, ui_callback):
    """
    Executes a tool based on parsed intent. 
    ui_callback is a function to send messages back to the UI.
    Returns (success, message, requires_confirmation, confirmation_data).
    """
    registry = memory.get_registry()
    app_key = app_name.lower().strip()
    
    # Tool: list_running_applications doesn't need a specific app
    if intent == "list_running_applications":
        running = app_controller.list_running_applications(registry)
        if running:
            return True, f"Running applications: {', '.join(running)}", False, None
        else:
            return True, "No registered applications are currently running.", False, None

    # Check if application is in registry
    # Simple fuzzy matching (e.g. "Google Chrome" -> "chrome")
    matched_exe = None
    matched_app_name = None
    for key, exe in registry.items():
        if key in app_key or app_key in key:
            matched_exe = exe
            matched_app_name = key
            break
            
    if not matched_exe:
        return False, f"Application '{app_name}' is not registered in the system. I cannot control it safely.", False, None

    if intent == "is_application_running":
        is_running = app_controller.is_application_running(matched_exe)
        status = "running" if is_running else "not running"
        return True, f"{matched_app_name.capitalize()} is currently {status}.", False, None
        
    elif intent == "open_application":
        result = app_controller.open_application(matched_exe)
        return True, result, False, None
        
    elif intent == "close_application":
        config = memory.get_config()
        # Safety: Check if we need confirmation
        if config.get("require_confirmation_for_close", True):
            confirmation_data = {
                "action": "close",
                "executable": matched_exe,
                "app_name": matched_app_name
            }
            return True, f"This action will close {matched_app_name.capitalize()}. Continue?", True, confirmation_data
        else:
            result = app_controller.close_application(matched_exe)
            return True, result, False, None
            
    else:
        return False, f"Unknown action: {intent}", False, None

def execute_confirmed_action(confirmation_data):
    """Execute an action that has been confirmed by the user."""
    if confirmation_data["action"] == "close":
        result = app_controller.close_application(confirmation_data["executable"])
        return result
    return "Invalid confirmation data."
