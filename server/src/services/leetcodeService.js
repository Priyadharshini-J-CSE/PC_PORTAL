const https = require('https');

const LEETCODE_GQL = 'https://leetcode.com/graphql';

const QUERY_PROFILE = `
query userPublicProfile($username: String!) {
  matchedUser(username: $username) {
    profile { ranking }
    submitStats {
      acSubmissionNum { difficulty count }
    }
  }
}`;

const QUERY_CONTEST = `
query userContestRankingInfo($username: String!) {
  userContestRanking(username: $username) {
    rating
    attendedContestsCount
    globalRanking
  }
}`;

function httpsPost(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'leetcode.com',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://leetcode.com',
        'Origin': 'https://leetcode.com',
      },
      timeout: 12000,
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error('Invalid JSON from LeetCode API')); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('LeetCode API timed out')); });
    req.write(data);
    req.end();
  });
}

async function fetchLeetCodeStats(username) {
  // Run both queries in parallel
  const [profileRes, contestRes] = await Promise.allSettled([
    httpsPost({ query: QUERY_PROFILE, variables: { username } }),
    httpsPost({ query: QUERY_CONTEST, variables: { username } }),
  ]);

  // Profile query must succeed
  if (profileRes.status === 'rejected') throw new Error(profileRes.reason.message);
  const profileData = profileRes.value;
  if (profileData.errors) throw new Error(profileData.errors[0]?.message || 'LeetCode API error');

  const user = profileData.data?.matchedUser;
  if (!user) throw new Error(`User "${username}" not found on LeetCode`);

  const stats = user.submitStats?.acSubmissionNum || [];
  const byDiff = Object.fromEntries(stats.map((s) => [s.difficulty, s.count]));

  // Contest query is optional — don't fail if it errors
  let contestRating = null, contestsAttended = 0;
  if (contestRes.status === 'fulfilled' && !contestRes.value.errors) {
    const cr = contestRes.value.data?.userContestRanking;
    if (cr) {
      contestRating = cr.rating ? Math.round(cr.rating) : null;
      contestsAttended = cr.attendedContestsCount || 0;
    }
  }

  return {
    globalRank: user.profile?.ranking || null,
    contestRating,
    contestsAttended,
    totalSolved: byDiff['All'] || 0,
    easySolved: byDiff['Easy'] || 0,
    mediumSolved: byDiff['Medium'] || 0,
    hardSolved: byDiff['Hard'] || 0,
  };
}

module.exports = { fetchLeetCodeStats };
