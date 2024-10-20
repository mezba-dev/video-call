"use client";
import { useEffect, useState, useRef } from "react";
import Peer from "peerjs";
import io, { Socket } from "socket.io-client";

const VideoChat = () => {
  const [peerId, setPeerId] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);

  useEffect(() => {
    // Initialize PeerJS
    peerRef.current = new Peer();
    peerRef.current.on("open", (id) => {
      setPeerId(id);
    });

    const newSocket = io("https://172.20.20.25:8000/", {
      transports: ["websocket", "polling"],
      path: "/socket.io",
      reconnection: true,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("Connected via WebSocket");
    });

    // Socket.IO event listeners
    // socketRef.current.on("call-made", (data) => {
    //   if (localStream) {
    //     const call = peerRef.current.call(data.callerID, localStream);
    //     call.on("stream", (remoteStream) => {
    //       remoteVideoRef.current.srcObject = remoteStream;
    //     });
    //   }
    // });

    // socketRef.current.on("answer-made", (data) => {
    //   if (localStream) {
    //     const call = peerRef.current.call(data.calleeID, localStream);
    //     call.on("stream", (remoteStream) => {
    //       remoteVideoRef.current.srcObject = remoteStream;
    //     });
    //   }
    // });

    // socketRef.current.on("call-rejected", () => {
    //   console.log("Call rejected");
    // });

    // socketRef.current.on("user-connected", (userID) => {
    //   console.log(`User connected: ${userID}`);
    // });

    // socketRef.current.on("user-disconnected", (userID) => {
    //   console.log(`User disconnected: ${userID}`);
    // });

    // // Cleanup on component unmount
    // return () => {
    //   peerRef.current?.destroy();
    //   socketRef.current?.disconnect();
    // };
  }, [localStream]);

  useEffect(() => {
    const getMediaStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localVideoRef.current.srcObject = stream;
        setLocalStream(stream);
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    };

    getMediaStream();
  }, []);

  const handleCall = () => {
    const remotePeerID = prompt("Enter ID of remote peer:");
    if (remotePeerID && localStream) {
      const call = peerRef.current.call(remotePeerID, localStream);
      call.on("stream", (remoteStream) => {
        remoteVideoRef.current.srcObject = remoteStream;
      });
    }
  };

  const handleHangup = () => {
    if (peerRef.current) {
      peerRef.current.disconnect();
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  return (
    <div className="container mx-auto px-4 mt-8">
      <h1 className="text-center text-3xl font-bold mb-4">Video Chat</h1>
      <div className="text-center mb-4">
        <div id="myId" className="text-lg font-semibold">
          {peerId ? `My ID: ${peerId}` : "Loading ID..."}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-4">
        <div className="w-full sm:w-1/2 p-2">
          <h2 className="text-xl font-semibold mb-2">Your Video</h2>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            className="w-full h-full border-2 border-gray-300 rounded"
          ></video>
        </div>

        <div className="w-full sm:w-1/2 p-2">
          <h2 className="text-xl font-semibold mb-2">Remote Video</h2>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full border-2 border-gray-300 rounded"
          ></video>
        </div>
      </div>

      <div className="text-center">
        <button
          id="callButton"
          className="bg-green-500 text-white px-4 py-2 rounded mr-2 hover:bg-green-600"
          onClick={handleCall}
        >
          Call
        </button>
        <button
          id="hangupButton"
          className="bg-red-500 text-white px-4 py-2 rounded ml-2 hover:bg-red-600"
          onClick={handleHangup}
        >
          Hang Up
        </button>
      </div>
    </div>
  );
};

export default VideoChat;
