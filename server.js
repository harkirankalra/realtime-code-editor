const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, 'build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'build', 'index.html'));
    });
}

const userSocketMap = {};

function getAllConnectedClients(roomId) {
    const clients = io.sockets.adapter.rooms.get(roomId) || new Set();
    return Array.from(clients).map(socketId => ({
        socketId,
        username: userSocketMap[socketId]
    }));
}

function runCode(language, code) {
    return new Promise((resolve, reject) => {
        const jobId = Date.now().toString();
        const jobDir = path.join(__dirname, 'temp', jobId);
        fs.mkdirSync(jobDir, { recursive: true });

        let fileName, runCommand;

        if (language === 'java') {
            fileName = 'Main.java';
            runCommand = `cd "${jobDir}" && javac Main.java && java Main`;
        } else if (language === 'python') {
            fileName = 'main.py';
            runCommand = `cd "${jobDir}" && python main.py`;
        } else if (language === 'javascript') {
            fileName = 'main.js';
            runCommand = `cd "${jobDir}" && node main.js`;
        } else {
            return reject('Unsupported language');
        }

        fs.writeFileSync(path.join(jobDir, fileName), code);
        console.log("Running:", runCommand);

        exec(runCommand, { timeout: 10000, shell: 'cmd.exe' }, (error, stdout, stderr) => {
    console.log("stdout:", stdout);
    console.log("stderr:", stderr);
    console.log("error:", error?.message);
    fs.rmSync(jobDir, { recursive: true, force: true });
    if (error) return reject(stderr || error.message);  // ✅ NAYA
    resolve(stdout);

        });
    });
}

app.post('/run', async (req, res) => {
    const { language, code } = req.body;
    try {
        const output = await runCode(language, code);
        res.json({ output });
    } catch (err) {
        res.json({ output: err.toString() });
    }
});

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);

        const clients = getAllConnectedClients(roomId);
        socket.emit(ACTIONS.JOINED, { clients, username, socketId: socket.id });
        socket.to(roomId).emit(ACTIONS.JOINED, { clients, username, socketId: socket.id });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.to(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on('disconnecting', () => {
        const rooms = Array.from(socket.rooms);
        rooms.forEach(roomId => {
            socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id]
            });
        });
        delete userSocketMap[socket.id];
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));