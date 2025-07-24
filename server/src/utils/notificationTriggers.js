const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const triggers = [
	{
		event: 'ZUNO_DROP',
		condition: ({ zunoHistory }) => {
			if (zunoHistory.length < 2) return false;
			const last = zunoHistory[zunoHistory.length - 1].score;
			const prev = zunoHistory[zunoHistory.length - 2].score;
			return prev - last >= 15;
		},
		message: "We noticed a dip in your momentum. Let’s plan a recovery day 📅.",
	},
	{
		event: 'TREND_SLOPE',
		condition: ({ slope }) => slope < -1.5,
		message: "Your performance is trending downward. Try focusing more on your Math class.",
	},
	{
		event: 'LOW_ADHERENCE',
		condition: ({ adherence }) => adherence < 40,
		message: "You’re skipping study sessions frequently. Need help rescheduling?",
	},
	{
		event: 'HIGH_STRESS',
		condition: ({ stress }) => stress < 50,
		message: "Lots of work due soon. Want to front-load your schedule this week?",
	},
];

async function evaluateAndCreateNotifications(userId, metrics) {
	const existingToday = await prisma.notification.findMany({
		where: {
			userId,
			sent_at: {
				gte: new Date(new Date().setHours(0, 0, 0, 0)),
			},
		},
		select: { trigger_event: true },
	});

	const sentEvents = new Set(existingToday.map(n => n.trigger_event));

	const newNotifications = triggers
		.filter(trigger => !sentEvents.has(trigger.event) && trigger.condition(metrics))
		.map(trigger => ({
			userId,
			type: 'INFO',
			content: trigger.message,
			trigger_event: trigger.event,
			sent_at: new Date(),
			status: 'UNREAD',
			read: false,
		}));

	if (newNotifications.length) {
		await prisma.notification.createMany({ data: newNotifications });
		console.log('🔔 Notifications created:', newNotifications);
	}
}

module.exports = { evaluateAndCreateNotifications };
