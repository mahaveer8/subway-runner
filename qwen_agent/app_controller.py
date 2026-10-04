import psutil
import subprocess
import os

def is_application_running(executable_name):
    """Check if an application is running by its executable name."""
    executable_name = executable_name.lower()
    for proc in psutil.process_iter(['name']):
        try:
            if proc.info['name'] and proc.info['name'].lower() == executable_name:
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return False

def open_application(executable_name):
    """Launch an application. Returns a status message."""
    if is_application_running(executable_name):
        return f"{executable_name} is already running."
    
    try:
        # On Windows, 'start' can sometimes launch apps if they are in PATH,
        # but using the executable name directly works if it's in PATH.
        # We use shell=True and start so it detaches.
        subprocess.Popen(f"start {executable_name}", shell=True)
        return f"{executable_name} opened successfully."
    except Exception as e:
        return f"Failed to open {executable_name}: {str(e)}"

def close_application(executable_name):
    """Close an application gracefully if possible. Returns a status message."""
    if not is_application_running(executable_name):
        return f"{executable_name} is not currently running."
    
    executable_name = executable_name.lower()
    terminated = False
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            if proc.info['name'] and proc.info['name'].lower() == executable_name:
                proc.terminate() # Graceful terminate
                terminated = True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    
    if terminated:
        return f"{executable_name} was closed successfully."
    else:
        return f"Could not close {executable_name}. Permission denied or process not found."

def list_running_applications(registry):
    """List registered applications that are currently running."""
    running_apps = []
    for app_name, exe in registry.items():
        if is_application_running(exe):
            running_apps.append(app_name)
    return running_apps
