const Appointment = require('../models/Appointment');
const SlotHold = require('../models/SlotHold');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const { sendAppointmentConfirmation, sendAppointmentCancellation } = require('../utils/emailService');
const CLINIC_EMAIL = process.env.INITIAL_ADMIN_EMAIL || 'thedentalavenue.lk@gmail.com';
const { isValidDate, isValidTimeSlot, isValidObjectId, isValidEmail, isValidPhone, isValidAge } = require('../utils/validators');

// Helper to determine weekday name
const getWeekdayName = (dateString) => {
  const date = new Date(dateString);
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

// Helper to validate if slot is within booking windows
const isSlotAllowed = (weekday, timeSlot) => {
  const isWeekend = weekday === 'saturday' || weekday === 'sunday';
  if (isWeekend) {
    // 9 AM to 7:30 PM (09:00 to 19:30)
    return timeSlot >= '09:00' && timeSlot <= '19:30';
  } else {
    // Monday to Friday: 4 PM to 7:30 PM (16:00 to 19:30)
    return timeSlot >= '16:00' && timeSlot <= '19:30';
  }
};

// Helper to check if patient profile is complete
const checkProfileComplete = (user) => {
  if (!user || user.role !== 'patient') return true;
  return !!(
    user.name && user.name.trim() &&
    user.phone && user.phone.trim() &&
    user.nicId && user.nicId.trim() &&
    user.dob &&
    user.gender && user.gender.trim()
  );
};

// @desc    Hold a slot temporarily (5 minutes)
// @route   POST /api/appointments/hold
// @access  Private (Patient)
exports.holdSlot = async (req, res) => {
  try {
    if (!checkProfileComplete(req.user)) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your Patient Profile (Full Name, Phone Number, NIC/ID/Passport, Date of Birth, Gender) before booking appointments.'
      });
    }

    const { doctorId, date, timeSlot } = req.body;

    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Please provide doctorId, date, and timeSlot'
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

    const weekday = getWeekdayName(date);
    if (!isSlotAllowed(weekday, timeSlot)) {
      return res.status(400).json({
        success: false,
        message: 'Booking is not allowed at this time. Monday-Friday booking hours are 4pm-7:30pm, and Saturday-Sunday are 9am-7:30pm.'
      });
    }

    // Prevent holding slots in the past
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (date < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book or hold a slot in the past.'
      });
    }

    if (date === todayStr) {
      const currentHours = String(today.getHours()).padStart(2, '0');
      const currentMinutes = String(today.getMinutes()).padStart(2, '0');
      const currentHHMM = `${currentHours}:${currentMinutes}`;
      if (timeSlot <= currentHHMM) {
        return res.status(400).json({
          success: false,
          message: 'Cannot book or hold a slot in the past.'
        });
      }
    }

    // Prune expired slot holds proactively
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    await SlotHold.deleteMany({ createdAt: { $lt: fiveMinutesAgo } });

    // 1. Check if the slot is already booked
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

    // 2. Attempt to create a slot hold
    // By using SlotHold.create, the database compound unique index enforces that 
    // only ONE hold can exist for (doctorId, date, timeSlot) simultaneously.
    try {
      // First check if there is already an existing hold by the same user to renew it
      let hold = await SlotHold.findOne({ doctorId, date, timeSlot, heldBy: req.user.id });
      if (hold) {
        hold.createdAt = new Date(); // Reset the 5-min TTL timer
        await hold.save();
      } else {
        hold = await SlotHold.create({
          doctorId,
          date,
          timeSlot,
          heldBy: req.user.id
        });
      }

      res.status(201).json({
        success: true,
        message: 'Slot held successfully for 5 minutes',
        hold
      });
    } catch (err) {
      // Duplicate key error code (11000) means someone else is holding it
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Another patient is currently holding this slot. Please choose another time.'
        });
      }
      throw err;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Book an appointment (commits the hold)
