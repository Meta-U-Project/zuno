const { PrismaClient } = require('../generated/prisma');
const { sendEmailNotification } = require('../services/emailService');
const prisma = new PrismaClient();

/**
 * Script to create a test email notification for a user
 * Run with: node src/scripts/createTestEmailNotification.js
 */

async function createTestEmailNotification() {
  try {
    // Use the specific userId
    const userId = '0f10f0f0-8d28-437c-8ac5-88b8cf0c9cfc';

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true }
    });

    if (!user) {
      console.error(`User with ID ${userId} not found in the database`);
      return;
    }

    console.log(`Creating test email notification for user: ${user.firstName} (${user.id})`);

    // Create a test notification
    const notification = {
      userId: user.id,
      type: 'EMAIL',
      content: '⚠️ [Warning] You have several tasks due in the next few days. Time to focus! 🎯',
      trigger_event: 'UPCOMING_TASKS',
      sent_at: new Date(),
      status: 'UNREAD',
      read: false,
      tag: 'warning',
    };

    // Save the notification to the database
    const savedNotification = await prisma.notification.create({
      data: notification
    });

    console.log('Created notification:', savedNotification);

    // Get upcoming tasks for the user
    const upcomingTasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        completed: false,
        deadline: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      },
      orderBy: { deadline: 'asc' },
      include: { course: true },
      take: 5 // Limit to 5 tasks
    });

    console.log(`Found ${upcomingTasks.length} upcoming tasks for the email`);

    // Send the email notification
    const emailResult = await sendEmailNotification(
      user,
      savedNotification,
      { upcomingTasks }
    );

    console.log('Email notification sent:', emailResult.messageId);
  } catch (error) {
    console.error('Error creating test email notification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestEmailNotification();
