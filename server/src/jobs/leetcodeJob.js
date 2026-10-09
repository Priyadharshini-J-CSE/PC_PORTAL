const cron = require('node-cron');
const LeetCode = require('../models/LeetCode');
const { fetchLeetCodeStats } = require('../services/leetcodeService');

const BATCH_SIZE = 5;
const DELAY_MS = 2000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function refreshAll() {
  const records = await LeetCode.find({ leetcodeUsername: { $exists: true, $ne: '' } });
  console.log(`[cron] Refreshing ${records.length} LeetCode records`);

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (record) => {
        try {
          const stats = await fetchLeetCodeStats(record.leetcodeUsername);
          Object.assign(record, stats, { fetchStatus: 'success', fetchError: null, lastFetchedAt: new Date() });
          await record.save();
        } catch (err) {
          record.fetchStatus = 'error';
          record.fetchError = err.message;
          await record.save();
          console.warn(`[cron] Failed to fetch ${record.leetcodeUsername}: ${err.message}`);
        }
      })
    );
    if (i + BATCH_SIZE < records.length) await sleep(DELAY_MS);
  }
  console.log('[cron] LeetCode refresh complete');
}

function startLeetCodeJob() {
  // Run daily at 2 AM
  cron.schedule('0 2 * * *', () => {
    refreshAll().catch((err) => console.error('[cron] refreshAll error:', err.message));
  });
  console.log('[cron] LeetCode daily refresh job scheduled (2 AM)');
}

module.exports = { startLeetCodeJob, refreshAll };
