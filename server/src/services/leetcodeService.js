const https = require('https');

const LEETCODE_GQL = 'https://leetcode.com/graphql';

const QUERY = `
query userPublicProfile($username: String!) {
  matchedUser(username: $username) {
    profile { ranking }
    submitStats {
      acSubmissionNum {
        difficulty
        count
      }
    }
    userContestRanking {
      rating
      attendedContestsCount
    }
  }
}`;

function httpsPost(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'Mozilla/5.0',
        Referer: 'https://leetcode.com',
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error('Invalid JSON response')); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    req.write(data);
    req.end();
  });
}

async function fetchLeetCodeStats(username) {
  const result = await httpsPost(LEETCODE_GQL, {
    query: QUERY,
    variables: { username },
  });

  const user = result?.data?.matchedUser;
  if (!user) throw new Error(`User "${username}" not found on LeetCode`);

  const stats = user.submitStats?.acSubmissionNum || [];
  const byDiff = Object.fromEntries(stats.map((s) => [s.difficulty, s.count]));
  const contest = user.userContestRanking;

  return {
    globalRank: user.profile?.ranking || null,
    contestRating: contest?.rating ? Math.round(contest.rating) : null,
    contestsAttended: contest?.attendedContestsCount || 0,
    totalSolved: byDiff['All'] || 0,
    easySolved: byDiff['Easy'] || 0,
    mediumSolved: byDiff['Medium'] || 0,
    hardSolved: byDiff['Hard'] || 0,
  };
}

module.exports = { fetchLeetCodeStats };
