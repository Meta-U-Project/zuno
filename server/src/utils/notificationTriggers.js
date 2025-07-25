const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const triggers = [
	// NEGATIVE / CAUTIONARY
	{
		event: 'ZUNO_DROP',
		tag: 'warning',
		condition: ({ zunoHistory }) => {
			if (zunoHistory.length < 2) return false;
			const last = zunoHistory[zunoHistory.length - 1].score;
			const prev = zunoHistory[zunoHistory.length - 2].score;
			return prev - last >= 15;
		},
		message: "⚠️ [Warning] We noticed a dip in your momentum. Let's plan a recovery day 📅.",
	},
	{
		event: 'TREND_SLOPE',
		tag: 'warning',
		condition: ({ trendScore }) => trendScore && trendScore.slope < -1.5,
		message: "⚠️ [Warning] Your performance is trending downward. Try focusing more in your classes.",
	},
	{
		event: 'LOW_ADHERENCE',
		tag: 'warning',
		condition: ({ studyStats }) => studyStats && studyStats.adherenceScore < 40,
		message: "⚠️ [Warning] You're skipping study sessions frequently. Need help rescheduling?",
	},
	{
		event: 'HIGH_TASK_DENSITY',
		tag: 'warning',
		condition: ({ taskDensity }) => taskDensity && taskDensity.stressScore < 50,
		message: "⚠️ [Warning] Lots of work due soon. Want to front-load your schedule this week?",
	},
	{
		event: 'UPCOMING_TASKS',
		tag: 'warning',
		condition: ({ taskDensity }) => taskDensity && taskDensity.tasksNext3 >= 3,
		message: "⚠️ [Heads-up] You have several tasks due in the next few days. Time to focus! 🎯",
	},

	// POSITIVE / PRAISE
	{
		event: 'ZUNO_RISE',
		tag: 'positive',
		condition: ({ zunoHistory }) => {
			if (zunoHistory.length < 2) return false;
			const last = zunoHistory[zunoHistory.length - 1].score;
			const prev = zunoHistory[zunoHistory.length - 2].score;
			return last - prev >= 10;
		},
		message: "✅ [Positive] Great job! Your Zuno score is improving. Keep up the good work! 🌟",
	},
	{
		event: 'PERFECT_ADHERENCE',
		tag: 'positive',
		condition: ({ studyStats }) => studyStats && studyStats.adherenceScore >= 90,
		message: "✅ [Positive] Amazing study session attendance! You're building excellent habits. 💪",
	},
	{
		event: 'HIGH_CANVAS_COMPLETION',
		tag: 'positive',
		condition: ({ canvasStats }) => canvasStats && canvasStats.percent >= 90,
		message: "✅ [Positive] Excellent job completing your Canvas assignments! 📚",
	},
	{
		event: 'HIGH_ZUNO_COMPLETION',
		tag: 'positive',
		condition: ({ zunoStats }) => zunoStats && zunoStats.percent >= 90,
		message: "✅ [Positive] You're doing great with your Zuno tasks! Your productivity is impressive! ✅",
	},
	{
		event: 'BALANCED_WORKLOAD',
		tag: 'positive',
		condition: ({ taskDensity }) => taskDensity && taskDensity.stressScore > 80,
		message: "✅ [Positive] Your workload looks well-balanced this week. Great job planning ahead! 📊",
	},
	{
		event: 'POSITIVE_TREND',
		tag: 'positive',
		condition: ({ trendScore }) => trendScore && trendScore.slope > 1.0,
		message: "✅ [Positive] Your performance is trending upward! Your hard work is paying off! 📈",
	},
	{
		event: 'STUDY_SESSIONS_SCHEDULED',
		tag: 'positive',
		condition: ({ studyStats }) => studyStats && studyStats.scheduled > 3,
		message: "✅ [Positive] You've scheduled several study sessions. Great planning ahead! 🗓️",
	},
];



async function evaluateAndCreateNotifications(userId, metrics) {
	const newNotifications = triggers
		.filter(trigger => {
			try {
				return trigger.condition(metrics);
			} catch (error) {
				console.error(`Error evaluating trigger ${trigger.event}:`, error);
				return false;
			}
		})
		.map(trigger => ({
			userId,
			type: 'IN_APP',
			content: trigger.message,
			trigger_event: trigger.event,
			sent_at: new Date(),
			status: 'UNREAD',
			read: false,
		}));

	if (newNotifications.length) {
		await prisma.notification.createMany({ data: newNotifications });
	}

	return newNotifications;
}

module.exports = { evaluateAndCreateNotifications };
