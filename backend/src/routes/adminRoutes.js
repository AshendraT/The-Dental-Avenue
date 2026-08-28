const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllAppointments,
  updateAppointmentStatus,
  getAllPatients,
  toggleBlockUser,
  addDoctor,
  updateDoctor,
  deleteDoctor,
  getInquiries,
  updateInquiryStatus,
  getAdminLogs,
  getPatientHistory,
  createPatient,
  createAppointmentForPatient
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateParamId } = require('../middleware/validationMiddleware');

// Enforce admin check on all routes
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/appointments', getAllAppointments);
router.put('/appointments/:id/status', validateParamId('id'), updateAppointmentStatus);
router.get('/patients', getAllPatients);
router.get('/patients/:id/history', validateParamId('id'), getPatientHistory);
router.put('/users/:id/block', validateParamId('id'), toggleBlockUser);
router.post('/doctors', addDoctor);
router.put('/doctors/:id', validateParamId('id'), updateDoctor);
router.delete('/doctors/:id', validateParamId('id'), deleteDoctor);
router.get('/inquiries', getInquiries);
router.put('/inquiries/:id', validateParamId('id'), updateInquiryStatus);
router.get('/logs', getAdminLogs);

// Walk-in Patient Registration and booking
router.post('/patients', createPatient);
router.post('/appointments', createAppointmentForPatient);

module.exports = router;
