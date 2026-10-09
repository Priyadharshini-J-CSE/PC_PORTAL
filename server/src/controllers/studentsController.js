const StudentMaster = require('../models/StudentMaster');
const StudentProfile = require('../models/StudentProfile');
const { STUDENT_EDITABLE_FIELDS } = require('../models/StudentProfile');
const { isAllowedRegisterNo, ROSTER } = require('../config/roster');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// Column mapping: CSV header -> model field
const CSV_MAP = {
  'Roll No.': 'rollNo',
  'Name with Initial After Name': 'name',
  'Technical Skills Strength': 'technicalSkills',
  'Mobile No.': 'mobile',
  'Hostel/Day Scholar': 'hostelDay',
  'Year': 'year',
  'Register No.': 'registerNo',
  'Dept': 'dept',
  'Gender': 'gender',
  'DOB': 'dob',
  'IT/Core': 'itCore',
  'Transport': 'transport',
  '10th Percentage': 'tenth',
  '12th Percentage': 'twelfth',
  'Diploma Percentage': 'diploma',
  'CGPA out of 10': 'cgpa',
  'History of Arrears': 'arrearsHistory',
  'Standing Arrears': 'arrearsStanding',
  'Domain Mail ID': 'domainMail',
  'Personal Mail ID': 'personalMail',
  'Address': 'address',
};

async function listStudents(req, res) {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = {};
    if (search) {
      const re = new RegExp(search, 'i');
      query.$or = [{ name: re }, { registerNo: re }, { rollNo: re }];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [masters, total] = await Promise.all([
      StudentMaster.find(query).skip(skip).limit(Number(limit)).lean(),
      StudentMaster.countDocuments(query),
    ]);

    // Attach profile data
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
    // PC can update master fields
    const allowed = Object.values(CSV_MAP);
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

async function importStudents(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const text = req.file.buffer.toString('utf8');
    let records;
    try {
      records = parse(text, { columns: true, skip_empty_lines: true, trim: true });
    } catch {
      return res.status(400).json({ error: 'Invalid CSV format' });
    }

    const accepted = [], rejected = [];

    for (const row of records) {
      // Determine register number from row
      const rawReg = (row['Roll No.'] || row['Register No.'] || '').trim().toUpperCase();
      if (!rawReg || !isAllowedRegisterNo(rawReg)) {
        rejected.push({ row: rawReg || '(empty)', reason: 'Not in approved roster' });
        continue;
      }

      const update = {};
      for (const [csvCol, field] of Object.entries(CSV_MAP)) {
        if (row[csvCol] !== undefined) {
          const val = String(row[csvCol]).trim();
          if (field === 'cgpa' || field === 'arrearsHistory' || field === 'arrearsStanding') {
            const n = parseFloat(val);
            if (!isNaN(n)) update[field] = n;
          } else {
            update[field] = val;
          }
        }
      }
      update.registerNo = rawReg;

      await StudentMaster.findOneAndUpdate(
        { registerNo: rawReg },
        { $set: update },
        { upsert: true, runValidators: true }
      );
      accepted.push(rawReg);
    }

    res.json({
      message: `Import complete: ${accepted.length} accepted, ${rejected.length} rejected`,
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
    const profiles = await StudentProfile.find().lean();
    const profileMap = Object.fromEntries(profiles.map((p) => [p.registerNo, p]));

    const headers = [
      'Roll No.', 'Register No.', 'Name with Initial After Name', 'Technical Skills Strength',
      'Mobile No.', 'Hostel/Day Scholar', 'Year', 'Dept', 'Gender', 'DOB', 'IT/Core',
      'Transport', '10th Percentage', '12th Percentage', 'Diploma Percentage',
      'CGPA out of 10', 'History of Arrears', 'Standing Arrears',
      'Domain Mail ID', 'Personal Mail ID', 'Address',
      'Resume Link', 'Portfolio Link', '1-Min Video', 'Interested Domain',
    ];

    const rows = masters.map((m) => {
      const p = profileMap[m.registerNo] || {};
      return [
        m.rollNo, m.registerNo, m.name, m.technicalSkills, m.mobile, m.hostelDay,
        m.year, m.dept, m.gender, m.dob, m.itCore, m.transport,
        m.tenth, m.twelfth, m.diploma, m.cgpa, m.arrearsHistory, m.arrearsStanding,
        m.domainMail, m.personalMail, m.address,
        p.resumeLink, p.portfolioLink, p.videoLink, p.interestedDomain,
      ];
    });

    const csv = stringify([headers, ...rows]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
    res.send(csv);
  } catch (err) {
    console.error('[students] export:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

// Student updates own profile
async function updateMyProfile(req, res) {
  try {
    const registerNo = req.session.user.registerNo;
    const update = {};
    STUDENT_EDITABLE_FIELDS.forEach((f) => {
      if (req.body[f] !== undefined) update[f] = req.body[f];
    });

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
    const registerNo = req.session.user.registerNo;
    const [master, profile] = await Promise.all([
      StudentMaster.findOne({ registerNo }).lean(),
      StudentProfile.findOne({ registerNo }).lean(),
    ]);
    res.json({ master: master || {}, profile: profile || {} });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  listStudents, getStudent, updateStudent, importStudents, exportStudents,
  updateMyProfile, getMyProfile,
};
