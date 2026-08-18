import { createContext, useCallback, useEffect, useState } from "react";
import { listNotifications } from "../services/notificationService";
import { useAuth } from "../hooks/useAuth";

const NotificationsContext = createContext(null);

const POLL_INTERVAL_MS = 30_000;

export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const data = await listNotifications({ is_read: "false", page: 1 });
      setUnreadCount(data.count || 0);
    } catch {

    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return undefined;
    }

    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshUnreadCount]);

  const value = { unreadCount, refreshUnreadCount };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export default NotificationsContext;
