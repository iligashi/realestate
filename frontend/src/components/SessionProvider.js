import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSessionInitialized } from '../store/slices/authSlice';
import useSessionManager from '../hooks/useSessionManager';

const SessionProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { sessionInitialized } = useSelector((state) => state.auth);
  const hasInitialized = useRef(false);
  
  // Initialize session management
  useSessionManager();

  // Mark session as initialized after component mounts
  useEffect(() => {
    if (!sessionInitialized && !hasInitialized.current) {
      hasInitialized.current = true;
      dispatch(setSessionInitialized());
    }
  }, [dispatch, sessionInitialized]);

  return <>{children}</>;
};

export default SessionProvider;
