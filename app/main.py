from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "AI Career Intelligence API is working!"}