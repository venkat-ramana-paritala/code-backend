import requests

NODE_BACKEND_URL = "http://localhost:5001/api/inventory/alerts/low-stock"
EXPIRY_BACKEND_URL = "http://localhost:5001/api/inventory/alerts/expiry"

def fetch_low_stock():
    try:
        response = requests.get(NODE_BACKEND_URL, timeout=5)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e)}

def fetch_expiry_alerts():
    try:
        response = requests.get(EXPIRY_BACKEND_URL, timeout=5)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e)}