// @route   POST /api/appointments/book
// @access  Private (Patient)
exports.bookAppointment = async (req, res) => {
  try {
    if (!checkProfileComplete(req.user)) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your Patient Profile (Full Name, Phone Number, NIC/ID/Passport, Date of Birth, Gender) before booking appointments.'
      });
    }

    const {
      doctorId,
      date,
      timeSlot,
      patientDetails,
      treatmentType,
      symptoms,
      emergencyLevel,
      preferredCommunication
    } = req.body;

    if (!doctorId || !date || !timeSlot || !patientDetails || !treatmentType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking fields'
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

    // Validate patientDetails object and nested fields
    if (typeof patientDetails !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Patient details must be a valid object'
      });
    }

    const { name, email, phone, age, gender } = patientDetails;
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

    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid patient phone number'
      });
    }

    if (!isValidAge(age)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid patient age'
      });
    }

    if (!gender || !['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid gender (male, female, other)'
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

    const weekday = getWeekdayName(date);
    if (!isSlotAllowed(weekday, timeSlot)) {
      return res.status(400).json({
        success: false,
        message: 'Booking is not allowed at this time. Monday-Friday booking hours are 4pm-7:30pm, and Saturday-Sunday are 9am-7:30pm.'
      });
    }

    // Prevent booking slots in the past
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (date < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book or hold a slot in the past.'
      });
    }

    if (date === todayStr) {
      const currentHours = String(today.getHours()).padStart(2, '0');
      const currentMinutes = String(today.getMinutes()).padStart(2, '0');
      const currentHHMM = `${currentHours}:${currentMinutes}`;
      if (timeSlot <= currentHHMM) {
        return res.status(400).json({
          success: false,
          message: 'Cannot book or hold a slot in the past.'
        });
      }
    }

    // Double-check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Create the appointment.
    // Mongoose partial unique index { doctorId, date, timeSlot } will prevent race conditions 
    // if two requests try to book at the exact same split-second.
    try {
      const appointment = await Appointment.create({
        patientId: req.user.id,
        doctorId,
        patientDetails,
        date,
        timeSlot,
        treatmentType,
        symptoms,
        emergencyLevel,
        preferredCommunication,
        status: 'pending' // Initial status is pending, approved by admin
      });

      // Clear the temporary hold if it exists
      await SlotHold.deleteOne({ doctorId, date, timeSlot, heldBy: req.user.id });

      // Create Patient Notification
      await Notification.create({
        recipient: req.user.id,
        title: 'Appointment Booked',
        message: `Your appointment with ${doctor.name} on ${date} at ${timeSlot} is pending approval.`,
        type: 'booking'
      });

      // Create Admin Notification
      await Notification.create({
        recipient: null, // admin broadcast
        title: 'New Appointment Booked',
        message: `Patient ${patientDetails.name} booked ${doctor.name} for ${date} at ${timeSlot}.`,
        type: 'booking'
      });

      // Trigger Email Confirmation
      try {
        // Send to patient
        await sendAppointmentConfirmation(patientDetails.email, patientDetails.name, {
          id: appointment._id,
          doctorName: doctor.name,
          date,
          timeSlot,
          treatmentType
        });
        // Send to clinic
        await sendAppointmentConfirmation(CLINIC_EMAIL, `Clinic Admin (Patient: ${patientDetails.name})`, {
          id: appointment._id,
          doctorName: doctor.name,
          date,
          timeSlot,
          treatmentType
        });
      } catch (emailErr) {
        console.error('Failed to send booking confirmation emails:', emailErr.message);
      }

      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully and is pending clinic confirmation!',
        appointment
      });
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Double-booking prevention: This slot was booked by another user. Please select a different slot.'
        });
      }
      throw dbErr;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's appointments
