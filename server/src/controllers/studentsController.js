const StudentMaster = require('../models/StudentMaster');
const StudentProfile = require('../models/StudentProfile');
const { STUDENT_EDITABLE_FIELDS } = require('../models/StudentProfile');
const { isAllowedRegisterNo, ROSTER } = require('../config/roster');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// Data1: roll number is the key identifier
const DATA1_MAP = {
  'NAME WITH INITIAL AFTER NAME': 'name',
  'ROLL NO': 'rollNo',
  'Technical skills strong': 'technicalSkills',
  'MOBILE NO': 'mobile',
  'Hostel/Dayscholar': 'hostelDay',
  'Placement': 'placement',
  'REGISTER NO.': 'universityRegNo',   // long number e.g. 722824104141
  'DEPT': 'dept',
  'GENDER': 'gender',
  'DOB': 'dob',
  'IT/Core (Eg. IT/EIoT/VLSI/CORE)': 'itCore',
  'Transport': 'transport',
  '10TH PERCENTAGE': 'tenth',
  '12TH PERCENTAGE': 'twelfth',
  'DIPLOMA PERCENTAGE': 'diploma',
  'CGPA OUT OF 10 (AS ON DATE)': 'cgpa',
  'HISTORY OF ARREARS': 'arrearsHistory',
  'STANDING ARREARS': 'arrearsStanding',
  'DOMAIN MAIL ID': 'domainMail',
  'PERSONAL MAIL ID': 'personalMail',
  'RESUME': 'resumeLink',
  '1 minute Video for Resume link': 'videoLink',
  'PORTFOLIO LINK': 'portfolioLink',
  'Interested Domain': 'interestedDomain',
  'Address': 'address',
};

// Data2: Register Number is the long university number (e.g. 722824104141)
const DATA2_MAP = {
  'Register Number': 'universityRegNo',  // stored for reference, lookup done separately
  'NAME WITH INITIAL AFTER NAME': 'name',
  'CGPA': 'cgpa',
  'No of Internal hackathon (participated)': 'internalHackParticipated',
  'No of Internal hackathon (Won)': 'internalHackWon',
  'No of External hackathon (participated)': 'externalHackParticipated',
  'No of External hackathon (Won)': 'externalHackWon',
  'No of External Online hackathon (participated)': 'externalOnlineHackParticipated',
  'No of External Online hackathon (Won)': 'externalOnlineHackWon',
  'External intern attended': 'externalInternAttended',
  'Professional certificate': 'certName',
  'Professional Certificate (drive link)': 'certLink',
};

const NUMERIC_FIELDS = new Set([
  'cgpa', 'arrearsHistory', 'arrearsStanding',
  'internalHackParticipated', 'internalHackWon',
  'externalHackParticipated', 'externalHackWon',
  'externalOnlineHackParticipated', 'externalOnlineHackWon',
]);

function detectFormat(headers) {
  if (headers.some(h => h === 'ROLL NO')) return 'data1';
  if (headers.some(h => h === 'Register Number')) return 'data2';
  return null;
}

// Legacy map kept for export
const CSV_MAP = DATA1_MAP;

