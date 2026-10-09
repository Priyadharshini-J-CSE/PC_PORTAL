const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  roundName: { type: String, trim: true },
  roundType: { type: String, trim: true },
  questions: [{ type: String, trim: true }],
  experience: { type: String, trim: true },
}, { _id: false });

const interviewSchema = new mongoose.Schema(
  {
    registerNo: { type: String, required: true, uppercase: true, trim: true, index: true },
    companyName: { type: String, required: true, trim: true },
    jobRole: { type: String, trim: true },
    interviewDate: { type: String, trim: true },
    interviewMode: { type: String, trim: true },
    placementType: { type: String, trim: true },
    finalResult: {
      type: String,
      enum: ['Placed', 'Not Placed', 'Result Awaited'],
      default: 'Result Awaited',
    },
    rounds: [roundSchema],
    overallExperience: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InterviewExperience', interviewSchema);
