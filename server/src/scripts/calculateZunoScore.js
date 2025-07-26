const { calculateZunoScoreForUser } = require('../utils/zunoScoreEngine');

calculateZunoScoreForUser('0f10f0f0-8d28-437c-8ac5-88b8cf0c9cfc')
    .then(({ zunoScore, notifications }) => {
	    console.log('✅ Zuno Score:', zunoScore);
	    console.log('🔔 Notifications Triggered:', notifications);
	    process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error calculating Zuno Score:', err);
        process.exit(1);
    });
