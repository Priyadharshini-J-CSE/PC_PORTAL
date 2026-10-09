const StudentMaster = require('../models/StudentMaster');
const StudentProfile = require('../models/StudentProfile');
const LeetCode = require('../models/LeetCode');
const InterviewExperience = require('../models/InterviewExperience');
const LinguaSkills = require('../models/LinguaSkills');

async function pcAnalytics(req, res) {
  try {
    const [totalStudents, lcCount, profileCount, ivCount, linguaRecords] = await Promise.all([
      StudentMaster.countDocuments(),
      LeetCode.countDocuments({ leetcodeUsername: { $exists: true, $ne: '' } }),
      StudentProfile.countDocuments(),
      InterviewExperience.countDocuments(),
      LinguaSkills.find().lean(),
    ]);

    const profiles = await StudentProfile.find().lean();
    const withResume = profiles.filter((p) => p.resumeLink).length;
    const withPortfolio = profiles.filter((p) => p.portfolioLink).length;
    const withVideo = profiles.filter((p) => p.videoLink).length;

    const paid = linguaRecords.filter((r) => r.paid === 'Yes').length;
    const completed = linguaRecords.filter((r) => r.examStatus === 'Completed').length;
    const paidNotDone = linguaRecords.filter((r) => r.paid === 'Yes' && r.examStatus !== 'Completed').length;

    const recentIv = await InterviewExperience.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      totalStudents, lcCount, withResume, withPortfolio, withVideo,
      ivCount, linguaPaid: paid, linguaCompleted: completed, linguaPaidNotDone: paidNotDone,
      recentInterviews: recentIv,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function facultyAnalytics(req, res) {
  try {
    const masters = await StudentMaster.find().lean();
    const cgpas = masters.map((m) => m.cgpa).filter((c) => c > 0);
    const avgCgpa = cgpas.length ? (cgpas.reduce((a, b) => a + b, 0) / cgpas.length).toFixed(2) : null;
    const withArrears = masters.filter((m) => m.arrearsStanding > 0).length;

    const topCgpa = [...masters]
      .filter((m) => m.cgpa > 0)
      .sort((a, b) => b.cgpa - a.cgpa)
      .slice(0, 5)
      .map((m) => ({ name: m.name, registerNo: m.registerNo, cgpa: m.cgpa }));

    const topLc = await LeetCode.find({ totalSolved: { $gt: 0 } })
      .sort({ totalSolved: -1 })
      .limit(5)
      .lean();

    const lcRegNos = topLc.map((r) => r.registerNo);
    const lcMasters = await StudentMaster.find({ registerNo: { $in: lcRegNos } }).lean();
    const lcNameMap = Object.fromEntries(lcMasters.map((m) => [m.registerNo, m.name]));
    const topLcWithNames = topLc.map((r) => ({ ...r, studentName: lcNameMap[r.registerNo] || r.registerNo }));

    const profiles = await StudentProfile.find().lean();
    const domainCounts = {};
    profiles.forEach((p) => {
      if (p.interestedDomain) domainCounts[p.interestedDomain] = (domainCounts[p.interestedDomain] || 0) + 1;
    });

    const interviews = await InterviewExperience.find().lean();
    const companyCounts = {};
    interviews.forEach((iv) => {
      companyCounts[iv.companyName] = (companyCounts[iv.companyName] || 0) + 1;
    });
    const placed = new Set(interviews.filter((iv) => iv.finalResult === 'Placed').map((iv) => iv.registerNo)).size;

    res.json({ avgCgpa, withArrears, topCgpa, topLc: topLcWithNames, domainCounts, companyCounts, placed });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function studentAnalytics(req, res) {
  try {
    const registerNo = req.session.user.registerNo;
    const [master, profile, lc, lingua, ivCount] = await Promise.all([
      StudentMaster.findOne({ registerNo }).lean(),
      StudentProfile.findOne({ registerNo }).lean(),
      LeetCode.findOne({ registerNo }).lean(),
      LinguaSkills.findOne({ registerNo }).lean(),
      InterviewExperience.countDocuments({ registerNo }),
    ]);
    res.json({ master: master || {}, profile: profile || {}, lc: lc || {}, lingua: lingua || {}, ivCount });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { pcAnalytics, facultyAnalytics, studentAnalytics };
