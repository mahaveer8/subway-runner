import safety
import app_controller
import memory
import time

def print_result(name, result):
    print(f"--- Test: {name} ---")
    print(result)
    print()

# Test 1: Registry check
print_result("Initial Registry", memory.get_registry())

# Test 2: Is Calculator running?
print_result("Is Calc running?", safety.execute_tool("is_application_running", "calculator", print))

# Test 3: Open Calculator
success, msg, conf, data = safety.execute_tool("open_application", "calculator", print)
print_result("Open Calc", msg)

time.sleep(2) # Wait for it to open

# Test 4: Is Calculator running now?
print_result("Is Calc running now?", safety.execute_tool("is_application_running", "calculator", print))

# Test 5: Close Calculator (asks for confirmation)
success, msg, conf, data = safety.execute_tool("close_application", "calculator", print)
print_result("Close Calc (Request)", f"Needs conf: {conf}, Msg: {msg}")

if conf:
    # Simulate user saying Yes
    res = safety.execute_confirmed_action(data)
    print_result("Close Calc (Confirmed)", res)

time.sleep(1)

# Test 6: Is Calculator running after close?
print_result("Is Calc running after close?", safety.execute_tool("is_application_running", "calculator", print))

# Test 7: Unknown application
print_result("Open Unknown", safety.execute_tool("open_application", "unknown_app", print))
