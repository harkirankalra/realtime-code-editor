// src/components/Client.js

import React from 'react';
import Avatar from 'react-avatar';

// We'll pass an 'isActive' boolean prop to determine the dot color
const Client = ({ username, isActive = false }) => { 
    
    // Determine the class for the status dot
    const statusClass = isActive ? 'is-active' : 'is-inactive';
    
    return (
        // Rename the class to 'user-item' for better semantics, 
        // or keep 'client' and modify the CSS
        <div className="client">
            
            {/*  WRAPPER for positioning the dot */}
            <div className="avatar-wrapper"> 
                {/*  The Avatar */}
                <Avatar name={username} size={50} round="14px"/>
                
                {/* The Status Dot */}
                <span className={`status-dot ${statusClass}`}></span> 
            </div>
            
            <span className="Username">{username}</span>
        </div>
    );
};

export default Client;