const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Script to delete calendar events of type 'TASK_BLOCK' (study blocks)
 * This allows for re-running the scheduling algorithm without duplicate events
 */
async function deleteStudyBlocks() {
  try {
    console.log('Deleting study blocks...');

    // Get current date for logging
    const now = new Date();
    console.log(`Starting deletion at: ${now.toLocaleString()}`);

    // Delete all calendar events with type 'TASK_BLOCK'
    const deletedEvents = await prisma.calendarEvent.deleteMany({
      where: {
        type: 'TASK_BLOCK'
      }
    });

    console.log(`Successfully deleted ${deletedEvents.count} study blocks`);

    // Optionally, reset the requiresStudyBlock flag on tasks
    // This will make tasks eligible for scheduling again
    const updatedTasks = await prisma.task.updateMany({
      where: {
        completed: false
      },
      data: {
        requiresStudyBlock: true
      }
    });

    console.log(`Reset ${updatedTasks.count} tasks to require study blocks`);

    return {
      deletedEvents: deletedEvents.count,
      updatedTasks: updatedTasks.count
    };
  } catch (error) {
    console.error('Error deleting study blocks:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function if this script is run directly
if (require.main === module) {
  deleteStudyBlocks()
    .then((result) => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

// Export the function for use in other files
module.exports = { deleteStudyBlocks };
