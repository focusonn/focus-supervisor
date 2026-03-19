const mongoose = require('mongoose');

const ekonomiSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  bakiye: { type: Number, default: 0 },
  lastDaily: { type: Date, default: null },
  lastCF: { type: Date, default: null },
  lastSlot: { type: Date, default: null },
});

module.exports = mongoose.model('Ekonomi', ekonomiSchema);
