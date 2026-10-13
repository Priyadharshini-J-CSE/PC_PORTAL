const LeetCode = require('../models/LeetCode');
const StudentMaster = require('../models/StudentMaster');
const { isAllowedRegisterNo } = require('../config/roster');
const { fetchLeetCodeStats } = require('../services/leetcodeService');
const { parse } = require('csv-parse/sync');

function parseFileToRows(file) {
  const ext = file.originalname.split('.').pop().toLowerCase();
  if (ext === 'xlsx' || ext === 'xls') {
    const XLSX = require('xlsx');
    const wb = XLSX.read(file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
    return raw.map(row => {
      const clean = {};
      Object.entries(row).forEach(([k, v]) => { clean[k.replace(/^\uFEFF/, '').trim()] = String(v).trim(); });
      return clean;
    });
  }
  const text = file.buffer.toString('utf8').replace(/^\uFEFF/, '');
  const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true, bom: true });
  return rows.map(row => {
    const clean = {};
    Object.entries(row).forEach(([k, v]) => { clean[k.replace(/^\uFEFF/, '').trim()] = String(v).trim(); });
    return clean;
  });
}

async function listLeetCode(req, res) {
  try {
    const records = await LeetCode.find().lean();
    const missing = records.filter(r => !r.name || !r.rollNo).map(r => r.registerNo);
    let masterMap = {};
    if (missing.length) {
      const masters = await StudentMaster.find({ registerNo: { $in: missing } }).lean();
      masterMap = Object.fromEntries(masters.map(m => [m.registerNo, m]));
    }
    const data = records.map(r => ({
      ...r,
      name:   r.name   || masterMap[r.registerNo]?.name   || '—',
      rollNo: r.rollNo || masterMap[r.registerNo]?.rollNo || '—',
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function upsertLeetCode(req, res) {
  try {
    const registerNo = String(req.body.registerNo || '').trim().toUpperCase();
    const username   = String(req.body.leetcodeUsername || '').trim();
    if (!registerNo || !username)
      return res.status(400).json({ error: 'registerNo and leetcodeUsername are required' });
    if (!isAllowedRegisterNo(registerNo))
      return res.status(400).json({ error: 'Register number not in approved roster' });
    const record = await LeetCode.findOneAndUpdate(
      { registerNo },
      { $set: { leetcodeUsername: username, fetchStatus: 'pending' } },
      { upsert: true, new: true }
    );
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function refreshOne(req, res) {
  try {
    const registerNo = req.params.registerNo.toUpperCase();
    const record = await LeetCode.findOne({ registerNo });
    if (!record || !record.leetcodeUsername)
      return res.status(404).json({ error: 'No LeetCode username set for this student' });
    try {
      const stats = await fetchLeetCodeStats(record.leetcodeUsername);
      Object.assign(record, stats, { fetchStatus: 'success', fetchError: null, lastFetchedAt: new Date() });
    } catch (fetchErr) {
      record.fetchStatus = 'error';
      record.fetchError  = fetchErr.message;
    }
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

// Refresh all records — runs in background, responds immediately with count
async function refreshAll(req, res) {
  try {
    const records = await LeetCode.find({ leetcodeUsername: { $exists: true, $ne: '' } }).lean();
    if (!records.length) return res.json({ message: 'No LeetCode records to refresh', count: 0 });

    res.json({ message: `Refreshing ${records.length} profiles in background…`, count: records.length });

    // Background batch — 1.5s delay between each to avoid rate limiting
    setImmediate(async () => {
      for (const r of records) {
        try {
          const stats = await fetchLeetCodeStats(r.leetcodeUsername);
          await LeetCode.findOneAndUpdate(
            { registerNo: r.registerNo },
            { $set: { ...stats, fetchStatus: 'success', fetchError: null, lastFetchedAt: new Date() } }
          );
        } catch (e) {
          await LeetCode.findOneAndUpdate(
            { registerNo: r.registerNo },
            { $set: { fetchStatus: 'error', fetchError: e.message } }
          );
        }
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function importLeetCode(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    let rows;
    try {
      rows = parseFileToRows(req.file);
    } catch (parseErr) {
      return res.status(400).json({
        error: 'Could not read file',
        detail: parseErr.message,
        hint: 'Supported formats: .csv, .xlsx, .xls',
      });
    }

    if (!rows.length) return res.status(400).json({ error: 'File is empty' });

    const headers = Object.keys(rows[0]);
    const hasRollNumber  = headers.some(h => /^roll.?number$/i.test(h));
    const hasLeetcodeCol = headers.some(h => /leetcode/i.test(h));

    if (!hasRollNumber || !hasLeetcodeCol) {
      return res.status(400).json({
        error: 'Unrecognised column format',
        detail: `Found columns: ${headers.join(', ')}`,
        hint: 'File must have columns: Name, Roll Number, LeetCode Username',
        expected: 'Name | Roll Number | LeetCode Username',
      });
    }

    const accepted = [], rejected = [];

    for (const row of rows) {
      // Find roll number column (case-insensitive)
      const rollKey  = headers.find(h => /^roll.?number$/i.test(h));
      const lcKey    = headers.find(h => /leetcode/i.test(h));
      const nameKey  = headers.find(h => /^name$/i.test(h));

      const rollNo  = String(row[rollKey] || '').trim().toUpperCase();
      const username = String(row[lcKey] || '').trim();
      const name    = nameKey ? String(row[nameKey] || '').trim() : '';

      if (!rollNo || !isAllowedRegisterNo(rollNo)) {
        rejected.push({ row: rollNo || '(empty)', reason: 'Not in approved roster' });
        continue;
      }
      if (!username) {
        rejected.push({ row: rollNo, reason: 'Missing LeetCode Username' });
        continue;
      }

      const cleanUsername = username.replace(/\/+$/, '').split('/').pop();
      await LeetCode.findOneAndUpdate(
        { registerNo: rollNo },
        { $set: { rollNo, leetcodeUsername: cleanUsername, fetchStatus: 'pending', ...(name && { name }) } },
        { upsert: true }
      );
      accepted.push(rollNo);
    }

    // Auto-fetch in background
    if (accepted.length) {
      setImmediate(async () => {
        for (const registerNo of accepted) {
          try {
            const rec = await LeetCode.findOne({ registerNo });
            if (!rec?.leetcodeUsername) continue;
            const stats = await fetchLeetCodeStats(rec.leetcodeUsername);
            await LeetCode.findOneAndUpdate(
              { registerNo },
              { $set: { ...stats, fetchStatus: 'success', fetchError: null, lastFetchedAt: new Date() } }
            );
          } catch (e) {
            await LeetCode.findOneAndUpdate({ registerNo }, { $set: { fetchStatus: 'error', fetchError: e.message } });
          }
          await new Promise(r => setTimeout(r, 1500));
        }
      });
    }

    res.json({
      message: `Import complete: ${accepted.length} accepted, ${rejected.length} rejected. Stats fetching in background.`,
      accepted: accepted.length,
      rejected: rejected.length,
      rejectedRows: rejected,
    });
  } catch (err) {
    console.error('[leetcode] import:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getStudentLeetCode(req, res) {
  try {
    const registerNo = req.params.registerNo.toUpperCase();
    const record = await LeetCode.findOne({ registerNo }).lean();
    res.json(record || {});
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { listLeetCode, upsertLeetCode, refreshOne, refreshAll, importLeetCode, getStudentLeetCode };
