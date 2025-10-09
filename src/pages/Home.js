import React, { useState } from 'react';
import { Typewriter } from 'react-simple-typewriter';
import '../App.css';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setroomId] = useState('');
  // 💥 FIX: Change state name from 'Username' to 'username' (lowercase u)
  const [username, setUsername] = useState(''); 

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidv4();
    setroomId(id);
    toast.success('Created a new room');
  };

  const joinRoom = () => {
    // 💥 FIX: Use the lowercase 'username' variable here
    if (!roomId.trim() || !username.trim()) { 
      toast.error('ROOM ID & USERNAME IS REQUIRED');
      return;
    }

    navigate(`/editor/${roomId}`, {
      // 💥 FIX: Ensure the state key is 'username' (lowercase u)
      // This matches the key read by location.state?.username in EditorPage.js
      state: { username }, 
    });
  };

  const handleInputEnter = (e) => {
    if (e.key === 'Enter') {
      joinRoom();
    }
  };

  return (
    <div className="home-container">
      <div className="left-section">
        <h1 className="headline">
          Build{' '}
          <span className="typewriter-gradient">
            <Typewriter
              words={[
                'Interactive Coding Rooms',
                'Collaborative Code Sessions',
                'Live Coding Workspaces',
              ]}
              loop={Infinity}
              cursor
              cursorStyle="|"
              typeSpeed={80}
              deleteSpeed={50}
              delaySpeed={1500}
            />
          </span>
        </h1>
        <p className="subtext">
          An interactive platform to code, share, and build with your team.
        </p>
      </div>

      <div className="right-section">
        <div className="form-card">
          <img src="/logo.png" alt="CollabCode Logo" className="form-logo" />

          <div className="form-group">
            <input
              type="text"
              placeholder="Room ID"
              className="form-input"
              onChange={(e) => setroomId(e.target.value)}
              value={roomId}
              onKeyDown={handleInputEnter}
            />
            <input
              type="text"
              placeholder="Username"
              className="form-input"
              // 💥 FIX: Use the lowercase setUsername
              onChange={(e) => setUsername(e.target.value)} 
              // 💥 FIX: Use the lowercase value
              value={username} 
              onKeyDown={handleInputEnter}
            />
            <button className="join-button" onClick={joinRoom}>
              Join
            </button>
          </div>

          <span className="new-room-text">
            If you don't have an invite then create{' '}
            <button onClick={createNewRoom} className="new-room-link">
              new room
            </button>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Home;