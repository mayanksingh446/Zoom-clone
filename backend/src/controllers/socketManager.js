import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("somethin happen");
    // Listen for join-call event from frontend
    socket.on("join-call", (path) => {
      if (connections[path] === undefined) {
        connections[path] = [];
      }

      const existingClients = [...connections[path]];

      // Notify existing users that a new user joined
      existingClients.forEach((clientId) => {
        io.to(clientId).emit("user-joined", socket.id);
      });

      // Tell the joining user who is already in the room
      io.to(socket.id).emit("existing-users", existingClients);

      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      // Check if room has previous messages
      if (messages[path] !== undefined) {
        // Send old messages to newly joined user
        for (let a = 0; a < messages[path].length; a++) {
          io.to(socket.id).emit(
            "chat-message",
            messages[path][a]["data"],
            messages[path][a]["sender"], // Sender name
            messages[path][a]["socket-id-sender"],
          ); // Sender socket id
        }
      }
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      // Find which room the current socket belongs to
      const [matchingRoom, found] = Object.entries(connections)
        // Loop through all rooms
        .reduce(
          ([room, isFound], [roomKey, roomValue]) => {
            // Check if room contains current socket id
            if (!isFound && roomValue.includes(socket.id)) {
              // Return room name and true if found
              return [roomKey, true];
            }
            // Return empty string and false if not found
            return [room, isFound];
          },
          ["", false],
        );

      if (found === true) {
        // Create message array for room if it doesn't exist
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = [];
        }
        // Save message to room's message array ( in memory)
        messages[matchingRoom].push({
          // Actual message
          data: data,
          sender: sender,
          "socket-id-sender": socket.id,
        });

        // Log message on server console
        console.log("message", matchingRoom, ":", sender, data);

        // Send message to all users in room except the sender
        connections[matchingRoom].forEach((elem) => {
          io.to(elem).emit("chat-message", data, sender, socket.id);
        });
      }
      //           Finds user's room.
      //           Stores message in messages.
      //           Logs message.
      //           Sends message to everyone in that room.
    });
    socket.on("disconnect", () => {
      // Calculate how long this user was online
      var diffTime = Math.abs(new Date() - timeOnline[socket.id]);

      var key;

      // Loop through all rooms
      for (const [k, v] of Object.entries(connections)) {
        // Check if disconnected socket exists in this room
        if (v.includes(socket.id)) {
          // Store room key
          key = k;

          // Tell all users in this room that this user left
          for (let a = 0; a < connections[key].length; a++) {
            io.to(connections[key][a]).emit("user-left", socket.id);
          }

          // Find disconnected user index
          var index = connections[key].indexOf(socket.id);

          // Remove disconnected user
          if (index !== -1) {
            connections[key].splice(index, 1);
          }

          // Delete room if empty
          if (connections[key].length === 0) {
            delete connections[key];
          }

          break;
        }
      }

      // Optional cleanup
      delete timeOnline[socket.id];
    });
  });

  return io;
};
