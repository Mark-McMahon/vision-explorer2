from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from vision_llm import call_vision_llm
from models import EnrichmentRequest, EnrichmentResponse

# Import config — will raise ValueError if ANTHROPIC_API_KEY missing.
# We catch it so the server still starts during development without a key.
try:
    from config import FRONTEND_ORIGIN
except ValueError:
    FRONTEND_ORIGIN = "http://localhost:5173"

app = FastAPI(title="Vision Explorer Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def health_check():
    return {"status": "ok"}


@app.websocket("/enrich")
async def enrich(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            try:
                data = await websocket.receive_json()
                request = EnrichmentRequest(**data)
            except (ValueError, ValidationError) as exc:
                print(f"Invalid request: {exc}")
                continue

            try:
                result = await call_vision_llm(request.cropBase64, request.label)
                response = EnrichmentResponse(
                    trackId=request.trackId,
                    **result,
                )
                await websocket.send_json(response.model_dump())
            except Exception as exc:
                print(f"Error processing trackId {request.trackId}: {exc}")
                await websocket.send_json({"error": True, "trackId": request.trackId})

    except WebSocketDisconnect:
        print("Client disconnected")
