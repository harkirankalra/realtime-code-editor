// src/pages/EditorPage.js

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Client from "../components/Client";
import Editor from "../components/Editor";
import { initSocket } from "../socket";
import ACTIONS from "../Actions";
import toast from "react-hot-toast";

const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const location = useLocation();
  const reactNavigator = useNavigate();
  const { roomId } = useParams();
  const [clients, setClients] = useState([]);

  // 🔹 Leave Room
  const leaveRoom = useCallback(() => {
    reactNavigator("/");
    toast.success("Disconnected from the room.");
  }, [reactNavigator]);

  // 🔹 Initialize Socket
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      function handleErrors(e) {
        console.error("Socket error", e);
        toast.error("Socket connection failed, try again later.");
        leaveRoom();
      }

      socketRef.current = await initSocket();

      socketRef.current.on("connect_error", handleErrors);
      socketRef.current.on("connect_failed", handleErrors);

      const currentUsername = location.state?.username;
      console.log("Attempting to join with username:", currentUsername);

      if (isMounted) {
        socketRef.current.emit(ACTIONS.JOIN, {
          roomId,
          username: currentUsername,
        });
      }

      socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId: newSocketId }) => {
        if (username !== currentUsername) {
          toast.success(`${username} joined the room.`);
        }
        setClients(clients);

        // Sync code for the new user
        if (socketRef.current.id === newSocketId && codeRef.current !== null) {
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId: newSocketId,
          });
        }
      });

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.error(`${username} left the room.`);
        setClients((prev) => prev.filter((client) => client.socketId !== socketId));
      });
    };

    init();

    // Cleanup
    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off("connect_error");
        socketRef.current.off("connect_failed");
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
      }
    };
  }, [location.state?.username, leaveRoom, roomId]);

  // 🔹 Copy Room ID
  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID has been copied to your clipboard.");
    } catch (err) {
      toast.error("Could not copy Room ID.");
      console.error(err);
    }
  };

  return (
    <div className="mainWrap">
      {/* Sidebar */}
      <div className="aside">
        <div className="asideInner">
          <h3>Connected Users</h3>
          <div className="clientsList">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>

        <div className="createInfo">
          <button className="btn joinBtn" onClick={copyRoomId}>
            Copy ROOM ID
          </button>
          <button className="btn leaveBtn" onClick={leaveRoom}>
            Leave
          </button>
        </div>
      </div>

      {/* Editor Section */}
      <div className="editorWrapper">
        <Editor
          socketRef={socketRef}
          roomId={roomId}
          onCodeChange={(code) => (codeRef.current = code)}
        />
      </div>
    </div>
  );
};

export default EditorPage;
