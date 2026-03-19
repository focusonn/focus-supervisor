const mongoose = require('mongoose');

const kayitSchema = new mongoose.Schema({
  tip:       { type: String },
  puan:      { type: Number },
  moderator: { type: String },
  reason:    { type: String },
  tarih:     { type: Date, default: Date.now },
}, { _id: false });

const cezaPuanSchema = new mongoose.Schema({
  guildId:      { type: String, required: true },
  userId:       { type: String, required: true },
  puan:         { type: Number, default: 0 },
  kayitlar:     { type: [kayitSchema], default: [] },
  tetiklenenler:{ type: [String], default: [] },
});

cezaPuanSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('CezaPuan', cezaPuanSchema);
