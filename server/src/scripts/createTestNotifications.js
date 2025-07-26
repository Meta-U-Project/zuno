const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Script to create test notifications for a user
 * Run with: node src/scripts/createTestNotifications.js
 */

async function createTestNotifications() {
  try {
    // Use the specific userId
    const userId = '0f10f0f0-8d28-437c-8ac5-88b8cf0c9cfc';

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.error(`User with ID ${userId} not found in the database`);
      return;
    }

    console.log(`Creating test notifications for user: ${user.firstName} ${user.lastName} (${user.id})`);

    // Create sample notifications with different tags
    const notifications = [
      {
        userId: user.id,
        type: 'IN_APP',
        content: '✅ [Positive] Great job! Your Zuno score is improving. Keep up the good work! 🌟',
        trigger_event: 'ZUNO_RISE',
        sent_at: new Date(),
        status: 'UNREAD',
        read: false,
        tag: 'positive',
      },
      {
        userId: user.id,
        type: 'IN_APP',
        content: '⚠️ [Warning] We noticed a dip in your momentum. Let\'s plan a recovery day 📅.',
        trigger_event: 'ZUNO_DROP',
        sent_at: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        status: 'UNREAD',
        read: false,
        tag: 'warning',
      },
      {
        userId: user.id,
        type: 'IN_APP',
        content: '✅ [Positive] Amazing study session attendance! You\'re building excellent habits. 💪',
        trigger_event: 'PERFECT_ADHERENCE',
        sent_at: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        status: 'UNREAD',
        read: false,
        tag: 'positive',
      },
      {
        userId: user.id,
        type: 'IN_APP',
        content: '⚠️ [Warning] You\'re skipping study sessions frequently. Need help rescheduling?',
        trigger_event: 'LOW_ADHERENCE',
        sent_at: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        status: 'UNREAD',
        read: false,
        tag: 'warning',
      },
      {
        userId: user.id,
        type: 'IN_APP',
        content: '⚠️ [Heads-up] You have several tasks due in the next few days. Time to focus! 🎯',
        trigger_event: 'UPCOMING_TASKS',
        sent_at: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        status: 'UNREAD',
        read: false,
        tag: 'warning',
      },
    ];

    // Create the notifications
    await prisma.notification.createMany({
      data: notifications,
    });

    console.log(`Created ${notifications.length} test notifications`);
  } catch (error) {
    console.error('Error creating test notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestNotifications();
