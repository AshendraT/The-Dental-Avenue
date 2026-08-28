const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const SlotHold = require('../models/SlotHold');
const { isValidDate } = require('../utils/validators');

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

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
exports.getDoctors = async (req, res) => {
  try {
    const filter = {};
    if (req.query.service) {
      filter.services = req.query.service;
    }
    const doctors = await Doctor.find(filter);
    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get doctor by ID
// @route   GET /api/doctors/:id
// @access  Public
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    res.status(200).json({
      success: true,
      doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get doctor availability status for a specific date
// @route   GET /api/doctors/:id/availability
// @access  Public
exports.getDoctorAvailability = async (req, res) => {
  try {
    const { date } = req.query; // Expecting YYYY-MM-DD
    if (!date || !isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid date query parameter in YYYY-MM-DD format'
      });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // 1. Check if doctor is unavailable on this date
    if (doctor.unavailableDates.includes(date)) {
      return res.status(200).json({
        success: true,
        slots: [] // Doctor is completely off today
      });
    }

    // 2. Get weekday availability
    const weekday = getWeekdayName(date);

    // Prevent querying availability for past dates
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (date < todayStr) {
      return res.status(200).json({
        success: true,
        slots: [] // Past dates have no availability
      });
    }

    const rawSlots = doctor.availability.get(weekday) || [];
    let doctorSlots = rawSlots.filter(slot => isSlotAllowed(weekday, slot));

    // Filter out slots that have already passed if the date is today
    if (date === todayStr) {
      const currentHours = String(today.getHours()).padStart(2, '0');
      const currentMinutes = String(today.getMinutes()).padStart(2, '0');
      const currentHHMM = `${currentHours}:${currentMinutes}`;
      doctorSlots = doctorSlots.filter(slot => slot > currentHHMM);
    }

    if (doctorSlots.length === 0) {
      return res.status(200).json({
        success: true,
        slots: [] // Doctor has no hours on this day
      });
    }

    // 3. Fetch active appointments for this doctor on this date
    const bookedAppointments = await Appointment.find({
      doctorId: doctor._id,
      date,
      status: { $ne: 'cancelled' }
    });

    const bookedSlots = bookedAppointments.map(app => app.timeSlot);

    // Prune expired slot holds proactively so they do not block availability
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    await SlotHold.deleteMany({ createdAt: { $lt: fiveMinutesAgo } });

    // 4. Fetch active slot holds
    const activeHolds = await SlotHold.find({
      doctorId: doctor._id,
      date
    });

    const heldSlotsMap = {};
    activeHolds.forEach(hold => {
      heldSlotsMap[hold.timeSlot] = hold.heldBy.toString();
    });

    // 5. Build final slot list with status
    const slots = doctorSlots.map(timeSlot => {
      let status = 'green'; // Available
      let heldBy = null;

      if (bookedSlots.includes(timeSlot)) {
        status = 'red'; // Booked
      } else if (heldSlotsMap[timeSlot]) {
        status = 'yellow'; // Hold / In Progress
        heldBy = heldSlotsMap[timeSlot];
      }

      return {
        timeSlot,
        status,
        heldBy
      };
    });

    res.status(200).json({
      success: true,
      date,
      weekday,
      slots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
