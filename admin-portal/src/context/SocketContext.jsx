import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Connect to the backend socket server
        // Connect to the backend socket server
        const newSocket = io('https://backend-191882634358.asia-south1.run.app'); // Production Backend

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            // Identify as admin
            newSocket.emit('identify', { type: 'admin' });
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
