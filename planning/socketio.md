1. Socket connection lives in GameProvider (context) — create one connection, not per component. Since
   you already have GameProvider managing game state, the socket fits naturally there.
2. Don't use useEffect watching state to auto-emit — you asked if you could watch playerState changes and
   auto-broadcast via useEffect. The answer was no — that leads to infinite loops and duplicate emissions.
3. Emit explicitly at the point of action — when a player opens a capsule, call
   socket.emit("openCapsule", capsuleId) directly in the handler function inside your context, not in a
   reactive useEffect.
4. useEffect in context is only for listening — subscribe to server broadcasts on mount, clean up on
   unmount.
5. The flow:
   user action → emit to server → server broadcasts to all clients → context receives broadcast → updates
   state → components re-render
