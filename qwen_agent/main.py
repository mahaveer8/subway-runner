import tkinter as tk
from tkinter import scrolledtext
from tkinter import messagebox
import threading
import datetime
import json
import psutil

import memory
import agent
import safety
import app_controller

class QwenAgentUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Local Qwen Agent")
        self.root.geometry("600x700")
        self.root.configure(bg="#1e1e2e")
        
        self.config = memory.get_config()
        self.registry = memory.get_registry()
        
        self.pending_confirmation = None
        
        self.create_widgets()
        self.update_status("Checking model status...")
        self.check_model_status()
        self.update_running_apps()
        
    def create_widgets(self):
        # Top Frame for Status
        status_frame = tk.Frame(self.root, bg="#1e1e2e")
        status_frame.pack(fill=tk.X, padx=10, pady=5)
        
        self.status_label = tk.Label(status_frame, text="Status: Initializing...", fg="#a6e3a1", bg="#1e1e2e", font=("Arial", 10, "bold"))
        self.status_label.pack(side=tk.LEFT)
        
        self.model_label = tk.Label(status_frame, text=f"Model: {self.config['model_name']}", fg="#cba6f7", bg="#1e1e2e", font=("Arial", 10))
        self.model_label.pack(side=tk.RIGHT)
        
        # Middle Frame for Chat/Log
        chat_frame = tk.Frame(self.root, bg="#1e1e2e")
        chat_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        self.chat_area = scrolledtext.ScrolledText(chat_frame, wrap=tk.WORD, bg="#313244", fg="#cdd6f4", font=("Consolas", 10))
        self.chat_area.pack(fill=tk.BOTH, expand=True)
        self.chat_area.config(state=tk.DISABLED)
        
        # Running Apps Frame
        apps_frame = tk.Frame(self.root, bg="#1e1e2e")
        apps_frame.pack(fill=tk.X, padx=10, pady=5)
        
        tk.Label(apps_frame, text="Registered Running Apps:", fg="#89dceb", bg="#1e1e2e").pack(side=tk.LEFT)
        self.running_apps_label = tk.Label(apps_frame, text="None", fg="#f38ba8", bg="#1e1e2e")
        self.running_apps_label.pack(side=tk.LEFT, padx=5)
        
        # Bottom Frame for Input
        input_frame = tk.Frame(self.root, bg="#1e1e2e")
        input_frame.pack(fill=tk.X, padx=10, pady=10)
        
        self.input_entry = tk.Entry(input_frame, bg="#45475a", fg="#cdd6f4", font=("Arial", 12), insertbackground="#cdd6f4")
        self.input_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))
        self.input_entry.bind("<Return>", self.send_message)
        
        self.send_button = tk.Button(input_frame, text="Send", command=self.send_message, bg="#89b4fa", fg="#1e1e2e", font=("Arial", 10, "bold"))
        self.send_button.pack(side=tk.RIGHT)

        # Confirmation Frame (hidden by default)
        self.conf_frame = tk.Frame(self.root, bg="#f38ba8")
        
        self.conf_label = tk.Label(self.conf_frame, text="Confirmation required", bg="#f38ba8", fg="#1e1e2e", font=("Arial", 10, "bold"))
        self.conf_label.pack(side=tk.LEFT, padx=5, pady=5)
        
        self.btn_yes = tk.Button(self.conf_frame, text="Yes", command=self.confirm_yes, bg="#a6e3a1", fg="#1e1e2e")
        self.btn_yes.pack(side=tk.RIGHT, padx=5, pady=5)
        
        self.btn_no = tk.Button(self.conf_frame, text="No", command=self.confirm_no, bg="#eba0ac", fg="#1e1e2e")
        self.btn_no.pack(side=tk.RIGHT, padx=5, pady=5)

    def log_message(self, tag, message):
        self.chat_area.config(state=tk.NORMAL)
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        formatted_msg = f"[{timestamp}] {tag}: {message}\n"
        self.chat_area.insert(tk.END, formatted_msg)
        self.chat_area.see(tk.END)
        self.chat_area.config(state=tk.DISABLED)

    def update_status(self, text, color="#a6e3a1"):
        self.status_label.config(text=f"Status: {text}", fg=color)

    def check_model_status(self):
        def check():
            try:
                import requests
                # Just checking if Ollama is running
                res = requests.get(self.config["api_url"].replace("/api/generate", "/api/version"), timeout=2)
                if res.status_code == 200:
                    self.root.after(0, lambda: self.update_status("Connected to Ollama", "#a6e3a1"))
                else:
                    self.root.after(0, lambda: self.update_status("Ollama Error", "#f38ba8"))
            except:
                self.root.after(0, lambda: self.update_status("Qwen/Ollama Unavailable", "#f38ba8"))
        threading.Thread(target=check, daemon=True).start()

    def update_running_apps(self):
        def check():
            running = app_controller.list_running_applications(self.registry)
            running_text = ", ".join(running) if running else "None"
            self.root.after(0, lambda: self.running_apps_label.config(text=running_text))
            self.root.after(5000, self.update_running_apps) # Check every 5 seconds
        threading.Thread(target=check, daemon=True).start()

    def send_message(self, event=None):
        user_input = self.input_entry.get().strip()
        if not user_input:
            return
            
        if self.pending_confirmation:
            self.log_message("System", "Please answer the confirmation prompt.")
            return

        self.input_entry.delete(0, tk.END)
        self.log_message("User", user_input)
        
        self.send_button.config(state=tk.DISABLED)
        self.update_status("Thinking...", "#f9e2af")
        
        threading.Thread(target=self.process_request, args=(user_input,), daemon=True).start()

    def process_request(self, user_input):
        # 1. Get intent from Qwen
        intent_data = agent.parse_user_intent(user_input)
        
        if "error" in intent_data:
            self.root.after(0, self.handle_error, intent_data["error"])
            return
            
        self.root.after(0, self.log_message, "Qwen Intent", json.dumps(intent_data))
        
        action = intent_data.get("action")
        app_name = intent_data.get("application", "")
        
        if not action:
            self.root.after(0, self.handle_error, "Qwen did not return a valid action.")
            return

        # 2. Execute safely
        success, message, requires_conf, conf_data = safety.execute_tool(action, app_name, self.log_message)
        
        if requires_conf:
            self.root.after(0, self.ask_confirmation, message, conf_data)
        else:
            self.root.after(0, self.finish_processing, message, success)

    def ask_confirmation(self, message, conf_data):
        self.pending_confirmation = conf_data
        self.log_message("Safety", message)
        self.conf_label.config(text=message)
        self.conf_frame.pack(fill=tk.X, padx=10, pady=5, before=self.root.pack_slaves()[-1])
        self.update_status("Waiting for confirmation...", "#fab387")
        self.send_button.config(state=tk.NORMAL)

    def confirm_yes(self):
        self.conf_frame.pack_forget()
        data = self.pending_confirmation
        self.pending_confirmation = None
        self.log_message("User", "Confirmed YES")
        
        self.update_status("Executing...", "#f9e2af")
        threading.Thread(target=self.execute_confirmed, args=(data,), daemon=True).start()

    def confirm_no(self):
        self.conf_frame.pack_forget()
        self.pending_confirmation = None
        self.log_message("User", "Confirmed NO")
        self.log_message("System", "Action cancelled.")
        self.update_status("Connected", "#a6e3a1")
        self.send_button.config(state=tk.NORMAL)

    def execute_confirmed(self, data):
        result = safety.execute_confirmed_action(data)
        self.root.after(0, self.finish_processing, result, True)

    def handle_error(self, error_msg):
        self.log_message("Error", error_msg)
        self.finish_processing("Action failed due to error.", False)

    def finish_processing(self, message, success):
        tag = "System" if success else "Safety"
        self.log_message(tag, message)
        self.update_status("Connected", "#a6e3a1")
        self.send_button.config(state=tk.NORMAL)
        self.input_entry.focus()

if __name__ == "__main__":
    root = tk.Tk()
    app = QwenAgentUI(root)
    root.mainloop()
