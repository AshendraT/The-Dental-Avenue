import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Calendar, User, KeyRound, Download, RefreshCw, XCircle, AlertCircle, Save, CheckCircle, Info } from 'lucide-react';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import Loader from '../components/common/Loader';
import { useNavigate, useLocation } from 'react-router-dom';

const PatientDashboard = () => {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.activeTab || 'appointments';
  });
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Forms
  const { register: registerProfile, handleSubmit: handleSubmitProfile, reset: resetProfile, formState: { errors: errorsProfile, isSubmitting: isSubmittingProfile } } = useForm();
  const { register: registerPassword, handleSubmit: handleSubmitPassword, reset: resetPassword, formState: { errors: errorsPassword, isSubmitting: isSubmittingPassword } } = useForm();

  const fetchBookings = async () => {
    try {
      const res = await api.get('/appointments/my-bookings');
      if (res.success) {
        setAppointments(res.appointments);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load booking history', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    // Autofill profile form
    if (user) {
      const formattedDob = user.dob ? new Date(user.dob).toISOString().split('T')[0] : '';
      resetProfile({
        name: user.name,
        phone: user.phone,
        nicId: user.nicId,
        address: user.address,
        dob: formattedDob,
        gender: user.gender || '',
        medicalNotes: user.medicalNotes,
        emergencyContactName: user.emergencyContact?.name || '',
        emergencyContactPhone: user.emergencyContact?.phone || ''
      });
    }
  }, [user, resetProfile]);

  const onProfileSubmit = async (data) => {
    try {
      const res = await updateProfile(data);
      if (res.success) {
        addToast('Your medical profile has been updated successfully!', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Failed to update profile.', 'error');
    }
  };

  const onPasswordSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      addToast('Confirm password does not match.', 'warning');
      return;
    }

    try {
      const res = await api.put('/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      if (res.success) {
        addToast('Password updated successfully!', 'success');
        resetPassword();
      }
    } catch (err) {
      addToast(err.message || 'Failed to change password.', 'error');
    }
  };

  const handleCancelClick = (appId) => {
    setSelectedAppId(appId);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancelReason.trim()) {
      addToast('Please enter a cancellation reason', 'warning');
      return;
    }

    setIsCancelling(true);
    try {
      const res = await api.put(`/appointments/${selectedAppId}/cancel`, {
        cancellationReason: cancelReason
      });
      if (res.success) {
        addToast('Appointment cancelled successfully.', 'success');
        setCancelModalOpen(false);
        // Refresh bookings
        fetchBookings();
      }
    } catch (err) {
      addToast(err.message || 'Failed to cancel appointment', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRescheduleClick = (app) => {
    // Redirect to book appointment page and pass rescheduling details in state
    navigate('/book', {
      state: {
        rescheduleAppId: app._id,
        preSelectedDoctorId: app.doctorId._id,
        preSelectedTreatment: app.treatmentType
      }
    });
  };

  const downloadReceipt = (app) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formattedDob = user?.dob ? new Date(user.dob).toLocaleDateString() : 'N/A';

    printWindow.document.write(`
      <html>
        <head>
          <title>Appointment Receipt - The Dental Avenue</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
            
            * {
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Outfit', 'Helvetica Neue', sans-serif; 
              color: #1e293b; 
              margin: 25px; 
              line-height: 1.5; 
              font-size: 13px;
              background-color: #ffffff;
            }
            
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #0ea5e9;
              padding-bottom: 12px;
              margin-bottom: 18px;
            }
            
            .header-left {
              display: flex;
              flex-direction: column;
            }
            
            .header-logo {
              height: 55px;
              width: auto;
              object-fit: contain;
            }
            
            .clinic-sub {
              font-size: 9px;
              color: #64748b;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-top: 4px;
            }
            
            .header-right {
              text-align: right;
            }
            
            .receipt-badge {
              background-color: #e0f2fe;
              color: #0369a1;
              font-size: 10px;
              font-weight: 700;
              padding: 4px 10px;
              border-radius: 9999px;
              display: inline-block;
              margin-bottom: 6px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .meta-item {
              font-size: 11px;
              margin-bottom: 2px;
            }
            
            .meta-label {
              color: #64748b;
              font-weight: 500;
            }
            
            .meta-val {
              font-weight: 600;
              color: #0f172a;
            }
            
            .receipt-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 15px;
            }
            
            .info-card {
              border: 1px solid #e2e8f0;
              background: #f8fafc;
              padding: 12px 15px;
              border-radius: 8px;
            }
            
            .bg-symptoms {
              background-color: #fffbeb;
              border-color: #fef3c7;
            }
            
            .bg-payment {
              background-color: #f0fdfa;
              border-color: #ccfbf1;
            }
            
            .group-title {
              font-weight: 700;
              font-size: 10px;
              text-transform: uppercase;
              color: #0369a1;
              border-bottom: 1.5px solid #bae6fd;
              padding-bottom: 4px;
              margin-bottom: 8px;
              letter-spacing: 0.5px;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              border-bottom: 1px dashed #e2e8f0;
              padding: 5px 0;
            }
            
            .info-row:last-child {
              border-bottom: none;
            }
            
            .info-label {
              color: #64748b;
              font-weight: 500;
            }
            
            .info-value {
              color: #0f172a;
              font-weight: 600;
              text-align: right;
            }
            
            .highlight-blue {
              color: #0ea5e9;
            }
            
            .highlight-teal {
              color: #0d9488;
            }
            
            .symptoms-text {
              font-size: 12px;
              color: #b45309;
              font-style: italic;
            }
            
            .payment-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            
            .payment-col .field {
              font-size: 10px;
              text-transform: uppercase;
              color: #64748b;
              font-weight: 600;
              margin-bottom: 2px;
            }
            
            .payment-col .value {
              font-size: 13px;
            }
            
            .notes {
              border-left: 3px solid #14b8a6;
              padding-left: 12px;
              background: #f0fdfa;
              padding-top: 8px;
              padding-bottom: 8px;
              border-radius: 0 6px 6px 0;
              margin-top: 15px;
            }
            
            .notes-title {
              font-weight: 700;
              font-size: 10px;
              color: #0d9488;
              margin-bottom: 3px;
              text-transform: uppercase;
            }
            
            .footer {
              border-top: 1px solid #f1f5f9;
              padding-top: 8px;
              margin-top: 20px;
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              line-height: 1.4;
            }
            
            @media print {
              body {
                margin: 10px;
                font-size: 11px;
                line-height: 1.3;
              }
              .header-logo {
                height: 38px;
              }
              .header-container {
                margin-bottom: 8px;
                padding-bottom: 6px;
              }
              .receipt-grid {
                margin-bottom: 8px;
                gap: 10px;
              }
              .info-card {
                padding: 6px 10px;
                margin-top: 8px !important;
                page-break-inside: avoid;
              }
              .notes {
                margin-top: 8px !important;
                padding: 6px 10px;
                page-break-inside: avoid;
              }
              .footer {
                margin-top: 10px;
                font-size: 8px;
                page-break-inside: avoid;
              }
              #attachment-container {
                margin-top: 8px !important;
              }
              #val-attachment {
                max-height: 200px !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="header-left">
              <img src="/logo.png" alt="Logo" class="header-logo" />
              <div class="clinic-sub">Premium Professional Healthcare</div>
            </div>
            <div class="header-right">
              <div class="receipt-badge">Booking Confirmation</div>
              <div class="meta-item">
                <span class="meta-label">Appointment ID:</span>
                <span class="meta-val" id="val-appid"></span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Date Issued:</span>
                <span class="meta-val">${new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div class="receipt-grid">
            <div class="info-card">
              <div class="group-title">Patient Profile</div>
              <div class="info-row">
                <span class="info-label">Full Name</span>
                <span class="info-value" id="val-pname"></span>
              </div>
              <div class="info-row">
                <span class="info-label">Email Address</span>
                <span class="info-value" id="val-pemail"></span>
              </div>
              <div class="info-row">
                <span class="info-label">Phone Number</span>
                <span class="info-value" id="val-pphone"></span>
              </div>
              <div class="info-row">
                <span class="info-label">NIC / ID Card</span>
                <span class="info-value" id="val-pnic"></span>
              </div>
              <div class="info-row">
                <span class="info-label">Date of Birth</span>
                <span class="info-value" id="val-pdob"></span>
              </div>
            </div>
            
            <div class="info-card">
              <div class="group-title">Booking Details</div>
              <div class="info-row">
                <span class="info-label">Clinic Doctor</span>
                <span class="info-value" id="val-docname"></span>
              </div>
              <div class="info-row">
                <span class="info-label">Date Scheduled</span>
                <span class="info-value highlight-blue" id="val-date"></span>
              </div>
              <div class="info-row">
                <span class="info-label">Scheduled Time</span>
                <span class="info-value highlight-blue" id="val-time"></span>
              </div>
              <div class="info-row">
                <span class="info-label">Treatment Ordered</span>
                <span class="info-value highlight-teal" id="val-treatment"></span>
              </div>
            </div>
          </div>
          
          <div id="symptoms-container" style="display: none;" class="info-card bg-symptoms">
            <div class="group-title" style="color: #b45309; border-bottom-color: #fde68a;">Symptoms Reported</div>
            <div class="symptoms-text" id="val-symptoms"></div>
          </div>
          
          <div id="payment-container" style="display: none; margin-top: 15px;" class="info-card bg-payment">
            <div class="group-title" style="color: #0d9488; border-bottom-color: #ccfbf1;">Payment Details</div>
            <div class="payment-grid">
              <div class="payment-col">
                <div class="field" style="margin-top: 0;">Payment Method</div>
                <div class="value" style="font-weight: 700; color: #0f172a; margin-bottom: 0;" id="val-paymethod"></div>
              </div>
              <div class="payment-col">
                <div class="field" style="margin-top: 0;">Amount Paid</div>
                <div class="value" style="font-weight: bold; color: #0d9488; font-size: 15px; margin-bottom: 0;" id="val-payamount"></div>
              </div>
            </div>
          </div>

          <div id="doctor-notes-container" style="display: none; margin-top: 15px;" class="info-card bg-payment">
            <div class="group-title" style="color: #0d9488; border-bottom-color: #ccfbf1;">Doctor's Notes & Prescriptions</div>
            <div class="symptoms-text" style="color: #0f172a; white-space: pre-line; font-style: normal;" id="val-doctornotes"></div>
          </div>

          <div id="attachment-container" style="display: none; margin-top: 10px;" class="info-card">
            <div class="group-title" style="color: #0ea5e9; border-bottom-color: #bae6fd;">Attached Medical Image / X-Ray</div>
            <div style="text-align: center; margin-top: 8px;">
              <img id="val-attachment" src="" style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 6px; border: 1px solid #e2e8f0;" />
            </div>
          </div>
 
          <div class="notes">
            <div class="notes-title">Clinical Preparation Instructions</div>
            <p style="margin: 0; font-size: 11px; color: #374151;">Please arrive 15 minutes early. Bring this copy, along with any current dental records or x-rays from past clinics. Cancellations or changes are managed on the dashboard up to 24 hours prior.</p>
          </div>
          
          <div class="footer">
            # 54, Jaffna Road (New Bus Stand), Vavuniya, Sri Lanka | +94 76 727 0222, +94 71 712 2736, +94 24 222 3637 | thedentalavenue.lk@gmail.com
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
 
    const doc = printWindow.document;
    doc.getElementById('val-pname').textContent = app.patientDetails.name || '';
    doc.getElementById('val-pemail').textContent = app.patientDetails.email || '';
    doc.getElementById('val-pphone').textContent = app.patientDetails.phone || '';
    doc.getElementById('val-pnic').textContent = user?.nicId || 'N/A';
    doc.getElementById('val-pdob').textContent = formattedDob;
    doc.getElementById('val-appid').textContent = app._id || '';
    doc.getElementById('val-docname').textContent = app.doctorId.name || '';
    doc.getElementById('val-date').textContent = app.date || '';
    doc.getElementById('val-time').textContent = app.timeSlot || '';
    doc.getElementById('val-treatment').textContent = app.treatmentType || '';
 
    if (app.symptoms) {
      doc.getElementById('symptoms-container').style.display = 'block';
      doc.getElementById('val-symptoms').textContent = `"${app.symptoms}"`;
    }
 
    if (app.paymentDetails && app.paymentDetails.method) {
      doc.getElementById('payment-container').style.display = 'block';
      doc.getElementById('val-paymethod').textContent = app.paymentDetails.method;
      doc.getElementById('val-payamount').textContent = `LKR ${app.paymentDetails.amount.toLocaleString()}`;
    }

    if (app.doctorNotes) {
      doc.getElementById('doctor-notes-container').style.display = 'block';
      doc.getElementById('val-doctornotes').textContent = app.doctorNotes;
    }

    if (app.attachment) {
      doc.getElementById('attachment-container').style.display = 'block';
      doc.getElementById('val-attachment').src = app.attachment;
    }

    printWindow.onload = function() {
      printWindow.print();
      printWindow.close();
    };

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const getStatusBadge = (status) => {
    let badgeClass = '';
    switch (status) {
      case 'pending':
        badgeClass = 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/30';
        break;
      case 'confirmed':
        badgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
        break;
      case 'cancelled':
        badgeClass = 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-red-100 dark:border-red-900/30';
        break;
      case 'completed':
        badgeClass = 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
        break;
      default:
        badgeClass = '';
    }
    return `text-xs px-2.5 py-1 rounded-full font-semibold border ${badgeClass}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-200 py-10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Banner Welcome */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-brand-500 to-tealbrand-500 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 text-9xl pointer-events-none translate-x-12 -translate-y-8 select-none font-extrabold">🦷</div>
          <div className="relative z-10 space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans">
              Welcome, {user?.name}!
            </h1>
            <p className="text-white/80 text-xs sm:text-sm font-light">
              Review your upcoming clinic appointments, manage your patient medical profile, and update account settings.
            </p>
          </div>
        </div>

        {/* Desktop Layout split: Sidebar navigation tabs + Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

          {/* Dashboard Tabs Sidebar */}
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 lg:space-y-1">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`relative w-auto lg:w-full flex items-center gap-2.5 p-3 sm:p-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 text-left border z-10 select-none shrink-0 ${
                activeTab === 'appointments'
                  ? 'text-white border-transparent'
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-650 dark:text-slate-400'
              }`}
            >
              {activeTab === 'appointments' && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-brand-500 rounded-xl -z-10 shadow-md shadow-brand-500/20"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Calendar size={16} /> My Appointments
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`relative w-auto lg:w-full flex items-center gap-2.5 p-3 sm:p-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 text-left border z-10 select-none shrink-0 ${
                activeTab === 'profile'
                  ? 'text-white border-transparent'
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-650 dark:text-slate-400'
              }`}
            >
              {activeTab === 'profile' && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-brand-500 rounded-xl -z-10 shadow-md shadow-brand-500/20"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <User size={16} /> Profile & Medical Notes
            </button>

            {!user?.isGoogleUser && (
              <button
                onClick={() => setActiveTab('password')}
                className={`relative w-auto lg:w-full flex items-center gap-2.5 p-3 sm:p-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 text-left border z-10 select-none shrink-0 ${
                  activeTab === 'password'
                    ? 'text-white border-transparent'
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-650 dark:text-slate-400'
                }`}
              >
                {activeTab === 'password' && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-brand-500 rounded-xl -z-10 shadow-md shadow-brand-500/20"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <KeyRound size={16} /> Change Password
              </button>
            )}
          </div>

          {/* Main Dashboard Screen */}
          <div className="lg:col-span-3">

            {/* TABS 1: APPOINTMENTS HISTORY */}
            {activeTab === 'appointments' && (
              <Card hoverEffect className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-sans">
                      My Booking History
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5 font-light">
                      Track upcoming appointments or access receipts for completed checkups.
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/book')} className="text-xs">
                    Book New Slot
                  </Button>
                </div>

                {isLoading ? (
                  <Loader size="lg" className="py-10" />
                ) : appointments.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <span className="text-4xl">📅</span>
                    <h4 className="font-bold text-slate-600 dark:text-slate-400">No appointments found</h4>
                    <p className="text-slate-400 text-xs max-w-sm mx-auto font-light">
                      You haven't scheduled any dental clinic visits at The Dental Avenue yet.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/book')}>
                      Book Your First Slot
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {appointments.map((app) => (
                      <div
                        key={app._id}
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group"
                      >
                        {/* Status color bar indicator */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                          app.status === 'completed' ? 'bg-blue-500' :
                          app.status === 'confirmed' ? 'bg-emerald-500' :
                          app.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />

                        {/* Top Section: Doctor Profile and Status + Action Buttons */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-4 ml-2">
                          <div className="flex items-center gap-4">
                            <img
                              src={app.doctorId.profileImage || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150&h=150'}
                              alt={app.doctorId.name}
                              className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-slate-100 dark:border-slate-800 shadow-sm"
                            />
                            <div>
                              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm md:text-base">
                                {app.doctorId.name}
                              </h3>
                              <span className="inline-block text-[10px] font-bold text-brand-500 mt-0.5 bg-brand-50 dark:bg-brand-950/20 px-2 py-0.5 rounded border border-brand-100/20 dark:border-brand-900/10">
                                {app.treatmentType}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <span className={getStatusBadge(app.status)}>
                              {app.status.toUpperCase()}
                            </span>

                            <div className="flex items-center gap-2">
                              {/* Print receipt */}
                              {['confirmed', 'completed'].includes(app.status) && (
                                <button
                                  onClick={() => downloadReceipt(app)}
                                  className="p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900"
                                  title="Download Confirmation / Receipt"
                                >
                                  <Download size={15} />
                                </button>
                              )}

                              {/* Reschedule/Cancel triggers (Only for pending or confirmed) */}
                              {['pending', 'confirmed'].includes(app.status) && (
                                <>
                                  <button
                                    onClick={() => handleRescheduleClick(app)}
                                    className="p-2 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/20 rounded-xl transition-all border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900"
                                    title="Reschedule Appointment"
                                  >
                                    <RefreshCw size={15} />
                                  </button>
                                  <button
                                    onClick={() => handleCancelClick(app._id)}
                                    className="p-2 text-red-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900"
                                    title="Cancel Appointment"
                                  >
                                    <XCircle size={15} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Section: 3-column Grid for Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5 ml-2">
                          
                          {/* Col 1: Scheduling details */}
                          <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100/70 dark:border-slate-850 shadow-inner space-y-2.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">📅 Appointment Info</span>
                            
                            <div className="space-y-2 text-xs font-semibold">
                              <div className="flex justify-between items-center py-1 border-b border-slate-100/50 dark:border-slate-800/40">
                                <span className="text-slate-400">Date</span>
                                <span className="text-slate-700 dark:text-slate-200 font-bold">📅 {app.date}</span>
                              </div>
                              <div className="flex justify-between items-center py-1 border-b border-slate-100/50 dark:border-slate-800/40">
                                <span className="text-slate-400">Time Slot</span>
                                <span className="text-slate-700 dark:text-slate-200 font-bold">⏰ {app.timeSlot}</span>
                              </div>
                              <div className="flex justify-between items-center py-1 border-b border-slate-100/50 dark:border-slate-800/40">
                                <span className="text-slate-400">Emergency</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize border ${
                                  app.emergencyLevel === 'high' ? 'bg-red-50 text-red-500 border-red-100 dark:bg-red-950/20' :
                                  app.emergencyLevel === 'medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-950/20' :
                                  'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                                }`}>
                                  {app.emergencyLevel}
                                </span>
                              </div>
                              {app.paymentDetails && app.paymentDetails.method && (
                                <div className="flex justify-between items-center py-1">
                                  <span className="text-slate-400">Payment</span>
                                  <span className="text-teal-650 dark:text-teal-400 font-extrabold">LKR {app.paymentDetails.amount.toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Col 2: Symptoms or Doctor's notes */}
                          <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100/70 dark:border-slate-850 shadow-inner space-y-2.5">
                            {app.status === 'completed' ? (
                              <>
                                <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest block">🩺 Doctor's Notes & Prescriptions</span>
                                {app.doctorNotes ? (
                                  <p className="text-xs text-slate-650 dark:text-slate-350 whitespace-pre-line leading-relaxed font-sans max-h-32 overflow-y-auto scrollbar-thin">
                                    {app.doctorNotes}
                                  </p>
                                ) : (
                                  <p className="text-xs text-slate-400 italic">No notes provided for this consultation.</p>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">💬 Symptoms Reported</span>
                                {app.symptoms ? (
                                  <p className="text-xs text-slate-650 dark:text-slate-400 italic leading-relaxed font-sans max-h-32 overflow-y-auto scrollbar-thin">
                                    "{app.symptoms}"
                                  </p>
                                ) : (
                                  <p className="text-xs text-slate-400 italic">No symptoms reported upon booking.</p>
                                )}
                              </>
                            )}
                          </div>

                          {/* Col 3: Medical image attachment */}
                          <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100/70 dark:border-slate-850 shadow-inner flex flex-col justify-between space-y-2.5">
                            <span className="text-[9px] font-bold text-brand-500 uppercase tracking-widest block">🖼️ Medical Image / X-Ray</span>
                            {app.attachment ? (
                              <div className="flex-1 flex justify-center items-center border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 rounded-lg overflow-hidden h-24 max-h-24">
                                <img
                                  src={app.attachment}
                                  alt="Attached Medical File"
                                  className="max-h-full max-w-full object-contain rounded hover:scale-105 transition-transform duration-300 cursor-pointer"
                                  onClick={() => {
                                    const w = window.open();
                                    if (w) {
                                      w.document.write(`<img src="${app.attachment}" style="max-width:100%; max-height:100vh; object-fit:contain; display:block; margin:auto;" />`);
                                      w.document.close();
                                    }
                                  }}
                                  title="Click to view full image"
                                />
                              </div>
                            ) : (
                              <div className="flex-1 flex items-center justify-center text-xs text-slate-400 italic font-light border border-dashed border-slate-200 dark:border-slate-800 rounded-lg h-24 max-h-24">
                                No image attached
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* TABS 2: PROFILE UPDATE */}
            {activeTab === 'profile' && (
              <Card hoverEffect className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-sans">
                    Patient Profile & Medical History
                  </h2>
                  <p className="text-slate-400 text-xs mt-0.5 font-light">
                    Keep your contact records and medical allergies updated for automatic form autofills.
                  </p>
                </div>

                <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input
                      label="Full Name"
                      id="name"
                      required
                      error={errorsProfile.name?.message}
                      {...registerProfile('name', { required: 'Name is required' })}
                    />
                    <Input
                      label="Phone Number"
                      id="phone"
                      required
                      error={errorsProfile.phone?.message}
                      {...registerProfile('phone', {
                        required: 'Phone Number is required',
                        pattern: {
                          value: /^[+]?[0-9\s-]{8,15}$/,
                          message: 'Please enter a valid phone number'
                        }
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <Input
                      label="NIC / ID Number / Passport No"
                      id="nicId"
                      required
                      error={errorsProfile.nicId?.message}
                      {...registerProfile('nicId', { required: 'NIC / ID Number / Passport No is required' })}
                    />
                    <Input
                      label="Date of Birth"
                      id="dob"
                      type="date"
                      required
                      error={errorsProfile.dob?.message}
                      {...registerProfile('dob', { required: 'Date of Birth is required' })}
                    />
                    <Select
                      label="Gender"
                      id="gender"
                      required
                      error={errorsProfile.gender?.message}
                      {...registerProfile('gender', { required: 'Gender is required' })}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </Select>
                  </div>

                  <Input
                    label="Home Address"
                    id="address"
                    placeholder="Street, City, Country"
                    error={errorsProfile.address?.message}
                    {...registerProfile('address')}
                  />

                  {/* Medical notes */}
                  <Textarea
                    label="Medical Notes / Allergies / Pre-existing Conditions"
                    id="medicalNotes"
                    rows={3}
                    placeholder="e.g. Allergy to Penicillin, Diabetic, Hypertension, etc."
                    {...registerProfile('medicalNotes')}
                  />

                  {/* Emergency Contact */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle size={14} /> Emergency Contact Information
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Contact Person Name"
                        id="emergencyContactName"
                        placeholder="Name of relative or guardian"
                        {...registerProfile('emergencyContactName')}
                      />
                      <Input
                        label="Emergency Contact Phone"
                        id="emergencyContactPhone"
                        placeholder="Phone number"
                        {...registerProfile('emergencyContactPhone')}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" variant="primary" isLoading={isSubmittingProfile} className="gap-2">
                      <Save size={16} /> Save Profile Changes
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* TABS 3: PASSWORD SETTINGS */}
            {activeTab === 'password' && (
              <Card hoverEffect className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-sans">
                    Change Password
                  </h2>
                  <p className="text-slate-400 text-xs mt-0.5 font-light">
                    Ensure your patient account remains secure by updating passwords regularly.
                  </p>
                </div>

                {user?.isGoogleUser ? (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl text-xs leading-relaxed text-blue-700 dark:text-blue-400">
                    <Info size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Password Change Disabled</p>
                      <p className="mt-1 font-light">Your account is registered via Google Sign-In. Passwords are managed directly by Google for security.</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4 max-w-md">
                    <Input
                      label="Current Password"
                      id="currentPassword"
                      type="password"
                      required
                      placeholder="••••••••"
                      error={errorsPassword.currentPassword?.message}
                      {...registerPassword('currentPassword', { required: 'Current password is required' })}
                    />

                    <Input
                      label="New Password"
                      id="newPassword"
                      type="password"
                      required
                      placeholder="••••••••"
                      error={errorsPassword.newPassword?.message}
                      {...registerPassword('newPassword', {
                        required: 'New password is required',
                        minLength: { value: 6, message: 'Password must be at least 6 characters' }
                      })}
                    />

                    <Input
                      label="Confirm New Password"
                      id="confirmPassword"
                      type="password"
                      required
                      placeholder="••••••••"
                      error={errorsPassword.confirmPassword?.message}
                      {...registerPassword('confirmPassword', { required: 'Please confirm your new password' })}
                    />

                    <div className="pt-2">
                      <Button type="submit" variant="secondary" isLoading={isSubmittingPassword} className="w-full sm:w-auto">
                        Update Password
                      </Button>
                    </div>
                  </form>
                )}
              </Card>
            )}

          </div>

        </div>

      </div>

      {/* CANCELLATION EXPLANATION DIALOG MODAL */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Appointment Reservation"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCancelModalOpen(false)}>
              Discard
            </Button>
            <Button variant="danger" size="sm" isLoading={isCancelling} onClick={handleCancelConfirm}>
              Confirm Cancellation
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-500">
            Please note that cancelling this appointment will instantly release the locked time slot to other patients. Explain your reasoning below:
          </p>
          <div>
            <textarea
              placeholder="e.g. Rescheduling conflict, decided to book another doctor..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
              rows={3}
            />
          </div>
        </div>
      </Modal>

    </motion.div>
  );
};

export default PatientDashboard;