async function listStudents(req, res) {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = { registerNo: { $regex: /^24CS\d+$/ } }; // only valid roster records
    if (search) {
      const re = new RegExp(search, 'i');
      query.$or = [{ name: re }, { registerNo: re }, { rollNo: re }, { universityRegNo: re }];
      delete query.registerNo; // allow search across all
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [masters, total] = await Promise.all([
      StudentMaster.find(query).sort({ registerNo: 1 }).skip(skip).limit(Number(limit)).lean(),
      StudentMaster.countDocuments(query),
    ]);
    const registerNos = masters.map((m) => m.registerNo);
    const profiles = await StudentProfile.find({ registerNo: { $in: registerNos } }).lean();
    const profileMap = Object.fromEntries(profiles.map((p) => [p.registerNo, p]));
    const students = masters.map((m) => ({ ...m, profile: profileMap[m.registerNo] || {} }));
    res.json({ students, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[students] list:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getStudent(req, res) {
  try {
    const registerNo = req.params.registerNo.toUpperCase();
    const [master, profile] = await Promise.all([
      StudentMaster.findOne({ registerNo }).lean(),
      StudentProfile.findOne({ registerNo }).lean(),
    ]);
    if (!master) return res.status(404).json({ error: 'Student not found' });
    res.json({ ...master, profile: profile || {} });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateStudent(req, res) {
  try {
    const registerNo = req.params.registerNo.toUpperCase();
    if (!isAllowedRegisterNo(registerNo)) {
      return res.status(400).json({ error: 'Register number not in approved roster' });
    }
    // PC can update all master fields from both data formats
    const allowed = new Set([...Object.values(DATA1_MAP), ...Object.values(DATA2_MAP)]);
    const update = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) update[f] = req.body[f]; });

    const master = await StudentMaster.findOneAndUpdate(
      { registerNo },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(master);
  } catch (err) {
    console.error('[students] update:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

function parseFileToRows(file) {
  const ext = file.originalname.split('.').pop().toLowerCase();
  if (ext === 'xlsx' || ext === 'xls') {
    const XLSX = require('xlsx');
    const wb = XLSX.read(file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    // header:1 gives array of arrays; we build objects manually to control key cleaning
    const raw = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
    return raw.map(row => {
      const clean = {};
      Object.entries(row).forEach(([k, v]) => { clean[k.replace(/^\uFEFF/, '').trim()] = String(v).trim(); });
      return clean;
    });
  }
  // CSV
  const text = file.buffer.toString('utf8').replace(/^\uFEFF/, '');
  const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true, bom: true });
  return rows.map(row => {
    const clean = {};
    Object.entries(row).forEach(([k, v]) => { clean[k.replace(/^\uFEFF/, '').trim()] = String(v).trim(); });
    return clean;
  });
}

async function importStudents(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    let records;
    try {
      records = parseFileToRows(req.file);
    } catch (parseErr) {
      return res.status(400).json({
        error: 'Could not read file',
        detail: parseErr.message,
        hint: 'Supported formats: .csv, .xlsx, .xls',
      });
    }

    if (records.length === 0) return res.status(400).json({ error: 'File is empty', hint: 'The file has no data rows.' });

    const headers = Object.keys(records[0]);
    const fmt = detectFormat(headers);
    if (!fmt) {
      return res.status(400).json({
        error: 'Unrecognised column format',
        detail: `Found columns: ${headers.slice(0, 6).join(', ')}${headers.length > 6 ? ` … (+${headers.length - 6} more)` : ''}`,
        hint: 'Data 1 must have a column named exactly "ROLL NO". Data 2 must have a column named exactly "Register Number".',
        expectedData1: 'ROLL NO, NAME WITH INITIAL AFTER NAME, REGISTER NO., CGPA OUT OF 10 (AS ON DATE), …',
        expectedData2: 'Register Number, NAME WITH INITIAL AFTER NAME, CGPA, No of Internal hackathon (participated), …',
      });
    }

    const colMap = fmt === 'data1' ? DATA1_MAP : DATA2_MAP;
    const accepted = [], rejected = [];

    for (const row of records) {
      let registerNo;
      if (fmt === 'data1') {
        // Data1: DB key is the roll number (24CS***)
        const rollNo = (row['ROLL NO'] || '').trim().toUpperCase();
        if (!isAllowedRegisterNo(rollNo)) {
          rejected.push({ row: rollNo || '(empty)', reason: 'Roll number not in approved roster (expected format: 24CS141)' });
          continue;
        }
        registerNo = rollNo;
      } else {
        // Data2: long university register number (e.g. 722824104141)
        // Find the matching student by universityRegNo field
        const univReg = (row['Register Number'] || '').trim().toUpperCase();
        if (!univReg) {
          rejected.push({ row: '(empty)', reason: 'Register Number is blank' });
          continue;
        }
        // Look up by universityRegNo stored from Data1 import
        const existing = await StudentMaster.findOne({ universityRegNo: univReg }).lean();
        if (existing) {
          registerNo = existing.registerNo;
        } else {
          // Fallback: extract last 3 digits → guess roll number (722824104141 → 141 → 24CS141)
          const suffix = univReg.replace(/\D/g, '').slice(-3);
          const guessRoll = `24CS${suffix}`;
          if (isAllowedRegisterNo(guessRoll)) {
            registerNo = guessRoll;
          } else {
            rejected.push({ row: univReg, reason: 'No matching student found. Import Data 1 first so register numbers are linked.' });
            continue;
          }
        }
      }

      const update = { registerNo };
      for (const [csvCol, field] of Object.entries(colMap)) {
        if (row[csvCol] === undefined || row[csvCol] === '') continue;
        const raw = String(row[csvCol]).trim();
        if (NUMERIC_FIELDS.has(field)) {
          const n = parseFloat(raw);
          if (!isNaN(n)) update[field] = n;
        } else {
          update[field] = raw;
        }
      }

      await StudentMaster.findOneAndUpdate(
        { registerNo },
        { $set: update },
        { upsert: true, runValidators: true }
      );
      accepted.push(registerNo);
    }

    res.json({
      message: `Import complete (${fmt}): ${accepted.length} accepted, ${rejected.length} rejected`,
      accepted: accepted.length,
      rejected: rejected.length,
      rejectedRows: rejected,
    });
  } catch (err) {
    console.error('[students] import:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

async function exportStudents(req, res) {
  try {
    const masters = await StudentMaster.find().lean();

    const headers = [
      'ROLL NO', 'REGISTER NO.', 'University Reg No.', 'NAME WITH INITIAL AFTER NAME', 'Technical skills strong',
      'MOBILE NO', 'Hostel/Dayscholar', 'Placement', 'DEPT', 'GENDER', 'DOB',
      'IT/Core (Eg. IT/EIoT/VLSI/CORE)', 'Transport',
      '10TH PERCENTAGE', '12TH PERCENTAGE', 'DIPLOMA PERCENTAGE',
      'CGPA OUT OF 10 (AS ON DATE)', 'HISTORY OF ARREARS', 'STANDING ARREARS',
      'DOMAIN MAIL ID', 'PERSONAL MAIL ID', 'RESUME',
      '1 minute Video for Resume link', 'PORTFOLIO LINK', 'Interested Domain', 'Address',
      'No of Internal hackathon (participated)', 'No of Internal hackathon (Won)',
      'No of External hackathon (participated)', 'No of External hackathon (Won)',
      'No of External Online hackathon (participated)', 'No of External Online hackathon (Won)',
      'External intern attended', 'Professional certificate', 'Professional Certificate (drive link)',
    ];

    const rows = masters.map((m) => [
      m.rollNo, m.registerNo, m.universityRegNo, m.name, m.technicalSkills, m.mobile, m.hostelDay,
      m.placement, m.dept, m.gender, m.dob, m.itCore, m.transport,
      m.tenth, m.twelfth, m.diploma, m.cgpa, m.arrearsHistory, m.arrearsStanding,
      m.domainMail, m.personalMail, m.resumeLink, m.videoLink, m.portfolioLink,
      m.interestedDomain, m.address,
      m.internalHackParticipated, m.internalHackWon,
      m.externalHackParticipated, m.externalHackWon,
      m.externalOnlineHackParticipated, m.externalOnlineHackWon,
      m.externalInternAttended, m.certName, m.certLink,
    ]);

    const csv = stringify([headers, ...rows]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
    res.send(csv);
  } catch (err) {
    console.error('[students] export:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateMyProfile(req, res) {
  try {
    const registerNo = req.session.user.registerNo;
    const update = {};
    STUDENT_EDITABLE_FIELDS.forEach((f) => {
      if (req.body[f] !== undefined) update[f] = req.body[f];
    });
    // interns is an array — replace entirely
    if (Array.isArray(req.body.interns)) update.interns = req.body.interns;

    const profile = await StudentProfile.findOneAndUpdate(
      { registerNo },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(profile);
  } catch (err) {
    console.error('[profile] update:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getMyProfile(req, res) {
  try {
    const registerNo = req.session.user.registerNo; // e.g. 24CS141
    // Try exact match first, then fallback to rollNo field
    let master = await StudentMaster.findOne({ registerNo }).lean();
    if (!master) master = await StudentMaster.findOne({ rollNo: registerNo }).lean();
    const profile = await StudentProfile.findOne({ registerNo }).lean();
    res.json({ master: master || {}, profile: profile || {} });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  listStudents, getStudent, updateStudent, importStudents, exportStudents,
  updateMyProfile, getMyProfile,
};
