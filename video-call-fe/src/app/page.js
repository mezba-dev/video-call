"use client";
import { useEffect, useState } from "react";
import Peer from "peerjs";
import io from "socket.io-client";

const VideoChat = () => {
  const [peerId, setPeerId] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [socket, setSocket] = useState(null);
  const [peer, setPeer] = useState(null);
  const [remotePeerId, setRemotePeerId] = useState("");
  const [remoteStream, setRemoteStream] = useState(null);

  useEffect(() => {
    const newPeer = new Peer();
    setPeer(newPeer);

    newPeer.on("open", (id) => {
      setPeerId(id);
    });

    newPeer.on("call", (call) => {
      call.answer(localStream);
      call.on("stream", (remoteStream) => {
        setRemoteStream(remoteStream);
      });
    });

    const newSocket = io("https://172.20.20.25:8000/", {
      transports: ["websocket", "polling"],
      path: "/socket.io",
      reconnection: true,
      reconnectionAttempts: 5,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected via WebSocket");
      newSocket.emit("register", newPeer.id);
    });

    newSocket.on("new-call", (data) => {
      const call = newPeer.call(data.callerId, localStream);
      call.on("stream", (remoteStream) => {
        setRemoteStream(remoteStream);
      });
    });

    newSocket.on("call-answered", (data) => {
      const call = newPeer.call(data.callerId, localStream);
      call.on("stream", (remoteStream) => {
        setRemoteStream(remoteStream);
      });
    });

    newSocket.on("call-rejected", () => {
      console.log("Call rejected");
    });

    return () => {
      newPeer?.destroy();
      newSocket?.disconnect();
    };
  }, [localStream]);

  useEffect(() => {
    const getMediaStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    };

    getMediaStream();
  }, []);

  const handleCall = () => {
    console.log("call please");

    if (remotePeerId && localStream) {
      const call = peer.call(remotePeerId, localStream);
      call.on("stream", (remoteStream) => {
        setRemoteStream(remoteStream);
      });

      // Emit the call event to the backend
      socket.emit("make-call", {
        callerId: peerId,
        receiverId: remotePeerId,
        offer: call.peerConnection.localDescription,
      });
    }
  };

  const handleHangup = () => {
    if (peer) {
      peer.disconnect();
    }
    setRemoteStream(null);
  };

  return (
    <div className="container">
      <h1 className="title">Video Chat</h1>

      {/* Peer ID and input */}
      <div className="input-section">
        <div id="myId" className="peer-id">
          {peerId ? `My ID: ${peerId}` : "Loading ID..."}
        </div>
        <input
          type="text"
          placeholder="Enter remote peer ID"
          className="input"
          value={remotePeerId}
          onChange={(e) => setRemotePeerId(e.target.value)}
        />
      </div>

      {/* Video sections side by side */}
      <div className="video-container">
        {/* Your Video */}
        <div className="video-section">
          <h2 className="video-title">Your Video</h2>
          <video
            ref={(video) => {
              if (video && localStream) {
                video.srcObject = localStream;
              }
            }}
            autoPlay
            playsInline
            className="video-element"
          ></video>
        </div>

        {/* Remote Video */}
        <div className="video-section">
          <h2 className="video-title">Remote Video</h2>
          <video
            ref={(video) => {
              if (video && remoteStream) {
                video.srcObject = remoteStream;
              }
            }}
            autoPlay
            playsInline
            className="video-element"
          ></video>
        </div>
      </div>

      {/* Call and Hang Up buttons */}
      <div className="button-container">
        <button
          id="callButton"
          className="button call-button"
          onClick={handleCall}
        >
          Call
        </button>
        <button
          id="hangupButton"
          className="button hangup-button"
          onClick={handleHangup}
        >
          Hang Up
        </button>
      </div>
    </div>
  );
};

export default VideoChat;
