const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('Starting database cleanup...');

  try {
    // Delete all calendar events
    console.log('Deleting calendar events...');
    await prisma.calendarEvent.deleteMany({});
    console.log('✓ Calendar events deleted');

    // Delete all tasks
    console.log('Deleting tasks...');
    await prisma.task.deleteMany({});
    console.log('✓ Tasks deleted');

    // Delete all preferred study times
    console.log('Deleting preferred study times...');
    await prisma.preferredStudyTime.deleteMany({});
    console.log('✓ Preferred study times deleted');

    // Delete all messages
    console.log('Deleting messages...');
    await prisma.message.deleteMany({});
    console.log('✓ Messages deleted');

    // Delete all notifications
    console.log('Deleting notifications...');
    await prisma.notification.deleteMany({});
    console.log('✓ Notifications deleted');

    // Delete all announcements
    console.log('Deleting announcements...');
    await prisma.announcement.deleteMany({});
    console.log('✓ Announcements deleted');

    // Delete all lectures
    console.log('Deleting lectures...');
    await prisma.lecture.deleteMany({});
    console.log('✓ Lectures deleted');

    // Delete all study group members
    console.log('Deleting study group members...');
    await prisma.studyGroupMember.deleteMany({});
    console.log('✓ Study group members deleted');

    // Delete all study groups
    console.log('Deleting study groups...');
    await prisma.studyGroup.deleteMany({});
    console.log('✓ Study groups deleted');

    // Delete all analytics
    console.log('Deleting analytics...');
    await prisma.analytics.deleteMany({});
    console.log('✓ Analytics deleted');

    // Delete all courses
    console.log('Deleting courses...');
    await prisma.course.deleteMany({});
    console.log('✓ Courses deleted');

    console.log('Database cleanup completed successfully!');
    console.log('User authentication data has been preserved.');

  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error during database cleanup:', error);
    process.exit(1);
  });
