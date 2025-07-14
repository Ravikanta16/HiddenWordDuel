'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';

// Define the shape of the context data
interface ISocketContext {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
}

// Create the context with a default value
const SocketContext = createContext<ISocketContext>({
  socket: null,
  isConnected: false,
  connect: () => {},
});

// Create a custom hook for easy access to the context
export const useSocket = () => {
  return useContext(SocketContext);
};

// Create the provider component
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socketRef = useRef<Socket | null>(null); // Use a ref for the socket object
  const [isConnected, setIsConnected] = useState(false);

  // Define the connect function using useCallback for optimization
  const connect = useCallback(() => {
    // Read the socket from the ref's 'current' property
    if (socketRef.current?.connected) {
      return;
    }

    const token = localStorage.getItem('jwt_token');
    if (!token) {
      console.log('No JWT token found, cannot connect.');
      return;
    }
    
    // Disconnect an existing socket if it exists
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    const newSocket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
    });

    // Store the new socket in the ref
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('Socket connected successfully:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected.');
      setIsConnected(false);
    });
  }, []);

  // This effect runs once on initial load
  useEffect(() => {
    connect();

    // Cleanup when the provider is unmounted
    return () => {
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }
    };
  }, [connect]);

  return (
    // Provide the socket instance from the ref
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, connect }}>
      {children}
    </SocketContext.Provider>
  );
};