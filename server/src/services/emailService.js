const { createTransport } = require('nodemailer');

const transporter = createTransport({
	host: process.env.EMAIL_HOST,
	port: process.env.EMAIL_PORT,
	secure: false,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

const zunoScoreNotificationTemplate = (user, notification) => {
	const { email, firstName } = user;
	const { content, tag } = notification;

	let subject = 'Zuno Update';
	if (tag === 'warning') {
		subject = 'Zuno Alert: Action Required';
	} else if (tag === 'positive') {
		subject = 'Zuno: Great Progress!';
	}

	const cleanContent = content.replace(/^(⚠️|✅) \[[^\]]+\] /, '');

	return {
		from: `Zuno <${process.env.EMAIL_USER}>`,
		to: email,
		subject,
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
				<div style="text-align: center; margin-bottom: 20px;">
					<h1 style="color: #7735e2; margin: 0;">Zuno</h1>
					<p style="color: #666; font-size: 14px; margin: 5px 0 0;">Your Academic Success Partner</p>
				</div>

				<div style="margin-bottom: 30px;">
					<h2 style="color: #333; margin-bottom: 10px;">Hello ${firstName},</h2>
					<p style="color: #555; line-height: 1.5; font-size: 16px;">
						${cleanContent}
					</p>
				</div>

				<div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
					<p style="color: #555; margin: 0 0 10px; font-size: 14px;">
						<strong>Log in to your Zuno dashboard</strong> to see more details and take action on your academic progress.
					</p>
					<div style="text-align: center;">
						<a href="${process.env.CLIENT_URL}/dashboard" style="display: inline-block; background-color: #7735e2; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">
							Go to Dashboard
						</a>
					</div>
				</div>

				<div style="font-size: 12px; color: #999; text-align: center; margin-top: 30px; border-top: 1px solid #e1e1e1; padding-top: 20px;">
					<p>This is an automated message from Zuno. Please do not reply to this email.</p>
					<p>If you prefer not to receive these notifications by email, you can update your preferences in your account settings.</p>
				</div>
			</div>
		`,
	};
};

const taskNotificationTemplate = (user, notification, upcomingTasks = []) => {
	const { email, firstName } = user;
	const { content } = notification;

	const cleanContent = content.replace(/^(⚠️|✅) \[[^\]]+\] /, '');

	let tasksHtml = '';
	if (upcomingTasks.length > 0) {
		tasksHtml = `
			<div style="margin-top: 20px; margin-bottom: 20px;">
				<h3 style="color: #333; margin-bottom: 10px;">Your Upcoming Tasks:</h3>
				<ul style="padding-left: 20px;">
					${upcomingTasks.map(task => `
						<li style="margin-bottom: 10px;">
							<strong>${task.title}</strong> - ${task.course?.course_name || 'No course'}<br>
							<span style="color: #666; font-size: 14px;">Due: ${new Date(task.deadline).toLocaleDateString()}</span>
						</li>
					`).join('')}
				</ul>
			</div>
		`;
	}

	return {
		from: `Zuno <${process.env.EMAIL_USER}>`,
		to: email,
		subject: 'Zuno: Upcoming Tasks Reminder',
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
				<div style="text-align: center; margin-bottom: 20px;">
					<h1 style="color: #7735e2; margin: 0;">Zuno</h1>
					<p style="color: #666; font-size: 14px; margin: 5px 0 0;">Your Academic Success Partner</p>
				</div>

				<div style="margin-bottom: 20px;">
					<h2 style="color: #333; margin-bottom: 10px;">Hello ${firstName},</h2>
					<p style="color: #555; line-height: 1.5; font-size: 16px;">
						${cleanContent}
					</p>
				</div>

				${tasksHtml}

				<div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
					<p style="color: #555; margin: 0 0 10px; font-size: 14px;">
						<strong>Log in to your Zuno dashboard</strong> to manage your tasks and stay on top of your academic work.
					</p>
					<div style="text-align: center;">
						<a href="${process.env.CLIENT_URL}/tasks" style="display: inline-block; background-color: #7735e2; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">
							View Tasks
						</a>
					</div>
				</div>

				<div style="font-size: 12px; color: #999; text-align: center; margin-top: 30px; border-top: 1px solid #e1e1e1; padding-top: 20px;">
					<p>This is an automated message from Zuno. Please do not reply to this email.</p>
					<p>If you prefer not to receive these notifications by email, you can update your preferences in your account settings.</p>
				</div>
			</div>
		`,
	};
};

const sendEmailNotification = async (user, notification, additionalData = {}) => {
	try {
		let mailOptions;

		if (notification.trigger_event === 'UPCOMING_TASKS' && additionalData.upcomingTasks) {
			mailOptions = taskNotificationTemplate(user, notification, additionalData.upcomingTasks);
		} else {
			mailOptions = zunoScoreNotificationTemplate(user, notification);
		}

		const info = await transporter.sendMail(mailOptions);
		return info;
	} catch (error) {
		console.error('Error sending email notification:', error);
		throw error;
	}
};

module.exports = {
	sendEmailNotification,
	transporter,
};
