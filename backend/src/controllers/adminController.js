const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const ContactMessage = require('../models/ContactMessage');
const AdminLog = require('../models/AdminLog');
const Notification = require('../models/Notification');
const {
  sendAppointmentConfirmation,
  sendAppointmentCancellation,
  sendAppointmentCompleted
} = require('../utils/emailService');
const CLINIC_EMAIL = process.env.INITIAL_ADMIN_EMAIL || 'thedentalavenue.lk@gmail.com';
const { isValidDate, isValidTimeSlot, isValidObjectId, isValidEmail, isValidPhone, isValidAge, isValidDob } = require('../utils/validators');

// Helper to log admin actions
const logAdminAction = async (adminId, action, details, ip) => {
  try {
    await AdminLog.create({
      adminId,
      action,
      details,
      ipAddress: ip || 'unknown'
    });
  } catch (err) {
    console.error('Failed to write admin log:', err.message);
  }
};

// @desc    Get dashboard metrics & stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const { localDate } = req.query;
    const todayStr = localDate || new Date().toISOString().split('T')[0];

    const totalAppointments = await Appointment.countDocuments();
    const totalPatients = await User.countDocuments({ role: 'patient', isVerified: true });
    const totalDoctors = await Doctor.countDocuments();
    
    // Get upcoming bookings (today onwards)
    const upcomingBookings = await Appointment.countDocuments({
      date: { $gte: todayStr },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Count today's appointments
    const todayAppointmentsCount = await Appointment.countDocuments({ date: todayStr });

    // Fetch today's appointments with details
    const todayAppointments = await Appointment.find({ date: todayStr })
      .populate('doctorId', 'name')
      .populate('patientId', 'name email phone')
      .sort({ timeSlot: 1 });

    // Recent 5 appointments
    const recentAppointments = await Appointment.find({})
      .populate('doctorId', 'name')
      .populate('patientId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent 5 inquiries
    const recentInquiries = await ContactMessage.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    // Appointment status split
    const statusSplit = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const formattedStatus = {
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0
    };
    statusSplit.forEach(item => {
      switch (item._id) {
        case 'pending':
          formattedStatus.pending = item.count;
          break;
        case 'confirmed':
          formattedStatus.confirmed = item.count;
          break;
        case 'cancelled':
          formattedStatus.cancelled = item.count;
          break;
        case 'completed':
          formattedStatus.completed = item.count;
          break;
        default:
          break;
      }
    });

    // Treatment popularity split
    const treatmentSplit = await Appointment.aggregate([
      { $group: { _id: '$treatmentType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Simulated monthly booking analytics (past 6 months)
    const monthlyAnalytics = [
      { month: 'Jan', appointments: 15 },
      { month: 'Feb', appointments: 28 },
      { month: 'Mar', appointments: 42 },
      { month: 'Apr', appointments: 56 },
      { month: 'May', appointments: totalAppointments }
    ];

    // Fetch upcoming appointments for the next 7 days (both confirmed and pending)
    const parts = todayStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const tomorrow = new Date(year, month, day + 1);
    const sevenDaysLater = new Date(year, month, day + 7);
    
    const getFormattedDate = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayVal = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dayVal}`;
    };
    
    const tomorrowStr = getFormattedDate(tomorrow);
    const endLimitStr = getFormattedDate(sevenDaysLater);

    const upcomingAppointments = await Appointment.find({
      date: { $gte: tomorrowStr, $lte: endLimitStr },
      status: { $in: ['pending', 'confirmed'] }
    })
      .populate('doctorId', 'name')
      .populate('patientId', 'name email phone')
      .sort({ date: 1, timeSlot: 1 });

    res.status(200).json({
      success: true,
      stats: {
        totalAppointments,
        totalPatients,
        totalDoctors,
        upcomingBookings,
        todayAppointmentsCount
      },
      todayAppointments,
      upcomingAppointments,
      recentAppointments,
      recentInquiries,
      statusSplit: formattedStatus,
      treatmentSplit,
      monthlyAnalytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all appointments (paginated & filtered)
// @route   GET /api/admin/appointments
// @access  Private (Admin)
exports.getAllAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', doctor = '', date = '' } = req.query;

    const query = {};

    if (status) {
      if (status === 'upcoming') {
        query.status = { $in: ['pending', 'confirmed'] };
        if (!date) {
          const todayStr = new Date().toISOString().split('T')[0];
          query.date = { $gte: todayStr };
        }
      } else {
        query.status = status;
      }
    }

    if (date) {
      query.date = date;
    }

    if (doctor) {
      query.doctorId = new mongoose.Types.ObjectId(doctor);
    }

    // Search by patient name in details snapshot
    if (search) {
      query['patientDetails.name'] = { $regex: search, $options: 'i' };
    }

    const count = await Appointment.countDocuments(query);
    
    // Sort logic using aggregation
    const appointments = await Appointment.aggregate([
      { $match: query },
      {
        $addFields: {
          statusPriority: {
            $cond: {
              if: { $in: ['$status', ['pending', 'confirmed']] },
              then: 1,
              else: 2
            }
          }
        }
      },
      { $sort: { statusPriority: 1, date: -1, timeSlot: -1 } },
      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) }
    ]);

    // Populate fields on aggregate output documents
    const populatedAppointments = await Appointment.populate(appointments, [
      { path: 'doctorId', select: 'name' },
      { path: 'patientId', select: 'name email phone' }
    ]);

    res.status(200).json({
      success: true,
      count,
      pages: Math.ceil(count / limit),
      currentPage: Number(page),
      appointments: populatedAppointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update appointment status (approve/reject/complete)
// @route   PUT /api/admin/appointments/:id/status
// @access  Private (Admin)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate('doctorId', 'name')
      .populate('patientId', 'name email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const oldStatus = appointment.status;
    appointment.status = status;

    if (status === 'completed') {
      const { paymentMethod, paymentAmount, doctorNotes, attachment } = req.body;
      
      if (paymentMethod && !['By Cash', 'By Card', 'Bank Transfer'].includes(paymentMethod)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment method. Allowed values: By Cash, By Card, Bank Transfer'
        });
      }

      if (paymentAmount !== undefined && (isNaN(Number(paymentAmount)) || Number(paymentAmount) < 0)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid non-negative payment amount'
        });
      }

      if (attachment) {
        // Estimate Base64 size
        const stringLength = attachment.replace(/=/g, '').length;
        const sizeInBytes = Math.floor(stringLength * 0.75);
        if (sizeInBytes > 2 * 1024 * 1024) {
          return res.status(400).json({
            success: false,
            message: 'Attachment size must be less than 2MB'
          });
        }
      }

      appointment.paymentDetails = {
        method: paymentMethod || 'By Cash',
        amount: Number(paymentAmount) || 0
      };
      appointment.doctorNotes = doctorNotes || '';
      appointment.attachment = attachment || '';
    }

    await appointment.save();

    // Log admin action
    await logAdminAction(
      req.user.id,
      'UPDATE_APPOINTMENT_STATUS',
      `Changed appointment ${appointment._id} status from ${oldStatus} to ${status}`,
      req.ip
    );

    // Create Notification for user
    await Notification.create({
      recipient: appointment.patientId._id,
      title: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your appointment with ${appointment.doctorId.name} on ${appointment.date} at ${appointment.timeSlot} is now ${status}.`,
      type: status === 'cancelled' ? 'cancellation' : 'booking'
    });

    // Send status update email to both patient and clinic
    try {
      const emailDetails = {
        id: appointment._id,
        doctorName: appointment.doctorId.name,
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        treatmentType: appointment.treatmentType,
        paymentMethod: appointment.paymentDetails?.method || 'N/A',
        paymentAmount: appointment.paymentDetails?.amount || 0,
        doctorNotes: appointment.doctorNotes || '',
        reason: appointment.cancellationReason || 'Cancelled by clinic administrator',
        attachment: appointment.attachment || ''
      };

      if (status === 'confirmed') {
        await sendAppointmentConfirmation(appointment.patientDetails.email, appointment.patientDetails.name, emailDetails);
        await sendAppointmentConfirmation(CLINIC_EMAIL, `Clinic Admin (Patient: ${appointment.patientDetails.name} - Confirmed)`, emailDetails);
      } else if (status === 'cancelled') {
        await sendAppointmentCancellation(appointment.patientDetails.email, appointment.patientDetails.name, emailDetails);
        await sendAppointmentCancellation(CLINIC_EMAIL, `Clinic Admin (Patient: ${appointment.patientDetails.name} - Cancelled)`, emailDetails);
      } else if (status === 'completed') {
        await sendAppointmentCompleted(appointment.patientDetails.email, appointment.patientDetails.name, emailDetails);
        await sendAppointmentCompleted(CLINIC_EMAIL, `Clinic Admin (Patient: ${appointment.patientDetails.name} - Completed)`, emailDetails);
      }
    } catch (emailErr) {
      console.error('Failed to send status update email notifications:', emailErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}`,
      appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all patients
// @route   GET /api/admin/patients
// @access  Private (Admin)
exports.getAllPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const query = { role: 'patient', isVerified: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { nicId: { $regex: search, $options: 'i' } }
      ];
    }

    const count = await User.countDocuments(query);
    const patients = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count,
      pages: Math.ceil(count / limit),
      currentPage: Number(page),
      patients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Toggle block/unblock user
// @route   PUT /api/admin/users/:id/block
// @access  Private (Admin)
exports.toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot block an administrator account'
      });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    // Log admin action
    await logAdminAction(
      req.user.id,
      user.isBlocked ? 'BLOCK_USER' : 'UNBLOCK_USER',
      `Toggled block status for user ${user._id} (${user.email}) to ${user.isBlocked}`,
      req.ip
    );

    res.status(200).json({
      success: true,
      message: `User is now ${user.isBlocked ? 'blocked' : 'unblocked'}`,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add a doctor
// @route   POST /api/admin/doctors
// @access  Private (Admin)
exports.addDoctor = async (req, res) => {
  try {
    const { name, qualification, experience, availability, services, bio, profileImage } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid doctor name'
      });
    }

    if (!qualification || typeof qualification !== 'string' || !qualification.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid qualification details'
      });
    }

    if (experience === undefined || isNaN(Number(experience)) || Number(experience) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid non-negative number for experience'
      });
    }

    const doctor = await Doctor.create({
      name: name.trim(),
      qualification: qualification.trim(),
      experience: Number(experience),
      availability,
      services: services || [],
      bio,
      profileImage: profileImage || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400&h=400'
    });

    // Log admin action
    await logAdminAction(
      req.user.id,
      'ADD_DOCTOR',
      `Created doctor ${doctor._id} - ${doctor.name}`,
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Doctor added successfully',
      doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update doctor details
// @route   PUT /api/admin/doctors/:id
// @access  Private (Admin)
exports.updateDoctor = async (req, res) => {
  try {
    const { name, qualification, experience, availability, services, unavailableDates, bio, profileImage } = req.body;

    if (experience !== undefined && (isNaN(Number(experience)) || Number(experience) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid non-negative number for experience'
      });
    }

    if (unavailableDates !== undefined) {
      if (!Array.isArray(unavailableDates) || !unavailableDates.every(isValidDate)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide unavailableDates as an array of valid YYYY-MM-DD date strings'
        });
      }
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (name) doctor.name = name.trim();
    if (qualification) doctor.qualification = qualification.trim();
    if (experience !== undefined) doctor.experience = Number(experience);
    if (availability) doctor.availability = availability;
    if (services) doctor.services = services;
    if (unavailableDates) doctor.unavailableDates = unavailableDates;
    if (bio) doctor.bio = bio;
    if (profileImage) doctor.profileImage = profileImage;

    await doctor.save();

    // Log admin action
    await logAdminAction(
      req.user.id,
      'UPDATE_DOCTOR',
      `Updated doctor ${doctor._id} - ${doctor.name}`,
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove a doctor
// @route   DELETE /api/admin/doctors/:id
// @access  Private (Admin)
exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    await Doctor.deleteOne({ _id: req.params.id });

    // Log admin action
    await logAdminAction(
      req.user.id,
      'DELETE_DOCTOR',
      `Deleted doctor ${req.params.id} - ${doctor.name}`,
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Doctor removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all inquiries (contact submissions)
// @route   GET /api/admin/inquiries
// @access  Private (Admin)
exports.getInquiries = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const count = await ContactMessage.countDocuments();
    const inquiries = await ContactMessage.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count,
      pages: Math.ceil(count / limit),
      currentPage: Number(page),
      inquiries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update inquiry status
// @route   PUT /api/admin/inquiries/:id
// @access  Private (Admin)
exports.updateInquiryStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'read' or 'replied'

    if (!['read', 'replied'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inquiry status'
      });
    }

    const inquiry = await ContactMessage.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry message not found'
      });
    }

    inquiry.status = status;
    await inquiry.save();

    res.status(200).json({
      success: true,
      message: `Inquiry status updated to ${status}`,
      inquiry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get system audit logs
// @route   GET /api/admin/logs
// @access  Private (Admin)
exports.getAdminLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const count = await AdminLog.countDocuments();
    const logs = await AdminLog.find({})
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count,
      pages: Math.ceil(count / limit),
      currentPage: Number(page),
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get patient history & stats
// @route   GET /api/admin/patients/:id/history
// @access  Private (Admin)
exports.getPatientHistory = async (req, res) => {
  try {
    const patientId = req.params.id;

    // Verify patient exists
    const patient = await User.findById(patientId).select('-password');
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get all appointments
    const appointments = await Appointment.find({ patientId })
      .populate('doctorId', 'name qualification')
      .sort({ date: -1, timeSlot: -1 });

    // Calculate stats
    const stats = {
      total: appointments.length,
      completed: appointments.filter(app => app.status === 'completed').length,
      cancelled: appointments.filter(app => app.status === 'cancelled').length,
      confirmed: appointments.filter(app => app.status === 'confirmed').length,
      pending: appointments.filter(app => app.status === 'pending').length
    };

    res.status(200).json({
      success: true,
      patient,
      stats,
      appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Register a walk-in patient manually
// @route   POST /api/admin/patients
// @access  Private (Admin)
exports.createPatient = async (req, res) => {
  try {
    const { name, email, phone, nicId, address, dob, gender, medicalNotes, password } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid patient name'
      });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid patient email address'
      });
    }

    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid patient phone number'
      });
    }

    if (dob && !isValidDob(dob)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid date of birth (must be in the past)'
      });
    }

    if (gender && !['', 'male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid gender value (male, female, other)'
      });
    }

    // Check if email already exists
    const userExists = await User.findOne({ email: email.trim().toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists'
      });
    }

    // Password strength check (at least 6 characters, uppercase, lowercase, number)
    const pass = password || 'Avenue@2026';
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{6,}$/;
    if (!passwordRegex.test(pass)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters and contain at least one uppercase letter, one lowercase letter, and one number'
      });
    }

    const patient = await User.create({
      name,
      email,
      phone: phone || '',
      nicId: nicId || '',
      address: address || '',
      dob: dob ? new Date(dob) : undefined,
      gender: gender || '',
      medicalNotes: medicalNotes || '',
      password: pass,
      role: 'patient',
      isVerified: true
    });

    // Log admin action
    await logAdminAction(
      req.user.id,
      'CREATE_PATIENT',
      `Manually registered walk-in patient ${patient._id} (${patient.email})`,
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      patient: {
        _id: patient._id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        nicId: patient.nicId,
        address: patient.address,
        dob: patient.dob,
        gender: patient.gender,
        medicalNotes: patient.medicalNotes,
        isVerified: patient.isVerified,
        isBlocked: patient.isBlocked,
        createdAt: patient.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Book an appointment for a patient (Admin-created, confirmed by default)
// @route   POST /api/admin/appointments
// @access  Private (Admin)
exports.createAppointmentForPatient = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      date,
      timeSlot,
      treatmentType,
      symptoms,
      emergencyLevel,
      preferredCommunication,
      patientAge
    } = req.body;

    if (!patientId || !doctorId || !date || !timeSlot || !treatmentType || patientAge === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking fields'
      });
    }

    if (!isValidObjectId(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Patient ID'
      });
    }

    if (!isValidObjectId(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Doctor ID'
      });
    }

    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid date in YYYY-MM-DD format'
      });
    }

    if (!isValidTimeSlot(timeSlot)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid time slot in HH:MM format'
      });
    }

    if (typeof treatmentType !== 'string' || !treatmentType.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid treatment type'
      });
    }

    if (!isValidAge(patientAge)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid patient age'
      });
    }

    if (emergencyLevel && !['low', 'medium', 'high'].includes(emergencyLevel)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid emergency level value'
      });
    }

    if (preferredCommunication && !['email', 'phone', 'sms'].includes(preferredCommunication)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid preferred communication method'
      });
    }

    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Double check if slot is already booked (excluding cancelled status)
    const booked = await Appointment.findOne({
      doctorId,
      date,
      timeSlot,
      status: { $ne: 'cancelled' }
    });

    if (booked) {
      return res.status(409).json({
        success: false,
        message: 'This slot is already booked and unavailable'
      });
    }

    const patientDetails = {
      name: patient.name,
      email: patient.email,
      phone: patient.phone || 'N/A',
      age: Number(patientAge),
      gender: patient.gender || 'other'
    };

    // Create the appointment, automatically confirmed since admin is creating it
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      patientDetails,
      date,
      timeSlot,
      treatmentType,
      symptoms: symptoms || '',
      emergencyLevel: emergencyLevel || 'low',
      preferredCommunication: preferredCommunication || 'email',
      status: 'confirmed'
    });

    // Create Notification for the patient
    await Notification.create({
      recipient: patientId,
      title: 'Appointment Booked by Clinic',
      message: `An appointment with ${doctor.name} on ${date} at ${timeSlot} has been booked for you by the clinic administrator.`,
      type: 'booking'
    });

    // Log admin action
    await logAdminAction(
      req.user.id,
      'CREATE_APPOINTMENT',
      `Booked appointment ${appointment._id} for patient ${patient.name} (${patient.email}) with ${doctor.name}`,
      req.ip
    );

    // Send confirmation email
    try {
      const emailDetails = {
        id: appointment._id,
        doctorName: doctor.name,
        date,
        timeSlot,
        treatmentType
      };
      await sendAppointmentConfirmation(patient.email, patient.name, emailDetails);
      await sendAppointmentConfirmation(CLINIC_EMAIL, `Clinic Admin (Admin Booked for Patient: ${patient.name})`, emailDetails);
    } catch (emailErr) {
      console.error('Failed to send admin-created booking confirmation email:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
