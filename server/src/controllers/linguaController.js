const LinguaSkills = require('../models/LinguaSkills');
const StudentMaster = require('../models/StudentMaster');
const { isAllowedRegisterNo } = require('../config/roster');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

async function list(req, res) {
  try {
    const { search } = req.query;
    const query = {};
    if (search) {
      const re = new RegExp(search, 'i');
      query.$or = [{ studentName: re }, { registerNo: re }];
    }
    const records = await LinguaSkills.find(query).lean();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function getOne(req, res) {
  try {
    const registerNo = req.params.registerNo.toUpperCase();
    // Students can only see their own
    if (req.session.user.role === 'student' && req.session.user.registerNo !== registerNo) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const record = await LinguaSkills.findOne({ registerNo }).lean();
    res.json(record || {});
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function upsert(req, res) {
  try {
    const registerNo = String(req.body.registerNo || '').trim().toUpperCase();
    if (!registerNo || !isAllowedRegisterNo(registerNo)) {
      return res.status(400).json({ error: 'Invalid register number' });
    }

    const master = await StudentMaster.findOne({ registerNo }).lean();
    const { paid, amount, examStatus, slot, result } = req.body;

    const record = await LinguaSkills.findOneAndUpdate(
      { registerNo },
      { $set: { studentName: master?.name || registerNo, paid, amount, examStatus, slot, result } },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(record);
  } catch (err) {
    console.error('[lingua] upsert:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

async function importLingua(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    let rows;
    const ext = req.file.originalname.split('.').pop().toLowerCase();

    if (ext === 'csv') {
      rows = parse(req.file.buffer.toString('utf8'), { columns: true, skip_empty_lines: true, trim: true });
    } else {
      const XLSX = require('xlsx');
      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    }

    const accepted = [], rejected = [];
    for (const row of rows) {
      const registerNo = String(row['Roll No.'] || '').trim().toUpperCase();
      if (!registerNo || !isAllowedRegisterNo(registerNo)) {
        rejected.push({ row: registerNo || '(empty)', reason: 'Not in approved roster' });
        continue;
      }

      const isPaid = /^(yes|y|paid|true|1)$/i.test(String(row['Paid?'] || '').trim());
      const isDone = /^(completed?|yes|done|attended|true|1)$/i.test(String(row['Exam Status'] || '').trim());

      await LinguaSkills.findOneAndUpdate(
        { registerNo },
        {
          $set: {
            studentName: String(row['Student Name'] || '').trim() || registerNo,
            paid: isPaid ? 'Yes' : 'No',
            amount: parseFloat(row['Amount']) || 0,
            examStatus: isDone ? 'Completed' : 'Pending',
            slot: String(row['Slot'] || '').trim(),
            result: String(row['Result'] || '').trim(),
          },
        },
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
    console.error('[lingua] import:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

async function exportLingua(req, res) {
  try {
    const records = await LinguaSkills.find().lean();
    const headers = ['Student Name', 'Roll No.', 'Paid?', 'Amount', 'Exam Status', 'Slot', 'Result'];
    const rows = records.map((r) => [r.studentName, r.registerNo, r.paid, r.amount, r.examStatus, r.slot, r.result]);
    const csv = stringify([headers, ...rows]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="lingua.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { list, getOne, upsert, importLingua, exportLingua };
