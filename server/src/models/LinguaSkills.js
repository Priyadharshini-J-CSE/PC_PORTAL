const mongoose = require('mongoose');

const linguaSchema = new mongoose.Schema(
  {
    registerNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    studentName: { type: String, trim: true },
    paid: { type: String, enum: ['Yes', 'No'], default: 'No' },
    amount: { type: Number, default: 0 },
    examStatus: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
    slot: { type: String, trim: true },
    result: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LinguaSkills', linguaSchema);
