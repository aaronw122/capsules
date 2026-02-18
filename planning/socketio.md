Socket.IO uses named events on a single connection. You don't define different socket types — you just   
  agree on event names between client and server.                                                          
                                                                                                           
  // Server emits     
  // endTime = current time + 5mins    
  io.emit("gameStart", { endsAt: endTime })
  io.emit("gameOver", {})                                                                                
  io.emit("leaderboardUpdate", { players: [...] })                                                         
                                                                                                           
  // Client emits
  socket.emit("openCapsule", { capsuleId: "abc123" })
  socket.emit("submitPhrase", { phrase: "FRACTAL" })

  Both sides just listen for the event names they care about:

  // Client listens
  socket.on("gameStart", (data) => { ... })
  socket.on("leaderboardUpdate", (data) => { ... })

  // Server listens
  socket.on("openCapsule", (data) => { ... })

  That's it. One connection, named events. No routing, no types. Just strings you pick and stay consistent
  with between client and server.
