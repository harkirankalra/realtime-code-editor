import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Client from "../components/Client";
import Editor from "../components/Editor";
import { initSocket } from "../socket";
import ACTIONS from "../Actions";
import toast from "react-hot-toast";

const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef("");
  const location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();

  const [clients, setClients] = useState([]);
  const [language, setLanguage] = useState("java");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  //  Leave Room
  const leaveRoom = useCallback(() => {
    navigate("/");
    toast.success("Disconnected from the room.");
  }, [navigate]);

  //  Socket Initialization
  useEffect(() => {
    const init = async () => {
      function handleErrors(e) {
        console.error("Socket error", e);
        toast.error("Socket connection failed.");
        leaveRoom();
      }

      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", handleErrors);
      socketRef.current.on("connect_failed", handleErrors);

      const username = location.state?.username;

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username,
      });

      

socketRef.current.on(ACTIONS.JOINED, ({ clients, username: joinedUser, socketId: joinedSocketId }) => {
    if (joinedUser !== username) {
        toast.success(`${joinedUser} joined the room.`);
    }
    
    const unique = clients.filter((c, index, self) =>
        index === self.findIndex((t) => t.username === c.username)
    );
    setClients(unique);
});
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.error(`${username} left the room.`);
        setClients((prev) =>
          prev.filter((client) => client.socketId !== socketId)
        );
      });
    };

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [location.state?.username, leaveRoom, roomId]);

  //  Copy Room ID
  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied.");
    } catch {
      toast.error("Failed to copy Room ID.");
    }
  };

  // RUN CODE 
  const runCode = async () => {
    if (!codeRef.current) {
      toast.error("Code is empty!");
      return;
    }

    try {
      setIsRunning(true);
      setOutput("");

      const res = await fetch("http://localhost:3001/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          code: codeRef.current,
        }),
      });

      const data = await res.json();
      setOutput(data.output || "No output");
    } catch (err) {
      console.error(err);
      setOutput("Error while running code");
    } finally {
      setIsRunning(false);
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
        <div className="runBar">
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
          </select>

          <button className="btn runBtn" onClick={runCode} disabled={isRunning}>
            {isRunning ? "Running..." : "Run"}
          </button>
        </div>

        <Editor
          socketRef={socketRef}
          roomId={roomId}
          onCodeChange={(code) => (codeRef.current = code)}
        />

        {/*  OUTPUT BOX */}
        <div className="outputBox">
          <h4>Output</h4>
          <pre>{output}</pre>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
