const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Script to clear all notifications from the database
 * Run with: node src/scripts/clearNotifications.js
 */

async function clearNotifications() {
  try {
    // Use the specific userId
    const userId = '0f10f0f0-8d28-437c-8ac5-88b8cf0c9cfc';

    // Delete notifications for this specific user
    const result = await prisma.notification.deleteMany({
      where: { userId }
    });

    console.log(`Deleted ${result.count} notifications for user ${userId}`);
  } catch (error) {
    console.error('Error clearing notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearNotifications();
