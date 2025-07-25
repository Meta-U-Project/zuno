const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const getUserNotifications = async (req, res) => {
	try {
		const userId = req.user.id;
		const notifications = await prisma.notification.findMany({
			where: {
				userId,
			},
			orderBy: {
				sent_at: 'desc',
			},
		});

		res.status(200).json(notifications);
	} catch (error) {
		console.error('Error fetching notifications:', error);
		res.status(500).json({ message: 'Failed to fetch notifications' });
	}
};

const getUnreadNotifications = async (req, res) => {
	try {
		const userId = req.user.id;
		const notifications = await prisma.notification.findMany({
			where: {
				userId,
				read: false,
			},
			orderBy: {
				sent_at: 'desc',
			},
		});

		res.status(200).json(notifications);
	} catch (error) {
		console.error('Error fetching unread notifications:', error);
		res.status(500).json({ message: 'Failed to fetch unread notifications' });
	}
};

const markNotificationAsRead = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user.id;

		const notification = await prisma.notification.findUnique({
			where: { id },
		});

		if (!notification) {
			return res.status(404).json({ message: 'Notification not found' });
		}

		if (notification.userId !== userId) {
			return res.status(403).json({ message: 'Not authorized to update this notification' });
		}

		const updatedNotification = await prisma.notification.update({
			where: { id },
			data: {
				read: true,
				status: 'READ',
			},
		});

		res.status(200).json(updatedNotification);
	} catch (error) {
		console.error('Error marking notification as read:', error);
		res.status(500).json({ message: 'Failed to mark notification as read' });
	}
};

const markAllNotificationsAsRead = async (req, res) => {
	try {
		const userId = req.user.id;

		await prisma.notification.updateMany({
			where: {
				userId,
				read: false,
			},
			data: {
				read: true,
				status: 'READ',
			},
		});

		res.status(200).json({ message: 'All notifications marked as read' });
	} catch (error) {
		console.error('Error marking all notifications as read:', error);
		res.status(500).json({ message: 'Failed to mark all notifications as read' });
	}
};

module.exports = {
	getUserNotifications,
	getUnreadNotifications,
	markNotificationAsRead,
	markAllNotificationsAsRead,
};
