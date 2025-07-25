import { useState, useEffect } from "react";
import { useNotifications } from "../../context/NotificationContext";
import "./NotificationsPage.css";
import WelcomeHeader from "../../components/dashboard_components/WelcomeHeader";
import Sidebar from "../../components/dashboard_components/Sidebar";

const NotificationsPage = () => {
  const {
    notifications,
    fetchAllNotifications,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      setIsLoading(true);
      await fetchAllNotifications();
      setIsLoading(false);
    };

    loadNotifications();
  }, [fetchAllNotifications]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getTagClass = (tag) => {
    const tagLower = tag?.toLowerCase() || "info";

    switch (tagLower) {
      case "warning":
        return "notification-tag-warning";
      case "positive":
        return "notification-tag-positive";
      default:
        return "notification-tag-info";
    }
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case "unread":
        return notifications.filter(notification => !notification.read);
      case "warning":
        return notifications.filter(notification => notification.tag?.toLowerCase() === "warning");
      case "positive":
        return notifications.filter(notification => notification.tag?.toLowerCase() === "positive");
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(notification => !notification.read).length;

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-main">
        <WelcomeHeader
          title="Notifications"
          subtitle="Stay updated with important alerts and information."
        />

      <div className="notifications-container">
        <div className="notifications-header">
          <div className="filter-controls">
            <button
              className={`filter-button ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              className={`filter-button ${filter === "unread" ? "active" : ""}`}
              onClick={() => setFilter("unread")}
            >
              Unread
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>
            <button
              className={`filter-button ${filter === "warning" ? "active" : ""}`}
              onClick={() => setFilter("warning")}
            >
              Warnings
            </button>
            <button
              className={`filter-button ${filter === "positive" ? "active" : ""}`}
              onClick={() => setFilter("positive")}
            >
              Positive
            </button>
          </div>
          
          {unreadCount > 0 && (
            <button className="mark-all-read-button" onClick={handleMarkAllAsRead}>
              Mark all as read
            </button>
          )}
        </div>

        <div className="notifications-list">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading notifications...</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.read ? "unread" : ""} ${getTagClass(notification.tag)}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="notification-content">
                  <p>{notification.content}</p>
                  <div className="notification-meta">
                    <span className="notification-event">{notification.trigger_event.replace(/_/g, " ")}</span>
                  </div>
                </div>
                <div className="notification-time">
                  {formatDate(notification.sent_at)}
                </div>
                {!notification.read && (
                  <div className="unread-indicator"></div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21S18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13.73 21A2 2 0 0 1 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p>No notifications found</p>
              <p className="empty-subtitle">
                {filter !== "all" 
                  ? "Try changing your filter to see more notifications" 
                  : "You're all caught up!"}
              </p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default NotificationsPage;