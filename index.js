export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/room/")) {
      const id = env.CHESS_ROOMS.idFromName(url.pathname.split("/")[2] || "lobby");
      return env.CHESS_ROOMS.get(id).fetch(request);
    }
    return new Response("My Chess Journey backend is running.", { headers: { "content-type": "text/plain" } });
  }
};
export class ChessRoom {
  constructor(state) { this.state = state; }
  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") return new Response("WebSocket required", { status: 426 });
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server);
    server.send(JSON.stringify({ type: "connected", message: "Room connected. Starter relay only." }));
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(sender, message) {
    for (const socket of this.state.getWebSockets()) if (socket !== sender) {
      try { socket.send(message); } catch {}
    }
  }
  async webSocketClose() {}
}