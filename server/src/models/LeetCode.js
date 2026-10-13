const mongoose = require('mongoose');

const leetcodeSchema = new mongoose.Schema(
  {
    registerNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    rollNo: { type: String, trim: true },
    name: { type: String, trim: true },
    leetcodeUsername: { type: String, trim: true },
    globalRank: { type: Number },
    contestRating: { type: Number },
    contestsAttended: { type: Number },
    totalSolved: { type: Number },
    easySolved: { type: Number },
    mediumSolved: { type: Number },
    hardSolved: { type: Number },
    lastFetchedAt: { type: Date },
    fetchStatus: { type: String, enum: ['pending', 'success', 'error', 'never'], default: 'never' },
    fetchError: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LeetCode', leetcodeSchema);
