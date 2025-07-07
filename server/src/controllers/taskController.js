const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const createTask = async (req, res) => {
    try {
        const {
            courseId,
            title,
            type,
            description,
            priority,
            deadline
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
                completed: false
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

module.exports = {
    createTask,
    updateTask,
    deleteTask
};
