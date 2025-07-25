const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Script to check a user's phone number format
 * Run with: node src/scripts/checkUserPhone.js
 */

async function checkUserPhone() {
  try {
    // Use the specific userId
    const userId = '0f10f0f0-8d28-437c-8ac5-88b8cf0c9cfc';

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, phone: true }
    });

    if (!user) {
      console.error(`User with ID ${userId} not found in the database`);
      return;
    }

    console.log(`User: ${user.firstName} (${user.id})`);
    console.log(`Phone number: ${user.phone}`);

    // Check if the phone number is in E.164 format
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (user.phone && e164Regex.test(user.phone)) {
      console.log('Phone number is in valid E.164 format');
    } else {
      console.error('Phone number is NOT in valid E.164 format');
      console.log('E.164 format example: +1XXXXXXXXXX (for US numbers)');
    }

  } catch (error) {
    console.error('Error checking user phone:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPhone();
