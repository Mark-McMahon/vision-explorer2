import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from vision_llm import call_vision_llm

# Import config — will raise ValueError if ANTHROPIC_API_KEY missing.
# We do a lazy import so the server still starts during scaffolding.
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
                raw = await websocket.receive_text()
                data = json.loads(raw)
            except json.JSONDecodeError:
                print("Received invalid JSON — skipping")
                continue

            track_id = data.get("trackId")
            label = data.get("label", "object")
            crop_base64 = data.get("cropBase64", "")

            try:
                result = await call_vision_llm(crop_base64, label)
                response = {"status": "ok", "trackId": track_id, **result}
                await websocket.send_json(response)
            except Exception as exc:
                print(f"Error processing trackId {track_id}: {exc}")
                await websocket.send_json({"status": "error", "trackId": track_id})

    except WebSocketDisconnect:
        print("Client disconnected")
