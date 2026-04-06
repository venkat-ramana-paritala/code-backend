from fastapi import FastAPI
from stock_fetcher import fetch_low_stock, fetch_expiry_alerts
from email_service import send_email
from ollama_client import chat_with_ollama

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

import os

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"status": "python backend running"}

@app.get("/low-stock")
def low_stock():
    data = fetch_low_stock()

    if data and len(data) > 0:
        send_email(
            subject="Low Stock Alert",
            body=f"Low stock items:\n\n{data}"
        )

    return {
        "count": len(data),
        "items": data
    }

@app.get("/chat")
def chat(q: str):
    # fetch current data
    low_stock = fetch_low_stock()
    expiry_data = fetch_expiry_alerts()

    # build context for the AI
    context = (
        "You are an intelligent assistant for a pharmacy inventory system.\n"
        "Here is the current live data:\n"
        f"--- LOW STOCK ALERTS ---\n{low_stock}\n"
        f"--- EXPIRY ALERTS ---\n{expiry_data}\n"
        "---\n"
        "Answer the user's question using ONLY this data when relevant.\n"
        "If asked for sales predictions or suggestions, recommend selling items appearing in 'expiry alerts' or 'near expiry' to avoid loss.\n"
        "Be concise, professional, and actionable.\n\n"
        f"User question: {q}"
    )

    reply = chat_with_ollama(context)
    return {"reply": reply}

@app.get("/predict-sales")
def predict_sales():
    # Simple heuristic: Recommend pushing sales for items near expiry
    expiry_data = fetch_expiry_alerts()
    recommendations = []
    
    if "nearExpiry" in expiry_data and isinstance(expiry_data["nearExpiry"], list):
        for item in expiry_data["nearExpiry"]:
             recommendations.append({
                 "drug": item.get("Drug_Name", "Unknown"),
                 "reason": f"Expiring on {item.get('Expiry_Date', 'soon')}. Promote to avoid waste."
             })
    
    return {
        "prediction_type": "Avoidance of Loss",
        "recommendations": recommendations,
        "message": "Focus on selling these items before they expire."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
