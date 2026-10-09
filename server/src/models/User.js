const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['student', 'pc', 'faculty'], required: true },
    // Students use registerNo; PC/Faculty use email
    registerNo: {
      type: String,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    email: {
      type: String,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Unique indexes
userSchema.index(
  { registerNo: 1 },
  { unique: true, sparse: true, partialFilterExpression: { registerNo: { $exists: true } } }
);
userSchema.index(
  { email: 1 },
  { unique: true, sparse: true, partialFilterExpression: { email: { $exists: true } } }
);

// Never return passwordHash by default
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
