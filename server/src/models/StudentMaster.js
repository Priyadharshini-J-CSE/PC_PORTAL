const mongoose = require('mongoose');

const studentMasterSchema = new mongoose.Schema(
  {
    registerNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    rollNo: { type: String, trim: true },
    name: { type: String, trim: true },
    technicalSkills: { type: String, trim: true },
    mobile: { type: String, trim: true },
    hostelDay: { type: String, trim: true },
    year: { type: String, trim: true },
    dept: { type: String, default: 'CSE', trim: true },
    gender: { type: String, trim: true },
    dob: { type: String, trim: true },
    itCore: { type: String, trim: true },
    transport: { type: String, trim: true },
    tenth: { type: String, trim: true },
    twelfth: { type: String, trim: true },
    diploma: { type: String, trim: true },
    cgpa: { type: Number, min: 0, max: 10 },
    arrearsHistory: { type: Number, default: 0 },
    arrearsStanding: { type: Number, default: 0 },
    domainMail: { type: String, trim: true },
    personalMail: { type: String, trim: true },
    address: { type: String, trim: true },
  },
  { timestamps: true }
);

studentMasterSchema.index({ name: 'text', registerNo: 'text' });

module.exports = mongoose.model('StudentMaster', studentMasterSchema);
