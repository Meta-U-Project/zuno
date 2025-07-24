const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function getAnalytics(req, res) {
	const userId = req.user.id;

	const today = new Date();
	const startOfWeek = new Date(today);
	startOfWeek.setDate(today.getDate() - today.getDay());
	const endOfWeek = new Date(startOfWeek);
	endOfWeek.setDate(startOfWeek.getDate() + 7);

	const latestScore = await prisma.zunoScore.findFirst({
		where: { userId },
		orderBy: { createdAt: 'desc' },
	});

	const canvasTasks = await prisma.task.findMany({
		where: {
			userId,
			source: { equals: 'canvas', mode: 'insensitive' },
			deadline: { gte: startOfWeek, lt: endOfWeek },
		},
	});
	const canvasCompleted = canvasTasks.filter(t => t.completed).length;

	const zunoTasks = await prisma.task.findMany({
		where: {
			userId,
			source: { equals: 'user', mode: 'insensitive' },
			deadline: { gte: startOfWeek, lt: endOfWeek },
		},
	});
	const zunoCompleted = zunoTasks.filter(t => t.completed).length;

	const studyBlocks = await prisma.calendarEvent.findMany({
		where: {
			userId,
			type: 'TASK_BLOCK',
			location: 'Study Session',
			start_time: { gte: startOfWeek, lt: endOfWeek },
		},
	});
	const studyCompleted = studyBlocks.filter(b => b.completed).length;

	const totalThisWeek = canvasTasks.length + zunoTasks.length + studyBlocks.length;
	const completedThisWeek = canvasCompleted + zunoCompleted + studyCompleted;
	const weeklyProgress = totalThisWeek === 0 ? 100 : Math.round((completedThisWeek / totalThisWeek) * 100);

	res.json({
		zunoScore: latestScore?.score ?? 0,
		canvasCompletion: latestScore?.canvasCompletion ?? 0,
		zunoCompletion: latestScore?.zunoTaskCompletion ?? 0,
		completedTasks: canvasCompleted,
		totalTasks: canvasTasks.length,
		weeklyProgress,
	});
}

module.exports = { getAnalytics };
