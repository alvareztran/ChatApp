import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { initSocket, disconnectSocket } from '../socket/socket';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, currentUser } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState(() => new Set());

  useEffect(() => {
    if (!token || !currentUser) {
      disconnectSocket();
      setSocket(null);
      setOnlineUserIds(new Set());
      return undefined;
    }

    const nextSocket = initSocket(token);
    setSocket(nextSocket);

    const syncPresence = () => nextSocket.emit('presence:sync');
    const handlePresenceList = (ids) => setOnlineUserIds(new Set(ids || []));
    const handlePresenceUpdate = ({ userId, online }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    nextSocket.on('connect', syncPresence);
    nextSocket.on('presence:list', handlePresenceList);
    nextSocket.on('presence:update', handlePresenceUpdate);
    if (nextSocket.connected) syncPresence();

    return () => {
      nextSocket.off('connect', syncPresence);
      nextSocket.off('presence:list', handlePresenceList);
      nextSocket.off('presence:update', handlePresenceUpdate);
      disconnectSocket();
      setSocket(null);
      setOnlineUserIds(new Set());
    };
  }, [token, currentUser]);

  const isOnline = useCallback(
    (userId) => Boolean(userId) && onlineUserIds.has(String(userId)),
    [onlineUserIds]
  );

  return (
    <SocketContext.Provider value={{ socket, isOnline }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
