const axios = require('axios');

const formatSmsMessage = (notification) => {
	const cleanContent = notification.content.replace(/^(⚠️|✅) \[[^\]]+\] /, '');

	return `Zuno: ${cleanContent}`;
};

const sendSmsNotification = async (user, notification) => {
	try {
		if (!user.phone) {
			return null;
		}

		const message = formatSmsMessage(notification);

		const textbeltUrl = 'https://textbelt.com/text';

		const phoneNumber = user.phone.startsWith('+') ? user.phone.substring(1) : user.phone;

		try {
			if (!process.env.TEXTBELT_API_KEY) {
				console.error('TextBelt API key not set. Check your .env file.');
				return null;
			}

			const response = await axios.post(textbeltUrl, {
				phone: phoneNumber,
				message: `${message} Reply STOP to opt-out.`,
				key: process.env.TEXTBELT_API_KEY,
			});

			if (response.data && response.data.success) {
				return response.data;
			} else {
				const errorText = response.data?.error || 'Unknown error';
				console.error(`SMS notification failed with error: ${errorText}`);
				return null;
			}
		} catch (err) {
			console.error('Error sending SMS via TextBelt API:', err);
			return null;
		}
	} catch (error) {
		console.error('Error in sendSmsNotification:', error);
		return null;
	}
};

module.exports = {
	sendSmsNotification
};
