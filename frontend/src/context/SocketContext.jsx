// src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('accessToken');
    const socket = io(import.meta.env.VITE_SOCKET_URL || '', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('🔌 Socket connected');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('presence:update', (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const joinWorkspace = (workspaceId) => {
    socketRef.current?.emit('join:workspace', workspaceId);
  };

  const joinProject = (projectId) => {
    socketRef.current?.emit('join:project', projectId);
  };

  const joinChannel = (workspaceId, channel) => {
    socketRef.current?.emit('join:channel', { workspaceId, channel });
  };

  const emitTyping = (workspaceId, channel, isTyping) => {
    const event = isTyping ? 'typing:start' : 'typing:stop';
    socketRef.current?.emit(event, { workspaceId, channel });
  };

  const emitTaskMove = (taskId, newStatus, projectId) => {
    socketRef.current?.emit('task:move', { taskId, newStatus, projectId });
  };

  const emitMessage = (workspaceId, channel, text, replyTo) => {
    socketRef.current?.emit('chat:message', { workspaceId, channel, text, replyTo });
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      onlineUsers,
      joinWorkspace,
      joinProject,
      joinChannel,
      emitTyping,
      emitTaskMove,
      emitMessage,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
