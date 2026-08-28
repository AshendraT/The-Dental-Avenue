const express = require('express');
const router = express.Router();
const {
  getDoctors,
  getDoctorById,
  getDoctorAvailability
} = require('../controllers/doctorController');
const { validateParamId } = require('../middleware/validationMiddleware');

router.get('/', getDoctors);
router.get('/:id', validateParamId('id'), getDoctorById);
router.get('/:id/availability', validateParamId('id'), getDoctorAvailability);

module.exports = router;
