import { useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationPopup.css';

const NotificationPopup = () => {
	const {
		showPopup,
		currentPopupNotification,
		markAsRead,
		closePopup
	} = useNotifications();

	useEffect(() => {
		if (showPopup) {
			const timer = setTimeout(() => {
				closePopup();
			}, 5000);

			return () => clearTimeout(timer);
		}
	}, [showPopup, closePopup]);

	if (!showPopup || !currentPopupNotification) {
		return null;
	}

	const getTagClass = () => {
		const tag = currentPopupNotification.tag?.toLowerCase() || 'info';

		switch (tag) {
			case 'warning':
				return 'notification-tag-warning';
			case 'positive':
				return 'notification-tag-positive';
			default:
				return 'notification-tag-info';
		}
	};

	return (
		<div className={`notification-popup ${getTagClass()}`}>
			<div className="notification-content">
				<p>{currentPopupNotification.content}</p>
			</div>
			<div className="notification-actions">
				<button
					className="notification-dismiss-btn"
					onClick={() => markAsRead(currentPopupNotification.id)}
				>
					Dismiss
				</button>
			</div>
			<button
				className="notification-close-btn"
				onClick={closePopup}
			>
				×
			</button>
		</div>
	);
};

export default NotificationPopup;