// @route   GET /api/appointments/my-bookings
// @access  Private (Patient)
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user.id })
      .populate('doctorId', 'name qualification profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private (Patient/Admin)
exports.cancelAppointment = async (req, res) => {
  try {
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findById(req.params.id).populate('doctorId', 'name');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify ownership (or Admin)
    if (appointment.patientId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this appointment'
      });
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = cancellationReason || 'Cancelled by patient';
    await appointment.save();

    // Create Notification
    await Notification.create({
      recipient: appointment.patientId,
      title: 'Appointment Cancelled',
      message: `Your appointment with ${appointment.doctorId.name} on ${appointment.date} was cancelled.`,
      type: 'cancellation'
    });

    // Notify Admin
    await Notification.create({
      recipient: null,
      title: 'Appointment Cancelled By Patient',
      message: `Appointment for ${appointment.patientDetails.name} with ${appointment.doctorId.name} was cancelled.`,
      type: 'cancellation'
    });

     // Send Cancellation Email
    try {
      // Send to patient
      await sendAppointmentCancellation(appointment.patientDetails.email, appointment.patientDetails.name, {
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        reason: appointment.cancellationReason
      });
      // Send to clinic
      await sendAppointmentCancellation(CLINIC_EMAIL, `Clinic Admin (Patient: ${appointment.patientDetails.name})`, {
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        reason: appointment.cancellationReason
      });
    } catch (emailErr) {
      console.error('Failed to send cancellation emails:', emailErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reschedule appointment
// @route   PUT /api/appointments/:id/reschedule
// @access  Private (Patient/Admin)
exports.rescheduleAppointment = async (req, res) => {
  try {
    if (!checkProfileComplete(req.user)) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your Patient Profile (Full Name, Phone Number, NIC/ID/Passport, Date of Birth, Gender) before booking appointments.'
      });
    }

    const { date, timeSlot } = req.body;

    if (!date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Please provide new date and timeSlot'
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

    const weekday = getWeekdayName(date);
    if (!isSlotAllowed(weekday, timeSlot)) {
      return res.status(400).json({
        success: false,
        message: 'Booking is not allowed at this time. Monday-Friday booking hours are 4pm-7:30pm, and Saturday-Sunday are 9am-7:30pm.'
      });
    }

    // Prevent rescheduling to slots in the past
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (date < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule to a slot in the past.'
      });
    }

    if (date === todayStr) {
      const currentHours = String(today.getHours()).padStart(2, '0');
      const currentMinutes = String(today.getMinutes()).padStart(2, '0');
      const currentHHMM = `${currentHours}:${currentMinutes}`;
      if (timeSlot <= currentHHMM) {
        return res.status(400).json({
          success: false,
          message: 'Cannot reschedule to a slot in the past.'
        });
      }
    }

    const appointment = await Appointment.findById(req.params.id).populate('doctorId', 'name');
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify ownership (or Admin)
    if (appointment.patientId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reschedule this appointment'
      });
    }

    // Double check that the new slot is not already booked
    const booked = await Appointment.findOne({
      doctorId: appointment.doctorId._id,
      date,
      timeSlot,
      status: { $ne: 'cancelled' },
      _id: { $ne: appointment._id } // exclude self
    });

    if (booked) {
      return res.status(409).json({
        success: false,
        message: 'The selected date and time slot is already booked'
      });
    }

    // Update appointment
    appointment.date = date;
    appointment.timeSlot = timeSlot;
    appointment.status = 'pending'; // Reset status to pending so admin re-confirms
    await appointment.save();

    // Clear the temporary hold if it exists
    await SlotHold.deleteOne({ doctorId: appointment.doctorId._id, date, timeSlot });

    // Create Notification
    await Notification.create({
      recipient: appointment.patientId,
      title: 'Appointment Rescheduled',
      message: `Your appointment with ${appointment.doctorId.name} was rescheduled to ${date} at ${timeSlot} (pending approval).`,
      type: 'booking'
    });

    // Notify Admin
    await Notification.create({
      recipient: null,
      title: 'Appointment Rescheduled By Patient',
      message: `${appointment.patientDetails.name} rescheduled appointment with ${appointment.doctorId.name} to ${date} at ${timeSlot}.`,
      type: 'booking'
    });

    // Send updated confirmation email
    try {
      // Send to patient
      await sendAppointmentConfirmation(appointment.patientDetails.email, appointment.patientDetails.name, {
        id: appointment._id,
        doctorName: appointment.doctorId.name,
        date,
        timeSlot,
        treatmentType: appointment.treatmentType
      });
      // Send to clinic
      await sendAppointmentConfirmation(CLINIC_EMAIL, `Clinic Admin (Patient: ${appointment.patientDetails.name} - Reschedule)`, {
        id: appointment._id,
        doctorName: appointment.doctorId.name,
        date,
        timeSlot,
        treatmentType: appointment.treatmentType
      });
    } catch (emailErr) {
      console.error('Failed to send reschedule emails:', emailErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully and is pending confirmation!',
      appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
