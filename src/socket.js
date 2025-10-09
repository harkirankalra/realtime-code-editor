import { io } from 'socket.io-client';

export const initSocket = () => {
    const options = {
        forceNew: true,
        reconnectionAttempts: Infinity, // unlimited attempts
        timeout: 10000,
        transports: ['websocket'],
    };
     return io('http://localhost:5000', options);
};
