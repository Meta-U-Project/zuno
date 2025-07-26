const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Script to update a user's phone number to E.164 format
 * Run with: node src/scripts/updateUserPhone.js
 */

async function updateUserPhone() {
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

    console.log(`Current phone number for ${user.firstName}: ${user.phone}`);

    // Format the phone number to E.164 format
    let formattedPhone = user.phone;

    // If the phone number doesn't start with '+', add the US country code
    if (user.phone && !user.phone.startsWith('+')) {
      // Remove any non-digit characters
      const digitsOnly = user.phone.replace(/\D/g, '');

      // If the number already has the country code (starts with 1), add the + sign
      if (digitsOnly.startsWith('1') && digitsOnly.length === 11) {
        formattedPhone = `+${digitsOnly}`;
      }
      // If the number doesn't have the country code, add +1 (US)
      else if (digitsOnly.length === 10) {
        formattedPhone = `+1${digitsOnly}`;
      }
      // Otherwise, just add the + sign
      else {
        formattedPhone = `+${digitsOnly}`;
      }
    }

    // Update the user's phone number
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { phone: formattedPhone }
    });

    console.log(`Updated phone number for ${updatedUser.firstName}: ${updatedUser.phone}`);

    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (e164Regex.test(updatedUser.phone)) {
      console.log('Phone number is now in valid E.164 format');
    } else {
      console.error('Phone number is still NOT in valid E.164 format');
      console.log('E.164 format example: +1XXXXXXXXXX (for US numbers)');
    }

  } catch (error) {
    console.error('Error updating user phone:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserPhone();
