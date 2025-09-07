const cron = require('node-cron');
const { checkExpiredSubscriptions } = require('../controllers/subscription.controller');

// Run every hour to check for expired subscriptions
const startSubscriptionCronJob = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('Running subscription expiry check...');
    await checkExpiredSubscriptions();
  });

  console.log('Subscription CRON job started - runs every hour');
};

module.exports = { startSubscriptionCronJob };