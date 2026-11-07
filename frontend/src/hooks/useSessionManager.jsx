import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile, logout, logoutUser } from '../store/slices/authSlice';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const useSessionManager = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const inactivityTimer = useRef(null);
  const warningTimer = useRef(null);
  const lastActivity = useRef(Date.now());

  // Session timeout settings (in milliseconds)
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout
  const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

  // Handle session timeout
  const handleSessionTimeout = useCallback(() => {
    toast.error('Your session has expired due to inactivity. Please log in again.');
    dispatch(logoutUser());
  }, [dispatch]);

  // Extend session
  const extendSession = useCallback(async () => {
    try {
      await authAPI.extendSession();
      lastActivity.current = Date.now();
      // Start timer after extending session
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      if (warningTimer.current) {
        clearTimeout(warningTimer.current);
      }
      
      // Set warning timer (5 minutes before timeout)
      warningTimer.current = setTimeout(() => {
        toast.error(
          (t) => (
            <div className="flex flex-col space-y-2">
              <p>Your session will expire in 5 minutes due to inactivity.</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    extendSession();
                    toast.dismiss(t.id);
                  }}
                  className="px-3 py-1 bg-brand-600 text-white rounded text-sm hover:bg-brand-700"
                >
                  Extend Session
                </button>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                  }}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ),
          {
            duration: 10000, // Show for 10 seconds
            id: 'session-warning'
          }
        );
      }, SESSION_TIMEOUT - WARNING_TIME);

      // Set logout timer
      inactivityTimer.current = setTimeout(() => {
        handleSessionTimeout();
      }, SESSION_TIMEOUT);
      
      toast.success('Session extended successfully!');
    } catch (error) {
      console.error('Failed to extend session:', error);
      toast.error('Failed to extend session. Please log in again.');
      dispatch(logout());
    }
  }, [handleSessionTimeout, dispatch]);

  // Start inactivity timer
  const startInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    if (warningTimer.current) {
      clearTimeout(warningTimer.current);
    }

    // Set warning timer (5 minutes before timeout)
    warningTimer.current = setTimeout(() => {
      toast.error(
        (t) => (
          <div className="flex flex-col space-y-2">
            <p>Your session will expire in 5 minutes due to inactivity.</p>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  extendSession();
                  toast.dismiss(t.id);
                }}
                className="px-3 py-1 bg-brand-600 text-white rounded text-sm hover:bg-brand-700"
              >
                Extend Session
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                }}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        ),
        {
          duration: 10000, // Show for 10 seconds
          id: 'session-warning'
        }
      );
    }, SESSION_TIMEOUT - WARNING_TIME);

    // Set logout timer
    inactivityTimer.current = setTimeout(() => {
      handleSessionTimeout();
    }, SESSION_TIMEOUT);
  }, [extendSession, handleSessionTimeout]);

  // Handle user activity
  const handleActivity = useCallback(() => {
    lastActivity.current = Date.now();
    if (isAuthenticated) {
      startInactivityTimer();
    }
  }, [isAuthenticated, startInactivityTimer]);

  // On app load, ask the API who is signed in (the session cookie is httpOnly,
  // so the browser can't read it). A 401 simply means "signed out".
  const initializeSession = useCallback(async () => {
    try {
      await dispatch(getProfile()).unwrap();
      startInactivityTimer();
    } catch {
      dispatch(logout());
    }
  }, [dispatch, startInactivityTimer]);

  // Setup activity listeners
  useEffect(() => {
    if (isAuthenticated) {
      ACTIVITY_EVENTS.forEach(event => {
        document.addEventListener(event, handleActivity, true);
      });

      return () => {
        ACTIVITY_EVENTS.forEach(event => {
          document.removeEventListener(event, handleActivity, true);
        });
      };
    }
  }, [isAuthenticated, handleActivity]);

  // Initialize session on mount (only once)
  useEffect(() => {
    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Any API call that comes back 401 means the session ended
  useEffect(() => {
    const onExpired = () => {
      if (isAuthenticated) toast.error('Your session has ended. Please sign in again.');
      dispatch(logout());
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [dispatch, isAuthenticated]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      if (warningTimer.current) {
        clearTimeout(warningTimer.current);
      }
    };
  }, []);

  return {
    extendSession,
    isAuthenticated,
    user
  };
};

export default useSessionManager;
