//test document to add preferred times to an existing user
const { PrismaClient } = require('./src/generated/prisma');
const { insertExamplePreferredTimes } = require('./src/utils/insertPreferredTimes');

const prisma = new PrismaClient();

async function addPreferredTimesToExistingUser() {
    console.log('🔍 Adding preferred study times to existing user...');

    try {
        // Get all users to help identify the correct one
        const users = await prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                school: true
            }
        });

        if (users.length === 0) {
            console.log('❌ No users found in the database');
            return;
        }

        console.log('\n📋 Available users:');
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ${user.school || 'No school'}`);
            console.log(`   ID: ${user.id}`);
        });

        // Use the second user (student2@studyzuno.com)
        const targetUser = users[1];
        console.log(`\n✅ Using user: ${targetUser.firstName} ${targetUser.lastName} (${targetUser.email})`);

        // Check if user already has preferred times
        const existingPreferences = await prisma.preferredStudyTime.findMany({
            where: { userId: targetUser.id }
        });

        if (existingPreferences.length > 0) {
            console.log(`⚠️ User already has ${existingPreferences.length} preferred study times:`);
            existingPreferences.forEach(pref => {
                console.log(`   ${pref.day}: ${pref.startTime} - ${pref.endTime}`);
            });
            console.log('\n🔄 Replacing existing preferences with new ones...');
        }

        // Insert example preferred study times for the user
        await insertExamplePreferredTimes(targetUser.id);
        console.log('✅ Successfully added example preferred study times');

        // Verify the inserted data
        const preferredTimes = await prisma.preferredStudyTime.findMany({
            where: { userId: targetUser.id },
            orderBy: [
                { day: 'asc' },
                { startTime: 'asc' }
            ]
        });

        console.log('\n📋 Current preferred study times for user:');
        preferredTimes.forEach(time => {
            console.log(`   ${time.day}: ${time.startTime} - ${time.endTime}`);
        });

        console.log('\n🎉 Preferred study times added successfully!');
        console.log('\n💡 You can now test the scheduling functionality with these preferences.');

    } catch (error) {
        console.error('❌ Error adding preferred times:', error);
        throw error;
    }
}

addPreferredTimesToExistingUser()
    .catch((e) => {
        console.error('❌ Operation failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
