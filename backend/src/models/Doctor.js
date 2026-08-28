const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add the doctor\'s name'],
    trim: true
  },
  qualification: {
    type: String,
    required: [true, 'Please add qualification details'],
    trim: true
  },
  experience: {
    type: Number,
    required: [true, 'Please add experience in years'],
    min: [0, 'Experience cannot be negative']
  },
  availability: {
    type: Map,
    of: {
      type: [String],
      default: []
    },
    default: {
      monday: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'],
      tuesday: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'],
      wednesday: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'],
      thursday: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'],
      friday: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'],
      saturday: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'],
      sunday: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30']
    }
  },
  unavailableDates: {
    type: [String], // YYYY-MM-DD format
    default: []
  },
  profileImage: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: 'Experienced dental specialist dedicated to providing gentle and premium oral healthcare.'
  },
  services: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Doctor', DoctorSchema);
