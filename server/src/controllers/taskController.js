const { PrismaClient } = require('../generated/prisma');
const {
    getEligibleTasks,
    scheduleStudyBlocks,
    saveStudyBlocks
} = require('../utils/scheduleAlgorithmUtils');

const prisma = new PrismaClient();

const createTask = async (req, res) => {
    try {
        const {
            courseId,
            title,
            type,
            description,
            priority,
            deadline,
            source = "user"
        } = req.body;

        const newTask = await prisma.task.create({
            data: {
                userId: req.user.id,
                courseId,
                title,
                type,
                description,
                priority,
                deadline: new Date(deadline),
                completed: false,
                source
            }
        });

        res.status(201).json(newTask);
    } catch (err) {
        console.error('Error creating task:', err);
        res.status(500).json({ error: 'Something went wrong creating task' });
    }
};

const updateTask = async (req, res) => {
    const { taskId } = req.params;
    const {
        title,
        type,
        description,
        priority,
        deadline,
        completed
    } = req.body;

    try {
        const updatedTask = await prisma.task.update({
            where: {
                id: taskId
            },
            data: {
                title,
                type,
                description,
                priority,
                deadline: new Date(deadline),
                completed
            }
        });

        res.status(200).json(updatedTask);
    } catch (err) {
        console.error('Error updating task:', err);
        res.status(500).json({ error: 'Something went wrong updating task' });
    }
};

const deleteTask = async (req, res) => {
    const { taskId } = req.params;
    try {
        await prisma.task.delete({
            where: {
                id: taskId
            }
        });
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ error: 'Something went wrong deleting task' });
    }
};


const checkTasksNeedingScheduling = async (req, res) => {
    try {
        const userId = req.user.id;

        const eligibleTasks = await getEligibleTasks(userId);

        const needsScheduling = eligibleTasks.length > 0;

        res.status(200).json({
            needsScheduling,
            taskCount: eligibleTasks.length
        });
    } catch (error) {
        console.error('Error checking tasks needing scheduling:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check tasks needing scheduling'
        });
    }
};

const scheduleStudySessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { schedulingPeriodDays, saveToCalendar = false, taskIds = [], blockIds = [] } = req.body;

        const allEligibleTasks = await getEligibleTasks(userId);

        if (allEligibleTasks.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No eligible tasks found that require study blocks',
                scheduledBlocks: [],
                summary: { totalTasks: 0, totalBlocks: 0, totalStudyTime: 0 }
            });
        }

        let eligibleTasks = allEligibleTasks;
        if (saveToCalendar && taskIds.length > 0) {
            eligibleTasks = allEligibleTasks.filter(task => taskIds.includes(task.id));
        }

        const startDate = new Date();
        let endDate = new Date();

        const tasksWithDeadlines = eligibleTasks.filter(task => task.deadline);

        if (tasksWithDeadlines.length > 0) {
            const furthestDeadline = new Date(Math.max(
                ...tasksWithDeadlines.map(task => new Date(task.deadline).getTime())
            ));

            const minimumEndDate = new Date();
            minimumEndDate.setDate(minimumEndDate.getDate() + 14);

            endDate = furthestDeadline > minimumEndDate ? furthestDeadline : minimumEndDate;
        } else if (schedulingPeriodDays) {
            endDate.setDate(endDate.getDate() + schedulingPeriodDays);
        } else {
            endDate.setDate(endDate.getDate() + 14);
        }

        const actualSchedulingPeriodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

        const scheduledBlocks = await scheduleStudyBlocks(userId, eligibleTasks, startDate, endDate);

        const calculateDuration = (block) => (block.end_time - block.start_time) / (1000 * 60);

        const totalStudyTime = scheduledBlocks.reduce((sum, block) => sum + calculateDuration(block), 0);

        const dailyBreakdown = {};
        scheduledBlocks.forEach(block => {
            const dayKey = block.start_time.toISOString().split('T')[0];
            if (!dailyBreakdown[dayKey]) {
                dailyBreakdown[dayKey] = { blocks: 0, totalMinutes: 0 };
            }
            dailyBreakdown[dayKey].blocks++;
            dailyBreakdown[dayKey].totalMinutes += calculateDuration(block);
        });

        let savedEvents = [];
        if (saveToCalendar && scheduledBlocks.length > 0) {
            let blocksToSave = [];

            if (blockIds && blockIds.length > 0) {
                blocksToSave = scheduledBlocks.filter(block => {
                    const blockId = `${block.taskId}-${new Date(block.start_time).getTime()}`;
                    return blockIds.includes(blockId);
                });
            } else if (taskIds.length > 0) {
                blocksToSave = scheduledBlocks.filter(block => taskIds.includes(block.taskId));
            } else {
                blocksToSave = scheduledBlocks;
            }

            if (blocksToSave.length > 0) {
                savedEvents = await saveStudyBlocks(blocksToSave);
            }
        }

        const tasksWithScheduling = eligibleTasks.map(task => {
            const taskBlocks = scheduledBlocks.filter(block => block.taskId === task.id);
            const scheduledTime = taskBlocks.reduce((sum, block) => sum + calculateDuration(block), 0);
            const requiredStudyTime = (task.studyTime || 60) * 60;

            return {
                id: task.id,
                title: task.title,
                requiredStudyTime: requiredStudyTime / 60,
                scheduledTime,
                blocksCount: taskBlocks.length,
                fullyScheduled: scheduledTime >= requiredStudyTime,
                blocks: taskBlocks.map(block => ({
                    start_time: block.start_time,
                    end_time: block.end_time,
                    duration: calculateDuration(block),
                    day: block.start_time.toISOString().split('T')[0],
                    startTimeFormatted: block.start_time.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    }),
                    endTimeFormatted: block.end_time.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    })
                }))
            };
        });

        res.status(200).json({
            success: true,
            message: `Successfully scheduled ${scheduledBlocks.length} study blocks for ${eligibleTasks.length} tasks`,
            tasks: tasksWithScheduling,
            summary: {
                totalTasks: eligibleTasks.length,
                totalBlocks: scheduledBlocks.length,
                totalStudyTime,
                dailyBreakdown
            },
            schedulingPeriod: {
                startDate,
                endDate,
                days: actualSchedulingPeriodDays
            }
        });

    } catch (error) {
        console.error('Error scheduling study sessions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to schedule study sessions'
        });
    }
};

module.exports = {
    createTask,
    updateTask,
    deleteTask,
    scheduleStudySessions,
    checkTasksNeedingScheduling
};
