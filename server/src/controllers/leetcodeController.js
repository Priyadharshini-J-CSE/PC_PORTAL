const LeetCode = require('../models/LeetCode');
const StudentMaster = require('../models/StudentMaster');
const { isAllowedRegisterNo } = require('../config/roster');
const { fetchLeetCodeStats } = require('../services/leetcodeService');
const { parse } = require('csv-parse/sync');

async function listLeetCode(req, res) {
  try {
    const records = await LeetCode.find().lean();
    const registerNos = records.map((r) => r.registerNo);
    const masters = await StudentMaster.find({ registerNo: { $in: registerNos } }).lean();
    const nameMap = Object.fromEntries(masters.map((m) => [m.registerNo, m.name]));
    const data = records.map((r) => ({ ...r, studentName: nameMap[r.registerNo] || r.registerNo }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function upsertLeetCode(req, res) {
  try {
    const registerNo = String(req.body.registerNo || '').trim().toUpperCase();
    const username = String(req.body.leetcodeUsername || '').trim();

    if (!registerNo || !username) {
      return res.status(400).json({ error: 'registerNo and leetcodeUsername are required' });
    }
    if (!isAllowedRegisterNo(registerNo)) {
      return res.status(400).json({ error: 'Register number not in approved roster' });
    }

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
    if (!record || !record.leetcodeUsername) {
      return res.status(404).json({ error: 'No LeetCode username set for this student' });
    }

    try {
      const stats = await fetchLeetCodeStats(record.leetcodeUsername);
      Object.assign(record, stats, { fetchStatus: 'success', fetchError: null, lastFetchedAt: new Date() });
    } catch (fetchErr) {
      record.fetchStatus = 'error';
      record.fetchError = fetchErr.message;
      // Preserve last known good data — do not clear stats
    }
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function importLeetCode(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    let rows;
    const ext = req.file.originalname.split('.').pop().toLowerCase();

    if (ext === 'csv') {
      rows = parse(req.file.buffer.toString('utf8'), { columns: true, skip_empty_lines: true, trim: true });
    } else {
      // xlsx support
      const XLSX = require('xlsx');
      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    }

    const accepted = [], rejected = [];
    for (const row of rows) {
      const registerNo = String(row['Roll No.'] || row['Register No.'] || '').trim().toUpperCase();
      const username = String(row['LeetCode ID'] || row['LeetCode Username'] || '').trim();

      if (!registerNo || !isAllowedRegisterNo(registerNo)) {
        rejected.push({ row: registerNo || '(empty)', reason: 'Not in approved roster' });
        continue;
      }
      if (!username) {
        rejected.push({ row: registerNo, reason: 'Missing LeetCode ID' });
        continue;
      }

      await LeetCode.findOneAndUpdate(
        { registerNo },
        { $set: { leetcodeUsername: username.replace(/\/+$/, '').split('/').pop(), fetchStatus: 'pending' } },
        { upsert: true }
      );
      accepted.push(registerNo);
    }

    res.json({
      message: `Import complete: ${accepted.length} accepted, ${rejected.length} rejected`,
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

module.exports = { listLeetCode, upsertLeetCode, refreshOne, importLeetCode, getStudentLeetCode };
