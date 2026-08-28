const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ],
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: false,
    minlength: 8,
    select: false
  },
  role: {
    type: String,
    enum: ['patient', 'admin'],
    default: 'patient'
  },
  patientId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  phone: {
    type: String,
    default: ''
  },
  nicId: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  dob: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['', 'male', 'female', 'other'],
    default: ''
  },
  medicalNotes: {
    type: String,
    default: ''
  },
  emergencyContact: {
    name: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  isGoogleUser: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  verificationCode: String,
  verificationCodeExpire: Date,
  verificationCodeLastSent: Date,
  loginAttempts: {
    type: Number,
    required: true,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true
});

// Auto-generate patientId (DC00001, DC00002...) and Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (this.role === 'patient' && !this.patientId) {
    try {
      const lastPatient = await this.constructor.findOne({
        role: 'patient',
        patientId: { $regex: /^DC\d+$/ }
      }).sort({ patientId: -1, createdAt: -1, _id: -1 }).select('patientId');

      let nextNum = 1;
      if (lastPatient && lastPatient.patientId) {
        const match = lastPatient.patientId.match(/DC(\d+)/);
        if (match && match[1]) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }
      this.patientId = `DC${String(nextNum).padStart(5, '0')}`;
    } catch (err) {
      console.error('Error generating patientId:', err);
    }
  }

  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
