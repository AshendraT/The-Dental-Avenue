const express = require('express');
const router = express.Router();
const {
  holdSlot,
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  rescheduleAppointment
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');
const { validateParamId } = require('../middleware/validationMiddleware');

router.post('/hold', protect, holdSlot);
router.post('/book', protect, bookAppointment);
router.get('/my-bookings', protect, getMyAppointments);
router.put('/:id/cancel', protect, validateParamId('id'), cancelAppointment);
router.put('/:id/reschedule', protect, validateParamId('id'), rescheduleAppointment);

module.exports = router;
