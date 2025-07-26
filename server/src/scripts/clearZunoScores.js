const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function clearZunoScores() {
  console.log('Starting ZunoScore cleanup...');

  try {
    // Delete all ZunoScores
    console.log('Deleting ZunoScores...');
    const zunoScoreResult = await prisma.zunoScore.deleteMany({});
    console.log(`✓ ${zunoScoreResult.count} ZunoScores deleted`);

    // Delete all TaskCompletionHistory records
    console.log('Deleting TaskCompletionHistory records...');
    const taskHistoryResult = await prisma.taskCompletionHistory.deleteMany({});
    console.log(`✓ ${taskHistoryResult.count} TaskCompletionHistory records deleted`);

    console.log('ZunoScore cleanup completed successfully!');
    console.log('All other data has been preserved.');

  } catch (error) {
    console.error('Error during ZunoScore cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearZunoScores()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error during ZunoScore cleanup:', error);
    process.exit(1);
  });
