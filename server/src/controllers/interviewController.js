const InterviewExperience = require('../models/InterviewExperience');
const StudentMaster = require('../models/StudentMaster');

async function listAll(req, res) {
  try {
    const { company, result, page = 1, limit = 50 } = req.query;
    const query = {};
    if (company) query.companyName = new RegExp(company, 'i');
    if (result) query.finalResult = result;

    const skip = (Number(page) - 1) * Number(limit);
    const [records, total] = await Promise.all([
      InterviewExperience.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      InterviewExperience.countDocuments(query),
    ]);

    const registerNos = [...new Set(records.map((r) => r.registerNo))];
    const masters = await StudentMaster.find({ registerNo: { $in: registerNos } }).lean();
    const nameMap = Object.fromEntries(masters.map((m) => [m.registerNo, m.name]));

    const data = records.map((r) => ({ ...r, studentName: nameMap[r.registerNo] || r.registerNo }));
    res.json({ records: data, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function getMine(req, res) {
  try {
    const registerNo = req.session.user.registerNo;
    const records = await InterviewExperience.find({ registerNo }).sort({ createdAt: -1 }).lean();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function getOne(req, res) {
  try {
    const record = await InterviewExperience.findById(req.params.id).lean();
    if (!record) return res.status(404).json({ error: 'Not found' });

    // Students can only see their own
    if (req.session.user.role === 'student' && record.registerNo !== req.session.user.registerNo) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function create(req, res) {
  try {
    // Always use session registerNo — never trust frontend
    const registerNo = req.session.user.registerNo;
    const { companyName, jobRole, interviewDate, interviewMode, placementType, finalResult, rounds, overallExperience } = req.body;

    if (!companyName) return res.status(400).json({ error: 'Company name is required' });

    const record = await InterviewExperience.create({
      registerNo,
      companyName,
      jobRole,
      interviewDate,
      interviewMode,
      placementType,
      finalResult,
      rounds: (rounds || []).map((r) => ({
        roundName: r.roundName,
        roundType: r.roundType,
        questions: (r.questions || []).filter((q) => q.trim()),
        experience: r.experience,
      })),
      overallExperience,
    });
    res.status(201).json(record);
  } catch (err) {
    console.error('[interviews] create:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteOne(req, res) {
  try {
    const record = await InterviewExperience.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Not found' });

    // Only the owning student can delete
    if (record.registerNo !== req.session.user.registerNo) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await record.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { listAll, getMine, getOne, create, deleteOne };
