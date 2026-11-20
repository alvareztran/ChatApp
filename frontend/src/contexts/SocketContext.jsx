import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { initSocket, disconnectSocket } from '../socket/socket';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, currentUser } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (token && currentUser) {
      setSocket(initSocket(token));
      return () => {
        disconnectSocket();
        setSocket(null);
      };
    }

    disconnectSocket();
    setSocket(null);
    return undefined;
  }, [token, currentUser]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
