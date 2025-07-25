import { createContext, useState, useEffect, useContext, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [showPopup, setShowPopup] = useState(false);
	const [currentPopupNotification, setCurrentPopupNotification] = useState(null);

	const fetchUnreadNotifications = async () => {
		try {
			const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/notifications/unread`, {
				credentials: 'include',
			});

			if (response.ok) {
				const data = await response.json();

				setNotifications(data);
				setUnreadCount(data.length);

				if (data.length > 0 && !showPopup) {
					setCurrentPopupNotification(data[0]);
					setShowPopup(true);
				}
			}
		} catch (error) {
			console.error('Error fetching notifications:', error);
		}
	};

	const fetchAllNotifications = useCallback(async () => {
		try {
			const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/notifications`, {
				credentials: 'include',
			});

			if (response.ok) {
				const data = await response.json();
				setNotifications(data);
				setUnreadCount(data.filter(notif => !notif.read).length);
			}
		} catch (error) {
			console.error('Error fetching all notifications:', error);
		}
	}, []);

	const markAsRead = useCallback(async (notificationId) => {
		try {
			const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/notifications/${notificationId}/read`, {
				method: 'PUT',
				credentials: 'include',
			});

			if (response.ok) {
				setNotifications(prev =>
					prev.map(notif =>
						notif.id === notificationId ? { ...notif, read: true, status: 'READ' } : notif
					)
				);
				setUnreadCount(prev => Math.max(0, prev - 1));

				if (currentPopupNotification?.id === notificationId) {
					setShowPopup(false);
					setCurrentPopupNotification(null);
				}
			}
		} catch (error) {
			console.error('Error marking notification as read:', error);
		}
	}, [currentPopupNotification]);

	const markAllAsRead = useCallback(async () => {
		try {
			const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/notifications/read-all`, {
				method: 'PUT',
				credentials: 'include',
			});

			if (response.ok) {
				setNotifications(prev =>
					prev.map(notif => ({ ...notif, read: true, status: 'READ' }))
				);
				setUnreadCount(0);
				setShowPopup(false);
				setCurrentPopupNotification(null);
			}
		} catch (error) {
			console.error('Error marking all notifications as read:', error);
		}
	}, []);

	const closePopup = useCallback(() => {
		setShowPopup(false);
	}, []);

	useEffect(() => {
		fetchUnreadNotifications();

		const intervalId = setInterval(() => {
			fetchUnreadNotifications();
		}, 30000);

		return () => clearInterval(intervalId);
	}, []);

	const value = {
		notifications,
		unreadCount,
		showPopup,
		currentPopupNotification,
		fetchUnreadNotifications,
		fetchAllNotifications,
		markAsRead,
		markAllAsRead,
		closePopup
	};

	return (
		<NotificationContext.Provider value={value}>
			{children}
		</NotificationContext.Provider>
	);
};

export default NotificationContext;
