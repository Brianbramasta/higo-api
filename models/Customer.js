const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  Number: Number,
  'Name of Location': String,
  Date: String,
  'Login Hour': String,
  Name: String,
  Age: Number,
  gender: String,
  Email: String,
  'No Telp': String,
  'Brand Device': String,
  'Digital Interest': String,
  'Location Type': String
}, {
  timestamps: true
});

// Add indexes for frequently queried fields
customerSchema.index({ gender: 1 });
customerSchema.index({ 'Location Type': 1 });
customerSchema.index({ 'Digital Interest': 1 });

module.exports = mongoose.model('Customer', customerSchema);
