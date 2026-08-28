const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  patientDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true }
  },
  date: {
    type: String, // YYYY-MM-DD
    required: [true, 'Please select an appointment date']
  },
  timeSlot: {
    type: String, // HH:MM
    required: [true, 'Please select a time slot']
  },
  treatmentType: {
    type: String,
    required: [true, 'Please specify the treatment type']
  },
  symptoms: {
    type: String,
    default: ''
  },
  emergencyLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  preferredCommunication: {
    type: String,
    enum: ['email', 'phone', 'sms'],
    default: 'email'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  paymentDetails: {
    method: {
      type: String,
      enum: ['By Cash', 'By Card', 'Bank Transfer'],
      default: null
    },
    amount: {
      type: Number,
      default: 0
    }
  },
  doctorNotes: {
    type: String,
    default: ''
  },
  attachment: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Partial unique index: prevent double bookings on the same slot for the same doctor,
// EXCEPT when the booking status is 'cancelled'.
AppointmentSchema.index(
  { doctorId: 1, date: 1, timeSlot: 1 },
  { 
    unique: true, 
    partialFilterExpression: { status: { $ne: 'cancelled' } } 
  }
);

module.exports = mongoose.model('Appointment', AppointmentSchema);
