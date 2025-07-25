const { PrismaClient } = require('../generated/prisma');
const { sendSmsNotification } = require('../services/textbeltService');
const prisma = new PrismaClient();

/**
 * Script to create a test SMS notification using TextBelt for a user
 * Run with: node src/scripts/createTestTextbeltNotification.js
 */

async function createTestTextbeltNotification() {
  try {
    // Use the specific userId
    const userId = '0f10f0f0-8d28-437c-8ac5-88b8cf0c9cfc';

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, phone: true }
    });

    if (!user) {
      console.error(`User with ID ${userId} not found in the database`);
      return;
    }

    if (!user.phone) {
      console.error(`User with ID ${userId} does not have a phone number`);
      return;
    }

    console.log(`Creating test TextBelt SMS notification for user: ${user.firstName} (${user.id})`);
    console.log(`Phone number: ${user.phone}`);

    // Create a test notification
    const notification = {
      userId: user.id,
      type: 'SMS',
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

    // Send the SMS notification using TextBelt
    const smsResult = await sendSmsNotification(user, savedNotification);

    if (smsResult && smsResult.success) {
      console.log('TextBelt SMS notification sent successfully!');
      console.log('TextBelt quota remaining:', smsResult.quotaRemaining);
      console.log('TextBelt message ID:', smsResult.textId);
    } else {
      console.log('TextBelt SMS notification not sent');
    }
  } catch (error) {
    console.error('Error creating test TextBelt SMS notification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestTextbeltNotification();
