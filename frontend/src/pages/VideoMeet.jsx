import React, { useEffect, useRef, useState } from "react";
import { Badge, IconButton, TextField } from "@mui/material";
import Button from "@mui/material/Button";
import io from "socket.io-client";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import CallEndIcon from "@mui/icons-material/CallEnd";
import ChatIcon from "@mui/icons-material/Chat";
import { useNavigate } from "react-router-dom";

import style from "../styles/videoComponent.module.css";

//step-1

// URL of backend/socket server
const serverUrl = "https://zoom-clone-backend-4dey.onrender.com";

// Stores all WebRTC peer connections
var connections = {};

// Configuration for WebRTC peer connection
const peerConfiConnections = {
  // ICE servers help users discover each other over the internet
  iceServers: [
    {
      // Google's free STUN server
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

const VideoMeet = () => {
  const navigate = useNavigate();

  // Stores socket.io connection object
  var socketRef = useRef();

  // Stores current user's socket id
  let socketIdRef = useRef();

  // Reference to local video element
  let localVideoRef = useRef();

  // Checks whether camera device exists
  let [videoAvailable, setVideoAvailable] = useState(true);

  // Checks whether microphone exists
  let [audioAvailbale, setAudioAvailable] = useState(true);

  // Camera ON/OFF state
  let [video, setVideo] = useState(false);

  // Microphone ON/OFF state
  let [audio, setAudio] = useState(false);

  // Screen sharing ON/OFF state
  let [screen, setScreen] = useState(false);

  // Controls modal popup visibility
  let [showModal, setShowModal] = useState(false);

  // Checks whether screen sharing is supported
  let [screenAvailable, setScreenAvailable] = useState(false);

  // Stores all chat messages
  let [messages, setMessages] = useState([]);

  // Stores current message being typed
  let [message, setMessage] = useState("");

  // Number of unread messages
  let [newMessages, setNewMessages] = useState(0);

  // Show username input screen initially
  let [askForUsername, setAskForUsername] = useState(true);

  // Stores user's entered name
  let [username, setUsername] = useState("");

  // References to all remote video elements
  const videoRef = useRef([]);

  // Stores all participant video streams
  let [videos, setVideos] = useState([]);

  //soket id
  const [mySocketId, setMySocketId] = useState("");

  //This function is responsible for requesting camera and microphone permissions from the browser. It is commonly used in video calling applications such as Google Meet, Zoom, and WebRTC projects. After permission is granted, it obtains the media stream and attaches it to a video element so the user can see their own camera preview before joining the meeting.

  const getpermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setVideoAvailable(true);
      setAudioAvailable(true);

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      window.localStream = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.log("Permission error:", error);
      setVideoAvailable(false);
      setAudioAvailable(false);
    }
  };

  useEffect(() => {
    getpermissions();
  }, []);

  // step -2

  //When a user joins a meeting:
  // The application needs to turn ON the camera and microphone.
  // It requests permission from the browser.
  // If permission is granted, a media stream is created.
  // If the user turns OFF camera/microphone, all active tracks are stopped.
  // React automatically listens for camera/microphone state changes and updates the stream accordingly.

  // Function called when browser successfully provides camera/microphone stream

  // step - 4

  let getUserMediaSuccess = (stream) => {
    // stream contains camera video track and microphone audio track

    try {
      // Stop old local stream tracks if already running
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    // Store new camera/mic stream globally
    window.localStream = stream;

    // Show our own camera video in local video tag
    localVideoRef.current.srcObject = stream;

    // Send this new stream to all existing peer connections
    for (let id in connections) {
      // Skip own socket id
      if (id === socketIdRef.current) continue;

      // Add local stream to peer connection
    window.localStream.getTracks().forEach((track) => {
  const sender = connections[id]
    .getSenders()
    .find((s) => s.track && s.track.kind === track.kind);

  if (sender) {
    sender.replaceTrack(track);
  } else {
    connections[id].addTrack(track, window.localStream);
  }
});

      // Create new SDP offer because stream changed
      connections[id]
        .createOffer()
        .then((description) => {
          // Set offer as local description
          connections[id]
            .setLocalDescription(description)
            .then(() => {
              // Send SDP offer to other user through socket
              socketRef.current.emit(
                "signal",
                id,
                JSON.stringify({
                  sdp: connections[id].localDescription,
                }),
              );
            })
            .catch((e) => console.log(e));
        })
        .catch((e) => console.log(e));
    }

    // When camera/mic track ends
    // Example: user stops camera permission or device disconnects
    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          // Update React state
          setVideo(false);
          setAudio(false);

          try {
            // Stop current local video/audio tracks
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          // Create black video + silent audio stream
          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);

          // Replace local stream with black/silent stream
          window.localStream = blackSilence();

          // Show black/silent stream locally
          localVideoRef.current.srcObject = window.localStream;

          // Send black/silent stream to all peer connections
          for (let id in connections) {
            window.localStream.getTracks().forEach((track) => {
              const sender = connections[id]
                .getSenders()
                .find((s) => s.track && s.track.kind === track.kind);

              if (sender) {
                sender.replaceTrack(track);
              } else {
                connections[id].addTrack(track, window.localStream);
              }
            });

            connections[id]
              .createOffer()
              .then((description) => {
                connections[id]
                  .setLocalDescription(description)
                  .then(() => {
                    socketRef.current.emit(
                      "signal",
                      id,
                      JSON.stringify({
                        sdp: connections[id].localDescription,
                      }),
                    );
                  })
                  .catch((e) => console.log(e));
              })
              .catch((e) => console.log(e));
          }
        }),
    );
  };

  let black = ({ width = 640, height = 480 } = {}) => {
    // Create canvas
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });

    // Fill canvas with black color
    canvas.getContext("2d").fillRect(0, 0, width, height);

    // Capture canvas as video stream
    let stream = canvas.captureStream();

    // Return disabled video track
    return Object.assign(stream.getVideoTracks()[0], {
      enabled: false,
    });
  };

  let silence = () => {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const dst = oscillator.connect(ctx.createMediaStreamDestination());

  oscillator.start();

  const track = dst.stream.getAudioTracks()[0];
  track.enabled = false;

  return track;
};

  //step - 4 -flow both getUserMediaSuccess() + black
  // Camera/mic stream mila
  // ↓
  // Old stream stop karo
  // ↓
  // New stream local video me show karo
  // ↓
  // New stream sab connected users ko bhejo
  // ↓
  // Agar stream band ho jaye, black video + silent audio bhejo
  // black() fake black video banata hai.
  // silence() fake silent audio banata hai.

  // Step 2: Function responsible for starting/stopping media devices
  let getUserMedia = () => {
    // Check whether camera or microphone should be enabled
    // and whether those devices are available
    if ((video && videoAvailable) || (audio && audioAvailbale)) {
      // Request camera and microphone access from browser
      navigator.mediaDevices
        .getUserMedia({
          video: video,
          audio: audio,
        })

        // Execute success function when stream is received
        .then(getUserMediaSuccess)

        // Additional processing can be done here
        .then((stream) => {})

        // Handle permission/device errors
        .catch((e) => console.log(e));
    } else {
      // Execute when both camera and microphone are OFF
      try {
        // Get all active tracks from current media stream
        let tracks = localVideoRef.current.srcObject.getTracks();

        // Stop every track
        // This turns off webcam and microphone completely
        tracks.forEach((track) => track.stop());
      } catch (error) {
        // Ignore errors if no stream exists
      }
    }
  };

  // Runs whenever video or audio state changes
  useEffect(() => {
    // Prevent running during first render
    if (video != undefined && audio != undefined) {
      // Start or stop media devices
      getUserMedia();
    }
  }, [audio, video]);

  // step - 4

  let gotMessageFromServer = (fromId, message) => {
    // Convert string message into JavaScript object
    var signal = JSON.parse(message);

    // Ignore message if it came from myself
    if (fromId !== socketIdRef.current) {
      // If received signal contains SDP offer/answer
      if (signal.sdp) {
        // Set other user's SDP as remote description
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            // If received SDP is offer, then create answer
            if (signal.sdp.type === "offer") {
              // Create SDP answer
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  // Set answer as my local description
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      // Send my SDP answer back to that user
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        }),
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }

      // If received signal contains ICE candidate
      if (signal.ice) {
        // Add ICE candidate to peer connection
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  //step 4- flow
  // User A sends offer SDP
  // User B receives offer
  // User B creates answer SDP
  // User B sends answer back
  // Both exchange ICE candidates
  // Video/audio connection starts

  let addMessage = (data, sender, senderSocketId) => {
    setMessages((currentMessages) => [
      ...currentMessages,
      { data, sender, senderSocketId },
    ]);

    if (!showModal) {
      setNewMessages((currentCount) => currentCount + 1);
    }
  };

  let updateRemoteVideo = (socketId, remoteStream) => {
    setVideos((currentVideos) => {
      const existingVideo = currentVideos.find(
        (video) => video.socketId === socketId,
      );

      const updatedVideos = existingVideo
        ? currentVideos.map((video) =>
            video.socketId === socketId
              ? { ...video, stream: remoteStream }
              : video,
          )
        : [
            ...currentVideos,
            {
              socketId,
              stream: remoteStream,
              autoPlay: true,
              playsInline: true,
            },
          ];

      videoRef.current = updatedVideos;
      return updatedVideos;
    });
  };

  let sendMessage = (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || !socketRef.current) {
      return;
    }

    socketRef.current.emit("chat-message", trimmedMessage, username);
    setMessage("");
  };

  // step - 3

  //   SDP (Session Description Protocol)

  // Think of SDP as an introduction letter between two devices.

  // It tells the other device:

  // I want to send video
  // I want to send audio
  // These codecs I support
  // These resolutions I support
  // These ports I can use

  // 2. ICE (Interactive Connectivity Establishment)

  // Now both users know how to talk.

  // But they still don't know:

  // 👉 "Which IP address should I use?"

  // 👉 "Which network path should I use?"

  // This is where ICE comes in.

  let connectToSocketServer = () => {
    // Connect frontend socket with backend socket server
    socketRef.current = io.connect(serverUrl, { secure: false });

    // Listen for WebRTC signal from server
    // signal can contain SDP offer/answer or ICE candidate
    socketRef.current.on("signal", gotMessageFromServer);

    // When socket successfully connects
    socketRef.current.on("connect", () => {
      // Tell server: I joined this call room
      // window.location.href is used as room id
      socketRef.current.emit("join-call", window.location.href);

      // Store current user's socket id
      socketIdRef.current = socketRef.current.id;
      setMySocketId(socketRef.current.id);

      // Listen for chat messages
      socketRef.current.on("chat-message", addMessage);

      // When any user leaves the call
      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });

      // When a new user joins the room after me
      socketRef.current.on("user-joined", (id) => {
        if (id === socketIdRef.current) return;
        if (connections[id]) return;

        connections[id] = new RTCPeerConnection(peerConfiConnections);

        connections[id].onicecandidate = (event) => {
          if (event.candidate !== null) {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ ice: event.candidate }),
            );
          }
        };

        connections[id].ontrack = (event) => {
          updateRemoteVideo(id, event.streams[0]);
        };

        if (window.localStream) {
          window.localStream.getTracks().forEach((track) => {
            connections[id].addTrack(track, window.localStream);
          });
        }
      });

      // When I join, receive current clients and connect to them
      socketRef.current.on("existing-users", (clients) => {
        clients.forEach((socketListId) => {
          if (socketListId === socketIdRef.current) return;
          if (connections[socketListId]) return;

          connections[socketListId] = new RTCPeerConnection(peerConfiConnections);

          connections[socketListId].onicecandidate = (event) => {
            if (event.candidate !== null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate }),
              );
            }
          };

          connections[socketListId].ontrack = (event) => {
            updateRemoteVideo(socketListId, event.streams[0]);
          };

          if (window.localStream) {
            window.localStream.getTracks().forEach((track) => {
              connections[socketListId].addTrack(track, window.localStream);
            });
          }

          connections[socketListId]
            .createOffer()
            .then((description) => connections[socketListId].setLocalDescription(description))
            .then(() => {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ sdp: connections[socketListId].localDescription }),
              );
            })
            .catch((e) => console.log(e));
        });
      });
    });
  };

  // Called when user clicks the Connect button
  let getMedia = () => {
    // Enable camera if camera device is available
    setVideo(videoAvailable);

    // Enable microphone if microphone device is available
    setAudio(audioAvailbale);

    // Connect user to Socket.IO server
    // Required for WebRTC signaling
    connectToSocketServer();
  };

  let connect = () => {
    setAskForUsername(false);
    getMedia();
  };

  let handleVideo = () => {
    setVideo(!video);
  };

  let handleAudio = () => {
    setAudio(!audio);
  };

  let getDisplayMediaSucess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    const screenTrack = stream.getVideoTracks()[0];

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      const sender = connections[id]
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");

      if (sender && screenTrack) {
        sender.replaceTrack(screenTrack);
      }
    }

    screenTrack.onended = () => {
      // Update React state
      setScreen(false);

      navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: true,
        })
        .then((cameraStream) => {
          // Store camera stream again
          window.localStream = cameraStream;

          // Show camera again locally
          localVideoRef.current.srcObject = cameraStream;

          const cameraTrack = cameraStream.getVideoTracks()[0];

          // Replace screen track with camera track for all users
          for (let id in connections) {
            const sender = connections[id]
              .getSenders()
              .find((s) => s.track && s.track.kind === "video");

            if (sender && cameraTrack) {
              sender.replaceTrack(cameraTrack);
            }
          }
        })
        .catch((e) => console.log(e));
    };
  };

  let getDisplayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({
            video: true,
            audio: false,
          })
          .then(getDisplayMediaSucess)
          .then((stream) => {})
          .catch((e) => console.log(e));
      }
    }
  };

  useEffect(() => {
    if (screen != undefined) {
      getDisplayMedia();
    }
  }, [screen]);

  let handleScreen = () => {
    setScreen(!screen);
  };

  let leaveMeeting = () => {
    if (window.localStream) {
      window.localStream.getTracks().forEach((track) => track.stop());
      window.localStream = null;
    }

    Object.values(connections).forEach((connection) => connection.close());
    connections = {};

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    navigate("/");
  };

  return (
    <div>
      {askForUsername === true ? (
        <div className={style.lobbyContainer}>
          <div className={style.lobbyCard}>
            <div className={style.lobbyContent}>
              <span className={style.lobbyEyebrow}>Video meeting</span>
              <h2>Ready to join?</h2>
              <p>Enter your name to preview your camera before joining the call.</p>

              <form
                className={style.lobbyForm}
                onSubmit={(event) => {
                  event.preventDefault();
                  if (username.trim()) {
                    connect();
                  }
                }}
              >
                <TextField
                  id="meeting-username"
                  onChange={(e) => setUsername(e.target.value)}
                  label="Your name"
                  value={username}
                  variant="outlined"
                  fullWidth
                  autoComplete="name"
                />
                <Button type="submit" variant="contained" disabled={!username.trim()}>
                  Join meeting
                </Button>
              </form>
            </div>

            <div className={style.lobbyPreview}>
              <span>Camera preview</span>
              <video ref={localVideoRef} autoPlay muted></video>
            </div>
          </div>
        </div>
      ) : (
        // step - 5  something we do earler or now we do some change like adding buttons and styling
        <div className={style.meetVideoContainer}>
          <div className={style.buttonContainer}>
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={leaveMeeting} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable === true ? (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen === true ? (
                  <StopScreenShareIcon />
                ) : (
                  <ScreenShareIcon />
                )}
              </IconButton>
            ) : (
              <></>
            )}

            <Badge badgeContent={newMessages} max={999} color="secondary">
              <IconButton
                onClick={() => {
                  setShowModal((isOpen) => !isOpen);
                  setNewMessages(0);
                }}
                style={{ color: "white" }}
              >
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          {showModal && (
            <div className={style.chatPanel}>
              <h2>Messages</h2>
              <div className={style.messageList}>
                {messages.length === 0 ? (
                  <p>No messages yet.</p>
                ) : (
                  messages.map((chatMessage, index) => (
                    <div className={style.chatMessage} key={`${chatMessage.senderSocketId}-${index}`}>
                      <strong>{chatMessage.sender}</strong>
                      <span>{chatMessage.data}</span>
                    </div>
                  ))
                )}
              </div>
              <form className={style.messageForm} onSubmit={sendMessage}>
                <TextField
                  size="small"
                  fullWidth
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Type a message"
                  autoComplete="off"
                />
                <Button type="submit" variant="contained">
                  Send
                </Button>
              </form>
            </div>
          )}

          <video
            className={style.meetUserVideo}
            ref={localVideoRef}
            autoPlay
            muted
          ></video>
          {/* <h1>{mySocketId}</h1> */}

          <div className={style.conferenceView}>
            {videos.map((video) => (
              <video
                key={video.socketId}
                data-socket={video.socketId}
                ref={(ref) => {
                  if (ref && video.stream) {
                    ref.srcObject = video.stream;
                  }
                }}
                autoPlay
                playsInline
              />
            ))}
          </div>
        </div>
        // end step
      )}
    </div>
  );
};

export default VideoMeet;
