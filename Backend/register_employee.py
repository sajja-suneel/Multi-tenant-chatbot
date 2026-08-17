import urllib.request
import urllib.error
import json

BASE_URL = "http://127.0.0.1:8000"

def make_post_request(url, payload, token=None):
    data = json.dumps(payload).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            err_body = json.loads(e.read().decode("utf-8"))
        except:
            err_body = e.reason
        return e.code, err_body
    except Exception as e:
        return 500, str(e)

def register_flow():
    # 1. Register Company
    print("Step 1: Registering Company 'AlphaCorp'...")
    comp_url = f"{BASE_URL}/auth/register-company"
    comp_payload = {
        "company_name": "AlphaCorp",
        "admin_name": "Suneel Sajja",
        "email": "admin@alphacorp.com",
        "password": "SUNEELqaz@1209"
    }
    
    status, body = make_post_request(comp_url, comp_payload)
    if status == 201:
        print("Company registered successfully!")
        print(body)
    elif status == 400:
        print("Company or email already exists. Moving to login...")
    else:
        print(f"Company registration returned status: {status}")
        print(body)

    # 2. Login as Admin
    print("\nStep 2: Logging in as Admin...")
    login_url = f"{BASE_URL}/auth/login"
    login_payload = {
        "email": "admin@alphacorp.com",
        "password": "SUNEELqaz@1209"
    }
    
    status, body = make_post_request(login_url, login_payload)
    token = None
    if status == 200:
        token = body["access_token"]
        print("Login successful! Token acquired.")
    else:
        print(f"Login failed: {status}")
        print(body)
        return

    # 3. Register Employee using the token
    print("\nStep 3: Registering Employee 'employee@alphacorp.com'...")
    emp_url = f"{BASE_URL}/auth/register-user"
    emp_payload = {
        "email": "employee@alphacorp.com",
        "password": "employee_password_123",
        "role": "employee"
    }
    
    status, body = make_post_request(emp_url, emp_payload, token)
    if status == 201:
        print("Employee registered successfully under AlphaCorp's tenant_id!")
        print(body)
    else:
        print(f"Employee registration failed with status: {status}")
        print(body)

if __name__ == "__main__":
    register_flow()