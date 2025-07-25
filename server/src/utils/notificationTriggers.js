const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const triggers = [
	{
		event: 'ZUNO_DROP',
		tag: 'warning',
		priority: 1,
		condition: ({ zunoHistory }) => {
			if (zunoHistory.length < 2) return false;
			const last = zunoHistory[zunoHistory.length - 1].score;
			const prev = zunoHistory[zunoHistory.length - 2].score;
			return prev - last >= 20;
		},
		message: "⚠️ [Warning] We noticed a significant dip in your momentum. Let's plan a recovery day 📅.",
	},
	{
		event: 'LOW_ADHERENCE',
		tag: 'warning',
		priority: 1,
		condition: ({ studyStats }) => studyStats && studyStats.adherenceScore < 30,
		message: "⚠️ [Warning] You're missing many study sessions. Need help rescheduling?",
	},
	{
		event: 'UPCOMING_TASKS',
		tag: 'warning',
		priority: 2,
		condition: ({ taskDensity }) => taskDensity && taskDensity.tasksNext3 >= 4,
		message: "⚠️ [Heads-up] You have several tasks due in the next few days. Time to focus! 🎯",
	},
	{
		event: 'ZUNO_IMPROVEMENT',
		tag: 'positive',
		priority: 3,
		condition: ({ zunoHistory, trendScore }) => {
			if (zunoHistory.length < 2) return false;
			const last = zunoHistory[zunoHistory.length - 1].score;
			const prev = zunoHistory[zunoHistory.length - 2].score;
			const scoreImproving = last - prev >= 15;
			const trendPositive = trendScore && trendScore.slope > 1.0;
			return scoreImproving || trendPositive;
		},
		message: "✅ [Positive] Great job! Your Zuno score is improving. Keep up the good work! 🌟",
	},
	{
		event: 'HIGH_COMPLETION',
		tag: 'positive',
		priority: 4,
		condition: ({ canvasStats, zunoStats }) => {
			const highCanvas = canvasStats && canvasStats.percent >= 95;
			const highZuno = zunoStats && zunoStats.percent >= 95;
			return highCanvas || highZuno;
		},
		message: "✅ [Positive] Excellent job completing your assignments! Your productivity is impressive! 📚",
	},
];

async function evaluateAndCreateNotifications(userId, metrics) {
	const matchedTriggers = triggers
		.filter(trigger => {
			try {
				return trigger.condition(metrics);
			} catch (error) {
				return false;
			}
		})
		.sort((a, b) => a.priority - b.priority);

	const limitedTriggers = matchedTriggers.slice(0, 2);

	const newNotifications = limitedTriggers.map(trigger => ({
		userId,
		type: 'IN_APP',
		content: trigger.message,
		trigger_event: trigger.event,
		sent_at: new Date(),
		status: 'UNREAD',
		read: false,
		tag: trigger.tag,
	}));

	if (newNotifications.length) {
		await prisma.notification.createMany({ data: newNotifications });
	}

	return newNotifications;
}

module.exports = { evaluateAndCreateNotifications };
