const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    registerNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    resumeLink: { type: String, trim: true },
    portfolioLink: { type: String, trim: true },
    videoLink: { type: String, trim: true },
    interestedDomain: { type: String, trim: true },
    cgpa: { type: Number, min: 0, max: 10 },
    internalHackParticipated: { type: Number, default: 0, min: 0 },
    internalHackWon: { type: Number, default: 0, min: 0 },
    externalHackParticipated: { type: Number, default: 0, min: 0 },
    externalHackWon: { type: Number, default: 0, min: 0 },
    externalOnlineHackParticipated: { type: Number, default: 0, min: 0 },
    externalOnlineHackWon: { type: Number, default: 0, min: 0 },
    externalInternAttended: { type: String, enum: ['Yes', 'No', ''], default: '' },
    internPlace: { type: String, trim: true },
    internMode: { type: String, trim: true },
    internStipend: { type: String, trim: true },
    internOther: { type: String, trim: true },
    certName: { type: String, trim: true },
    certLink: { type: String, trim: true },
  },
  { timestamps: true }
);

// Explicit allowlist of fields a student may update
const STUDENT_EDITABLE_FIELDS = [
  'resumeLink', 'portfolioLink', 'videoLink', 'interestedDomain', 'cgpa',
  'internalHackParticipated', 'internalHackWon',
  'externalHackParticipated', 'externalHackWon',
  'externalOnlineHackParticipated', 'externalOnlineHackWon',
  'externalInternAttended', 'internPlace', 'internMode', 'internStipend', 'internOther',
  'certName', 'certLink',
];

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
module.exports.STUDENT_EDITABLE_FIELDS = STUDENT_EDITABLE_FIELDS;
