import { useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationsSection.css';

const NotificationsSection = () => {
	const {
		notifications,
		fetchAllNotifications,
		markAsRead
	} = useNotifications();

	useEffect(() => {
		fetchAllNotifications();
	}, [fetchAllNotifications]);

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const getTagClass = (tag) => {
		const tagLower = tag?.toLowerCase() || 'info';

		switch (tagLower) {
			case 'warning':
				return 'notification-tag-warning';
			case 'positive':
				return 'notification-tag-positive';
			default:
				return 'notification-tag-info';
		}
	};

	return (
		<div className="notifications-section">
			{notifications.length > 0 ? (
				// Only display the latest two notifications
				notifications.slice(0, 2).map((notification) => (
					<div
						key={notification.id}
						className={`notification-item ${!notification.read ? 'unread' : ''} ${getTagClass(notification.tag)}`}
						onClick={() => markAsRead(notification.id)}
					>
						<div className="notification-content">
							<p className="truncate-text">{notification.content}</p>
						</div>
						<div className="notification-time">
							{formatDate(notification.sent_at)}
						</div>
					</div>
				))
			) : (
				<div className="empty-state">
					<p>No notifications</p>
				</div>
			)}
		</div>
	);
};

export default NotificationsSection;
