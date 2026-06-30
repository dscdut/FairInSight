from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, client_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def send_progress(self, client_id: str, step: str, status: str, error: str | None = None):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_json({
                    "step": step,
                    "status": status,
                    "error": error
                })
            except Exception:
                self.disconnect(client_id)

ws_manager = ConnectionManager()
