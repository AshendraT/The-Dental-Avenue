import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import {
  Shield, Users, Calendar, MessageSquare, FileText, Plus, Edit, Trash2,
  Check, X, Ban, CheckCircle, Download, Search, Settings, HelpCircle,
  TrendingUp, Clock, AlertTriangle, ShieldCheck, Mail, LogOut, Sun, Moon, Menu
} from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import Loader from '../components/common/Loader';
const CLINIC_SERVICES = [
  'Dental check up',
  'Restorations( Tooth coloured Fillings)',
  'Tooth Extraction',
  'Root canal Treatment',
  'Dental implants',
  'Complete & partial Dentures',
  'Crown and Bridges',
  'Orthodontic treatment',
  'Clear aligner treatments',
  'Full mouth scaling & polishing,whitening',
  'Paediatric dental treatment',
  'Oral & Maxillofacial surgery (minor oral surgeries)'
];

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Dashboard stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Appointments state
  const [appointments, setAppointments] = useState([]);
  const [appSearch, setAppSearch] = useState('');
  const [appStatus, setAppStatus] = useState('');
  const [appDate, setAppDate] = useState('');
  const [appPage, setAppPage] = useState(1);
  const [appPages, setAppPages] = useState(1);
  const [loadingApps, setLoadingApps] = useState(false);
  const [updatingApps, setUpdatingApps] = useState({});

  // Patients state
  const [patients, setPatients] = useState([]);
  const [patSearch, setPatSearch] = useState('');
  const [patPage, setPatPage] = useState(1);
  const [patPages, setPatPages] = useState(1);
  const [loadingPats, setLoadingPats] = useState(false);

  // Walk-in Patient states
  const [patModalOpen, setPatModalOpen] = useState(false);
  const [patForm, setPatForm] = useState({
    name: '',
    email: '',
    phone: '',
    nicId: '',
    dob: '',
    gender: '',
    address: '',
    medicalNotes: '',
    password: 'Avenue@2026'
  });
  const [isSubmittingPatient, setIsSubmittingPatient] = useState(false);

  // Admin Appointment Booking states
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [bookForm, setBookForm] = useState({
    patientId: '',
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    patientAge: '',
    patientGender: '',
    doctorId: '',
    treatmentType: '',
    date: '',
    timeSlot: '',
    symptoms: '',
    emergencyLevel: 'low',
    preferredCommunication: 'email'
  });
  const [isBookingPatient, setIsBookingPatient] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Live Date/Time state
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatLiveDateTime = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Doctors state
  const [doctors, setDoctors] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);

  // Inquiries state
  const [inquiries, setInquiries] = useState([]);
  const [loadingInqs, setLoadingInqs] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [activeInquiry, setActiveInquiry] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Audit Logs state
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Patient History state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState(null);
  const [patientHistoryData, setPatientHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedAppointmentDetail, setSelectedAppointmentDetail] = useState(null);

  // New Pending Appointments Popup states
  const [showNewAppsPopup, setShowNewAppsPopup] = useState(false);
  const [pendingAppsCount, setPendingAppsCount] = useState(0);
  const [hasShownNewAppsPopup, setHasShownNewAppsPopup] = useState(false);

  // Completion Modal states
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [appointmentToComplete, setAppointmentToComplete] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('By Cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [attachment, setAttachment] = useState('');
  const [attachmentError, setAttachmentError] = useState('');

  // Admin Settings states
  const [settingsForm, setSettingsForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    if (settingsForm.newPassword !== settingsForm.confirmPassword) {
      addToast('New password and confirm password do not match', 'warning');
      return;
    }
    
    // Password strength check on frontend to provide fast feedback
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{6,}$/;
    if (!passwordRegex.test(settingsForm.newPassword)) {
      addToast('New password must be at least 6 characters and contain at least one uppercase letter, one lowercase letter, and one number', 'warning');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await api.put('/users/change-password', {
        currentPassword: settingsForm.currentPassword,
        newPassword: settingsForm.newPassword
      });
      if (res.success) {
        addToast('Admin password changed successfully!', 'success');
        setSettingsForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      addToast(err.message || 'Failed to change password. Please check your current password.', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await api.get(`/admin/stats?localDate=${todayStr}`);
      if (res.success) {
        setStats(res);

        // Show pending appointments popup if there are any and we haven't shown it yet
        if (!hasShownNewAppsPopup && res.statusSplit && res.statusSplit.pending > 0) {
          setPendingAppsCount(res.statusSplit.pending);
          setShowNewAppsPopup(true);
          setHasShownNewAppsPopup(true);
        }
      }
    } catch (err) {
      addToast('Failed to load metrics', 'error');
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Appointments
  const fetchAppointments = async () => {
    setLoadingApps(true);
    try {
      const res = await api.get(`/admin/appointments?page=${appPage}&search=${appSearch}&status=${appStatus}&date=${appDate}`);
      if (res.success) {
        setAppointments(res.appointments);
        setAppPages(res.pages);
      }
    } catch (err) {
      addToast('Failed to load appointments', 'error');
    } finally {
      setLoadingApps(false);
    }
  };

  // Fetch Patients
  const fetchPatients = async (overrideSearch = undefined) => {
    setLoadingPats(true);
    try {
      const searchVal = overrideSearch !== undefined ? overrideSearch : patSearch;
      const res = await api.get(`/admin/patients?page=${patPage}&search=${searchVal}`);
      if (res.success) {
        setPatients(res.patients);
        setPatPages(res.pages);
      }
    } catch (err) {
      addToast('Failed to load patients', 'error');
    } finally {
      setLoadingPats(false);
    }
  };

  // Fetch Doctors
  const fetchDoctors = async () => {
    setLoadingDocs(true);
    try {
      const res = await api.get('/doctors');
      if (res.success) {
        setDoctors(res.doctors);
      }
    } catch (err) {
      addToast('Failed to load doctors', 'error');
    } finally {
      setLoadingDocs(false);
    }
  };

  // Fetch Inquiries
  const fetchInquiries = async () => {
    setLoadingInqs(true);
    try {
      const res = await api.get('/admin/inquiries');
      if (res.success) {
        setInquiries(res.inquiries);
      }
    } catch (err) {
      addToast('Failed to load inquiries', 'error');
    } finally {
      setLoadingInqs(false);
    }
  };

  // Fetch Audit Logs
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.get('/admin/logs');
      if (res.success) {
        setLogs(res.logs);
      }
    } catch (err) {
      addToast('Failed to load audit logs', 'error');
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch Patient History
  const fetchPatientHistory = async (patientId) => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/admin/patients/${patientId}/history`);
      if (res.success) {
        setPatientHistoryData(res);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load patient history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatientForHistory(patient);
    setPatientHistoryData(null);
    setSelectedAppointmentDetail(null);
    fetchPatientHistory(patient._id);
  };

  const handleReviewPending = () => {
    setShowNewAppsPopup(false);
    setActiveTab('appointments');
    setAppStatus('pending');
    setAppPage(1);
  };

  // Trigger loading based on selected tab
  useEffect(() => {
    if (activeTab === 'overview') fetchStats();
    if (activeTab === 'appointments') fetchAppointments();
    if (activeTab === 'patients') fetchPatients();
    if (activeTab === 'doctors') fetchDoctors();
    if (activeTab === 'inquiries') fetchInquiries();
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab, appPage, appStatus, appDate, patPage]);

  // Handle Search queries (Debounced or triggered on button press)
  const handleAppSearch = (e) => {
    e.preventDefault();
    setAppPage(1);
    fetchAppointments();
  };

  const handlePatSearch = (e) => {
    e.preventDefault();
    setPatPage(1);
    fetchPatients();
  };

  const handleClearPatSearch = () => {
    setPatSearch('');
    setPatPage(1);
    fetchPatients('');
  };

  // Fetch slots whenever doctor or date changes in admin booking form
  useEffect(() => {
    if (!bookForm.doctorId || !bookForm.date) {
      setAvailableSlots([]);
      return;
    }

    const fetchAdminSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await api.get(`/doctors/${bookForm.doctorId}/availability?date=${bookForm.date}`);
        if (res.success) {
          setAvailableSlots(res.slots || []);
        }
      } catch (err) {
        addToast(err.message || 'Failed to check doctor availability', 'error');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAdminSlots();
  }, [bookForm.doctorId, bookForm.date]);

  // Walk-In Patient Registration handlers
  const handleOpenPatModal = () => {
    setPatForm({
      name: '',
      email: '',
      phone: '',
      nicId: '',
      dob: '',
      gender: '',
      address: '',
      medicalNotes: '',
      password: 'Avenue@2026'
    });
    setPatModalOpen(true);
  };

  const handlePatSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingPatient(true);
    try {
      const res = await api.post('/admin/patients', patForm);
      if (res.success) {
        addToast('Walk-in patient registered successfully!', 'success');
        setPatModalOpen(false);
        fetchPatients();
        fetchStats(); // update counters
      }
    } catch (err) {
      addToast(err.message || 'Failed to register patient', 'error');
    } finally {
      setIsSubmittingPatient(false);
    }
  };

  // Admin Appointment Booking handlers
  const handleOpenBookModal = (patient) => {
    // Fetch doctors if list is empty
    if (doctors.length === 0) {
      fetchDoctors();
    }

    // Calculate age from DOB if available
    let calculatedAge = '';
    if (patient.dob) {
      const birthDate = new Date(patient.dob);
      const difference = Date.now() - birthDate.getTime();
      const ageDate = new Date(difference);
      calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    setBookForm({
      patientId: patient._id,
      patientName: patient.name,
      patientEmail: patient.email,
      patientPhone: patient.phone || '',
      patientAge: calculatedAge,
      patientGender: patient.gender || '',
      doctorId: '',
      treatmentType: '',
      date: '',
      timeSlot: '',
      symptoms: '',
      emergencyLevel: 'low',
      preferredCommunication: 'email'
    });
    setAvailableSlots([]);
    setBookModalOpen(true);
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!bookForm.timeSlot) {
      addToast('Please select a time slot', 'warning');
      return;
    }
    setIsBookingPatient(true);
    try {
      const res = await api.post('/admin/appointments', bookForm);
      if (res.success) {
        addToast('Appointment booked successfully for patient!', 'success');
        setBookModalOpen(false);
        fetchStats();
        // Refresh selected patient's history inline if visible
        if (selectedPatientForHistory && selectedPatientForHistory._id === bookForm.patientId) {
          fetchPatientHistory(selectedPatientForHistory._id);
        }
      }
    } catch (err) {
      addToast(err.message || 'Failed to book appointment', 'error');
    } finally {
      setIsBookingPatient(false);
    }
  };

  const handleOpenCompletionModal = (app) => {
    setAppointmentToComplete(app);
    setPaymentMethod('By Cash');
    setPaymentAmount('');
    setDoctorNotes('');
    setAttachment('');
    setAttachmentError('');
    setCompletionModalOpen(true);
  };

  const handleCompleteSubmit = async () => {
    if (!appointmentToComplete) return;
    if (attachmentError) {
      addToast(attachmentError, 'warning');
      return;
    }
    setIsCompleting(true);
    setUpdatingApps(prev => ({ ...prev, [appointmentToComplete._id]: true }));
    try {
      const res = await api.put(`/admin/appointments/${appointmentToComplete._id}/status`, {
        status: 'completed',
        paymentMethod,
        paymentAmount,
        doctorNotes,
        attachment
      });
      if (res.success) {
        addToast(`Appointment marked completed with payment recorded!`, 'success');
        setCompletionModalOpen(false);
        // Refresh bookings
        fetchAppointments();
        fetchStats();

        // Refresh inline patient history if active
        if (selectedPatientForHistory) {
          fetchPatientHistory(selectedPatientForHistory._id);
          setSelectedAppointmentDetail(prev => prev && prev._id === appointmentToComplete._id ? {
            ...prev,
            status: 'completed',
            paymentDetails: {
              method: paymentMethod,
              amount: Number(paymentAmount) || 0
            }
          } : prev);
        }
      }
    } catch (err) {
      addToast(err.message || 'Failed to complete appointment', 'error');
    } finally {
      setIsCompleting(false);
      setUpdatingApps(prev => {
        const next = { ...prev };
        delete next[appointmentToComplete._id];
        return next;
      });
    }
  };

  // Toggle Appointment Status (Confirm / Reject / Complete)
  const handleAppStatusChange = async (appId, newStatus) => {
    if (newStatus === 'completed') {
      const app = appointments.find(a => a._id === appId) || 
                  (selectedAppointmentDetail?._id === appId ? selectedAppointmentDetail : null) ||
                  (stats?.todayAppointments?.find(a => a._id === appId));
      if (app) {
        handleOpenCompletionModal(app);
        return;
      }
    }

    setUpdatingApps(prev => ({ ...prev, [appId]: true }));
    try {
      const res = await api.put(`/admin/appointments/${appId}/status`, { status: newStatus });
      if (res.success) {
        addToast(`Appointment status updated to ${newStatus}!`, 'success');
        // Refresh bookings
        fetchAppointments();

        // Refresh inline patient history if active
        if (selectedPatientForHistory) {
          fetchPatientHistory(selectedPatientForHistory._id);
          setSelectedAppointmentDetail(prev => prev && prev._id === appId ? { ...prev, status: newStatus } : prev);
        }
      }
    } catch (err) {
      addToast(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingApps(prev => {
        const next = { ...prev };
        delete next[appId];
        return next;
      });
    }
  };

  // Block / Unblock User
  const handleToggleBlock = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/block`);
      if (res.success) {
        addToast(`Patient block status updated!`, 'success');
        fetchPatients();
      }
    } catch (err) {
      addToast(err.message || 'Failed to toggle block status', 'error');
    }
  };

  // Doctor CRUD
  const [docForm, setDocForm] = useState({
    name: '',
    qualification: '',
    experience: 0,
    bio: '',
    profileImage: '',
    availability: {},
    services: []
  });

  const handleOpenDocModal = (doc = null) => {
    if (doc) {
      setEditingDoc(doc);
      setDocForm({
        name: doc.name,
        qualification: doc.qualification,
        experience: doc.experience,
        bio: doc.bio,
        profileImage: doc.profileImage,
        availability: doc.availability || {},
        services: doc.services || []
      });
    } else {
      setEditingDoc(null);
      setDocForm({
        name: '',
        qualification: '',
        experience: 5,
        bio: '',
        profileImage: '',
        availability: {},
        services: []
      });
    }
    setDocModalOpen(true);
  };

  const handleDocSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDoc) {
        // Edit doctor
        const res = await api.put(`/admin/doctors/${editingDoc._id}`, docForm);
        if (res.success) {
          addToast('Doctor details updated successfully', 'success');
          setDocModalOpen(false);
          fetchDoctors();
        }
      } else {
        // Add doctor
        const res = await api.post('/admin/doctors', docForm);
        if (res.success) {
          addToast('New Doctor registered successfully!', 'success');
          setDocModalOpen(false);
          fetchDoctors();
        }
      }
    } catch (err) {
      addToast(err.message || 'Doctor action failed', 'error');
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this doctor? This cannot be undone.')) return;
    try {
      const res = await api.delete(`/admin/doctors/${docId}`);
      if (res.success) {
        addToast('Doctor removed successfully', 'success');
        fetchDoctors();
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete doctor', 'error');
    }
  };

  // Inquiry Response Modal
  const handleOpenReplyModal = (inq) => {
    setActiveInquiry(inq);
    setReplyText('');
    setReplyModalOpen(true);
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      addToast('Please enter a response message', 'warning');
      return;
    }
    setIsSendingReply(true);
    try {
      // Mark read and trigger simulation response
      await api.put(`/admin/inquiries/${activeInquiry._id}`, { status: 'replied' });
      addToast('Response email sent mock successfully!', 'success');
      setReplyModalOpen(false);
      fetchInquiries();
    } catch (err) {
      addToast('Failed to register inquiry response', 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleMarkRead = async (inqId) => {
    try {
      const res = await api.put(`/admin/inquiries/${inqId}`, { status: 'read' });
      if (res.success) {
        addToast('Inquiry marked read', 'info');
        fetchInquiries();
      }
    } catch (err) {
      addToast('Failed to update inquiry status', 'error');
    }
  };

  // Export CSV Helper (client-side generation)
  const exportToCSV = (dataset, filename) => {
    if (!dataset || dataset.length === 0) {
      addToast('No data to export', 'warning');
      return;
    }

    // Construct CSV string
    const headers = Object.keys(dataset[0]).join(',');
    const rows = dataset.map(row => {
      return Object.values(row).map(value => {
        const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return `"${valStr.replace(/"/g, '""')}"`; // escape double quotes
      }).join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Data exported successfully!', 'success');
  };

  const handleExportAppointments = async () => {
    try {
      const res = await api.get('/admin/appointments?limit=1000'); // fetch all
      if (res.success && res.appointments.length > 0) {
        const dataToExport = res.appointments.map(app => ({
          ID: app._id,
          Patient: app.patientDetails.name,
          Email: app.patientDetails.email,
          Phone: app.patientDetails.phone,
          Doctor: app.doctorId?.name || 'N/A',
          Date: app.date,
          TimeSlot: app.timeSlot,
          Treatment: app.treatmentType,
          Severity: app.emergencyLevel,
          Status: app.status
        }));
        exportToCSV(dataToExport, 'Dental_Avenue_Appointments');
      }
    } catch (err) {
      addToast('Failed to export data', 'error');
    }
  };

  const getStatusBadge = (status) => {
    let badgeClass = '';
    switch (status) {
      case 'pending':
        badgeClass = 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/30';
        break;
      case 'confirmed':
        badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
        break;
      case 'cancelled':
        badgeClass = 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30';
        break;
      case 'completed':
        badgeClass = 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
        break;
      default:
        badgeClass = '';
    }
    return `text-[10px] px-2 py-0.5 rounded-full font-semibold border uppercase tracking-wider ${badgeClass}`;
  };

  const handleLogoutClick = () => {
    if (window.confirm('Are you sure you want to log out of the Admin Console?')) {
      logout();
    }
  };

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-200 flex flex-col md:flex-row">

      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* 1. SIDEBAR NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col shrink-0 h-full transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative transition-transform duration-300 ease-in-out`}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="The Dental Avenue Logo" className="h-10 w-auto object-contain shrink-0" />
            <div>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 tracking-wider uppercase">Admin Console</h4>
            </div>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: <TrendingUp size={16} /> },
            { id: 'appointments', label: 'Manage Appointments', icon: <Calendar size={16} /> },
            { id: 'patients', label: 'Patient Registry', icon: <Users size={16} /> },
            { id: 'doctors', label: 'Clinic Doctors', icon: <ShieldCheck size={16} /> },
            { id: 'inquiries', label: 'Message Inbox', icon: <MessageSquare size={16} /> },
            { id: 'logs', label: 'System Audit Logs', icon: <FileText size={16} /> },
            { id: 'settings', label: 'Admin Settings', icon: <Settings size={16} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'appointments') setAppPage(1);
                if (tab.id === 'patients') setPatPage(1);
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${activeTab === tab.id
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Profile / Logout / Theme Toggle Section at bottom of Sidebar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-2 mt-auto">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200 transition-all border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
          >
            <span className="flex items-center gap-2">
              {theme === 'dark' ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-brand-500" />}
              <span>Theme Mode</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>

          <div className="flex items-center gap-3 px-2 py-1.5 border-t border-slate-100/50 dark:border-slate-800/50 pt-3 mt-1">
            <div className="h-8 w-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden font-sans">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@dentalavenue.com'}</p>
            </div>
          </div>
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col gap-6">

        {/* Global Dashboard Header with Live Clock */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm transition-all duration-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0"
              aria-label="Open menu"
            >
              <Menu size={16} />
            </button>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
              Welcome back, <span className="text-brand-500 font-extrabold">{user?.name || 'Administrator'}</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-150 dark:border-slate-850/80 shadow-inner font-mono text-[11px] font-bold text-slate-600 dark:text-slate-355 tracking-wider">
            <span className="text-brand-500 animate-pulse">●</span>
            <span>{formatLiveDateTime(currentTime)}</span>
          </div>
        </div>

        {/* OVERVIEW METRICS TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans">
              Analytics Overview
            </h2>

            {loadingStats ? (
              <Loader size="lg" className="py-20" />
            ) : (
              <>
                {/* Counters Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { title: 'Total Appointments', value: stats.stats.totalAppointments, icon: '📅', color: 'text-brand-500', id: 'appointments', filter: '' },
                    { title: 'Registered Patients', value: stats.stats.totalPatients, icon: '👥', color: 'text-tealbrand-500', id: 'patients' },
                    { title: 'Specialist Doctors', value: stats.stats.totalDoctors, icon: '🩺', color: 'text-indigo-500', id: 'doctors' },
                    { title: 'Upcoming Bookings', value: stats.stats.upcomingBookings, icon: '🔔', color: 'text-rose-500', id: 'appointments', filter: 'upcoming' }
                  ].map((stat, idx) => (
                    <Card
                      key={idx}
                      className="p-6 flex items-center justify-between cursor-pointer hover:shadow-lg hover:border-slate-250 dark:hover:border-slate-800 transition-all duration-200 group"
                      onClick={() => {
                        setActiveTab(stat.id);
                        if (stat.id === 'appointments') {
                          setAppStatus(stat.filter);
                          setAppPage(1);
                        } else if (stat.id === 'patients') {
                          setPatPage(1);
                        }
                      }}
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-350 transition-colors uppercase tracking-wider">{stat.title}</span>
                        <p className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
                      </div>
                      <span className="text-3xl bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm group-hover:bg-slate-100 dark:group-hover:bg-slate-750 transition-colors">{stat.icon}</span>
                    </Card>
                  ))}
                </div>

                {/* Today's Appointments Schedule */}
                <Card className="p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📅</span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Today's Appointment Schedule</h4>
                        <p className="text-[10px] text-slate-400 font-light mt-0.5">
                          List of all sessions and consultations scheduled for today
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-600 dark:bg-brand-950/20 dark:text-brand-450 border border-brand-100 dark:border-brand-900/30">
                      {(stats.stats && stats.stats.todayAppointmentsCount) || 0} Scheduled
                    </span>
                  </div>

                  {!stats.todayAppointments || stats.todayAppointments.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/80">
                      <p className="text-xs text-slate-400 font-medium">
                        No appointments scheduled for today.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="p-3">Time</th>
                            <th className="p-3">Patient</th>
                            <th className="p-3">Contact</th>
                            <th className="p-3">Specialist Doctor</th>
                            <th className="p-3">Treatment</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                          {stats.todayAppointments.map((app) => (
                            <tr key={app._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                              <td className="p-3">
                                <span className="font-extrabold text-brand-500 flex items-center gap-1">
                                  ⏰ {app.timeSlot}
                                </span>
                              </td>
                              <td className="p-3 font-bold text-slate-700 dark:text-slate-200">
                                {app.patientDetails?.name || app.patientId?.name || 'Walk-In'}
                                <span className="block text-[10px] text-slate-400 font-light mt-0.5">
                                  Age: {app.patientDetails?.age || 'N/A'} | {app.patientDetails?.gender || 'N/A'}
                                </span>
                              </td>
                              <td className="p-3 text-slate-500 font-medium">
                                {app.patientDetails?.email || app.patientId?.email}
                                <span className="block text-[10px] text-slate-400 font-light mt-0.5">
                                  {app.patientDetails?.phone || app.patientId?.phone || 'N/A'}
                                </span>
                              </td>
                              <td className="p-3 font-semibold text-slate-650 dark:text-slate-350">
                                🩺 {app.doctorId?.name || 'Deleted Doctor'}
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-400 font-semibold">
                                {app.treatmentType}
                              </td>
                              <td className="p-3">
                                <span className={getStatusBadge(app.status)}>{app.status}</span>
                              </td>
                              <td className="p-3 text-right flex justify-end gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
                                {app.status === 'pending' && (
                                  <button
                                    disabled={updatingApps[app._id]}
                                    onClick={async () => {
                                      await handleAppStatusChange(app._id, 'confirmed');
                                      fetchStats(); // reload metrics & schedule
                                    }}
                                    className="p-1 rounded text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Approve Booking"
                                  >
                                    {updatingApps[app._id] ? (
                                      <svg className="animate-spin h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                      </svg>
                                    ) : (
                                      <Check size={12} />
                                    )}
                                  </button>
                                )}
                                {['pending', 'confirmed'].includes(app.status) && (
                                  <>
                                    <button
                                      disabled={updatingApps[app._id]}
                                      onClick={async () => {
                                        handleOpenCompletionModal(app);
                                      }}
                                      className="p-1 rounded text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 border border-blue-100 dark:border-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Mark Completed"
                                    >
                                      <CheckCircle size={12} />
                                    </button>
                                    <button
                                      disabled={updatingApps[app._id]}
                                      onClick={async () => {
                                        await handleAppStatusChange(app._id, 'cancelled');
                                        fetchStats();
                                      }}
                                      className="p-1 rounded text-rose-500 hover:bg-rose-55 hover:text-rose-700 dark:hover:bg-rose-950/20 border border-rose-100 dark:border-rose-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Cancel Booking"
                                    >
                                      {updatingApps[app._id] ? (
                                        <svg className="animate-spin h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                      ) : (
                                        <X size={12} />
                                      )}
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                 </Card>
 
                {/* Upcoming Bookings (Next 7 Days) */}
                <Card className="p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔔</span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Upcoming Bookings (Next 7 Days)</h4>
                        <p className="text-[10px] text-slate-400 font-light mt-0.5">
                          List of confirmed and pending appointments scheduled for tomorrow onwards
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30">
                      {stats.upcomingAppointments?.length || 0} Bookings
                    </span>
                  </div>

                  {!stats.upcomingAppointments || stats.upcomingAppointments.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/80">
                      <p className="text-xs text-slate-400 font-medium">
                        No upcoming bookings scheduled for the next 7 days.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900 scrollbar-thin">
                      <table className="w-full text-left text-xs border-collapse relative">
                        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-850 z-10">
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="p-3 bg-slate-50 dark:bg-slate-850">Date & Time</th>
                            <th className="p-3 bg-slate-50 dark:bg-slate-850">Patient</th>
                            <th className="p-3 bg-slate-50 dark:bg-slate-850">Contact</th>
                            <th className="p-3 bg-slate-50 dark:bg-slate-850">Specialist Doctor</th>
                            <th className="p-3 bg-slate-50 dark:bg-slate-850">Treatment</th>
                            <th className="p-3 bg-slate-50 dark:bg-slate-850">Status</th>
                            <th className="p-3 bg-slate-50 dark:bg-slate-850 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                          {stats.upcomingAppointments.map((app) => (
                            <tr key={app._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                              <td className="p-3">
                                <span className="font-extrabold text-brand-500 block">
                                  📅 {app.date}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                  ⏰ {app.timeSlot}
                                </span>
                              </td>
                              <td className="p-3 font-bold text-slate-700 dark:text-slate-200">
                                {app.patientDetails?.name || app.patientId?.name || 'Walk-In'}
                                <span className="block text-[10px] text-slate-400 font-light mt-0.5">
                                  Age: {app.patientDetails?.age || 'N/A'} | {app.patientDetails?.gender || 'N/A'}
                                </span>
                              </td>
                              <td className="p-3 text-slate-500 font-medium">
                                {app.patientDetails?.email || app.patientId?.email}
                                <span className="block text-[10px] text-slate-400 font-light mt-0.5">
                                  {app.patientDetails?.phone || app.patientId?.phone || 'N/A'}
                                </span>
                              </td>
                              <td className="p-3 font-semibold text-slate-650 dark:text-slate-350">
                                🩺 {app.doctorId?.name || 'Deleted Doctor'}
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-400 font-semibold">
                                {app.treatmentType}
                              </td>
                              <td className="p-3">
                                <span className={getStatusBadge(app.status)}>{app.status}</span>
                              </td>
                              <td className="p-3 text-right flex justify-end gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
                                {app.status === 'pending' && (
                                  <button
                                    disabled={updatingApps[app._id]}
                                    onClick={async () => {
                                      await handleAppStatusChange(app._id, 'confirmed');
                                      fetchStats();
                                    }}
                                    className="p-1 rounded text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Approve Booking"
                                  >
                                    {updatingApps[app._id] ? (
                                      <svg className="animate-spin h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                      </svg>
                                    ) : (
                                      <Check size={12} />
                                    )}
                                  </button>
                                )}
                                {['pending', 'confirmed'].includes(app.status) && (
                                  <>
                                    <button
                                      disabled={updatingApps[app._id]}
                                      onClick={async () => {
                                        handleOpenCompletionModal(app);
                                      }}
                                      className="p-1 rounded text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 border border-blue-100 dark:border-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Mark Completed"
                                    >
                                      <CheckCircle size={12} />
                                    </button>
                                    <button
                                      disabled={updatingApps[app._id]}
                                      onClick={async () => {
                                        await handleAppStatusChange(app._id, 'cancelled');
                                        fetchStats();
                                      }}
                                      className="p-1 rounded text-rose-500 hover:bg-rose-55 hover:text-rose-700 dark:hover:bg-rose-950/20 border border-rose-100 dark:border-rose-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Cancel Booking"
                                    >
                                      {updatingApps[app._id] ? (
                                        <svg className="animate-spin h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                      ) : (
                                        <X size={12} />
                                      )}
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>

                {/* SVG Graphics Analytics Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Donut Chart: Appointment Status */}
                  <Card className="p-6 space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Appointment Status Breakdown</h4>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
                      {(() => {
                        const pending = stats.statusSplit?.pending || 0;
                        const confirmed = stats.statusSplit?.confirmed || 0;
                        const completed = stats.statusSplit?.completed || 0;
                        const cancelled = stats.statusSplit?.cancelled || 0;
                        const total = pending + confirmed + completed + cancelled;

                        if (total === 0) {
                          return (
                            <div className="text-slate-400 text-xs font-light py-10">
                              No data available to display breakdown.
                            </div>
                          );
                        }

                        // Circumference for r=35 is 2 * pi * 35 = 219.91
                        const circ = 219.91;

                        const pctCompleted = (completed / total) * 100;
                        const pctConfirmed = (confirmed / total) * 100;
                        const pctPending = (pending / total) * 100;
                        const pctCancelled = (cancelled / total) * 100;

                        const valCompleted = (completed / total) * circ;
                        const valConfirmed = (confirmed / total) * circ;
                        const valPending = (pending / total) * circ;
                        const valCancelled = (cancelled / total) * circ;

                        let currentOffset = 0;
                        const offsetCompleted = currentOffset;
                        currentOffset -= valCompleted;
                        const offsetConfirmed = currentOffset;
                        currentOffset -= valConfirmed;
                        const offsetPending = currentOffset;
                        currentOffset -= valPending;
                        const offsetCancelled = currentOffset;

                        return (
                          <>
                            <div className="relative h-40 w-40 flex items-center justify-center shrink-0">
                              <svg width="100%" height="100%" viewBox="0 0 100 100" className="-rotate-90">
                                {/* Base track circle */}
                                <circle cx="50" cy="50" r="35" fill="transparent" stroke="#f1f5f9" strokeWidth="10" className="dark:stroke-slate-800" />

                                {/* Completed (Blue) */}
                                {completed > 0 && (
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="35"
                                    fill="transparent"
                                    stroke="#3b82f6"
                                    strokeWidth="10"
                                    strokeDasharray={`${valCompleted} ${circ - valCompleted}`}
                                    strokeDashoffset={offsetCompleted}
                                    strokeLinecap="round"
                                    className="transition-all duration-500"
                                  />
                                )}

                                {/* Confirmed (Teal/Green) */}
                                {confirmed > 0 && (
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="35"
                                    fill="transparent"
                                    stroke="#10b981"
                                    strokeWidth="10"
                                    strokeDasharray={`${valConfirmed} ${circ - valConfirmed}`}
                                    strokeDashoffset={offsetConfirmed}
                                    strokeLinecap="round"
                                    className="transition-all duration-500"
                                  />
                                )}

                                {/* Pending (Yellow/Amber) */}
                                {pending > 0 && (
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="35"
                                    fill="transparent"
                                    stroke="#f59e0b"
                                    strokeWidth="10"
                                    strokeDasharray={`${valPending} ${circ - valPending}`}
                                    strokeDashoffset={offsetPending}
                                    strokeLinecap="round"
                                    className="transition-all duration-500"
                                  />
                                )}

                                {/* Cancelled (Red) */}
                                {cancelled > 0 && (
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="35"
                                    fill="transparent"
                                    stroke="#ef4444"
                                    strokeWidth="10"
                                    strokeDasharray={`${valCancelled} ${circ - valCancelled}`}
                                    strokeDashoffset={offsetCancelled}
                                    strokeLinecap="round"
                                    className="transition-all duration-500"
                                  />
                                )}
                              </svg>

                              {/* Center Text */}
                              <div className="absolute text-center">
                                <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{total}</span>
                                <p className="text-[10px] uppercase font-bold text-slate-450">Bookings</p>
                              </div>
                            </div>

                            {/* Legend details */}
                            <div className="flex-1 w-full space-y-2.5 font-sans">
                              {[
                                { name: 'Completed', count: completed, pct: pctCompleted, color: 'bg-blue-500' },
                                { name: 'Confirmed', count: confirmed, pct: pctConfirmed, color: 'bg-emerald-500' },
                                { name: 'Pending Approval', count: pending, pct: pctPending, color: 'bg-amber-500' },
                                { name: 'Cancelled', count: cancelled, pct: pctCancelled, color: 'bg-red-500' }
                              ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs border-b border-slate-50 dark:border-slate-800/40 pb-1.5 last:border-0 last:pb-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                                    <span className="font-semibold text-slate-600 dark:text-slate-405">{item.name}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{item.count}</span>
                                    <span className="text-[10px] text-slate-400 font-light ml-1.5">({item.pct.toFixed(0)}%)</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </Card>

                  {/* Dynamic Progress List: Treatment Services Popularity */}
                  <Card className="p-6 space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Services Demand Breakdown</h4>
                    <div className="space-y-4 py-2">
                      {(() => {
                        const treatmentSplit = stats.treatmentSplit || [];
                        if (treatmentSplit.length === 0) {
                          return (
                            <div className="text-center text-slate-400 text-xs font-light py-16">
                              No treatment data recorded yet.
                            </div>
                          );
                        }

                        // Calculate total and max count for scaling progress bar
                        const totalTreatments = treatmentSplit.reduce((acc, curr) => acc + curr.count, 0);
                        const maxCount = Math.max(...treatmentSplit.map(t => t.count), 1);

                        // Curated colors for rank list
                        const rankColors = [
                          'from-teal-500 to-emerald-500',
                          'from-blue-500 to-indigo-500',
                          'from-purple-500 to-pink-500',
                          'from-amber-500 to-orange-500',
                          'from-slate-500 to-slate-600'
                        ];

                        return treatmentSplit.slice(0, 5).map((treatment, idx) => {
                          const percentOfMax = (treatment.count / maxCount) * 100;
                          const percentOfTotal = totalTreatments > 0 ? (treatment.count / totalTreatments) * 100 : 0;
                          const color = rankColors[idx] || 'from-brand-500 to-brand-600';

                          return (
                            <div key={treatment._id || idx} className="space-y-1">
                              <div className="flex justify-between text-xs font-sans">
                                <div className="flex items-center gap-2">
                                  <span className="h-5 w-5 bg-slate-50 dark:bg-slate-850 rounded-md flex items-center justify-center font-bold text-[10px] text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 shadow-sm">{idx + 1}</span>
                                  <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">{treatment._id || 'General Consultation'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-800 dark:text-slate-100">{treatment.count} bookings</span>
                                  <span className="text-[10px] text-slate-400">({percentOfTotal.toFixed(0)}%)</span>
                                </div>
                              </div>
                              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`}
                                  style={{ width: `${percentOfMax}%` }}
                                />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </Card>

                </div>
              </>
            )}
          </div>
        )}

        {/* APPOINTMENTS MANAGEMENT TAB */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans">
                  Appointments Registry
                </h2>
                <p className="text-slate-400 text-xs mt-0.5 font-light">
                  Approve reservation drafts or track patient attendance.
                </p>
              </div>

              <Button onClick={handleExportAppointments} variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download size={14} /> Export to CSV
              </Button>
            </div>

            {/* Filter controls */}
            <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-md">
              <form onSubmit={handleAppSearch} className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Search size={16} /></span>
                  <input
                    type="text"
                    placeholder="Search patient name..."
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-4 w-full sm:w-auto flex-wrap items-center">
                  <input
                    type="date"
                    value={appDate}
                    onChange={(e) => {
                      setAppDate(e.target.value);
                      setAppPage(1);
                    }}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
                  />
                  {appDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setAppDate('');
                        setAppPage(1);
                      }}
                      className="text-[10px] uppercase font-bold text-rose-500 hover:text-rose-705 dark:hover:text-rose-400 transition-colors"
                      title="Clear Date Filter"
                    >
                      Clear Date
                    </button>
                  )}
                  <select
                    value={appStatus}
                    onChange={(e) => {
                      setAppStatus(e.target.value);
                      setAppPage(1);
                    }}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="upcoming">Upcoming Bookings</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <Button type="submit" variant="primary" className="text-xs py-2 px-4">Search</Button>
                </div>
              </form>
            </Card>

            {loadingApps ? (
              <Loader size="lg" className="py-20" />
            ) : appointments.length === 0 ? (
              <Card className="p-12 text-center text-slate-400 text-xs font-light">
                No matching appointment bookings found.
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="p-4">Patient</th>
                        <th className="p-4">Contact</th>
                        <th className="p-4">Doctor</th>
                        <th className="p-4">Schedule</th>
                        <th className="p-4">Treatment</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {appointments.map((app) => (
                        <tr key={app._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                          <td className="p-4 font-bold text-slate-700 dark:text-slate-200">
                            {app.patientDetails.name} <br />
                            <span className="text-[10px] text-slate-400 font-normal">Age: {app.patientDetails.age} | {app.patientDetails.gender}</span>
                          </td>
                          <td className="p-4 text-slate-500">
                            {app.patientDetails.email} <br />
                            <span className="text-[10px]">{app.patientDetails.phone}</span>
                          </td>
                          <td className="p-4 font-semibold text-slate-600 dark:text-slate-300">
                            {app.doctorId?.name || 'Deleted Doctor'}
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-brand-500">{app.date}</span> <br />
                            <span className="text-[10px] text-slate-400">⏰ {app.timeSlot}</span>
                          </td>
                          <td className="p-4 font-medium text-slate-600 dark:text-slate-300">
                            {app.treatmentType}
                            {app.doctorNotes && (
                              <div className="text-[10px] text-teal-600 dark:text-teal-400 mt-1 max-w-[150px] truncate" title={app.doctorNotes}>
                                🩺 Note: {app.doctorNotes}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={getStatusBadge(app.status)}>{app.status}</span>
                          </td>
                          <td className="p-4 text-right flex justify-end gap-1.5 mt-2">
                            {app.status === 'pending' && (
                              <button
                                disabled={updatingApps[app._id]}
                                onClick={() => handleAppStatusChange(app._id, 'confirmed')}
                                className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded border border-emerald-100 dark:border-emerald-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Approve Booking"
                              >
                                {updatingApps[app._id] ? (
                                  <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                ) : (
                                  <Check size={14} />
                                )}
                              </button>
                            )}
                            {['pending', 'confirmed'].includes(app.status) && (
                              <>
                                <button
                                  disabled={updatingApps[app._id]}
                                  onClick={() => handleAppStatusChange(app._id, 'completed')}
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded border border-blue-100 dark:border-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Mark Attendance Completed"
                                >
                                  {updatingApps[app._id] ? (
                                    <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                  ) : (
                                    <CheckCircle size={14} />
                                  )}
                                </button>
                                <button
                                  disabled={updatingApps[app._id]}
                                  onClick={() => handleAppStatusChange(app._id, 'cancelled')}
                                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded border border-red-100 dark:border-red-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Cancel Appointment"
                                >
                                  {updatingApps[app._id] ? (
                                    <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                  ) : (
                                    <X size={14} />
                                  )}
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                {appPages > 1 && (
                  <div className="flex justify-between items-center text-xs pt-2">
                    <span className="text-slate-400">Page {appPage} of {appPages}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={appPage === 1}
                        onClick={() => setAppPage(appPage - 1)}
                      >
                        Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={appPage === appPages}
                        onClick={() => setAppPage(appPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PATIENT REGISTRY TAB */}
        {activeTab === 'patients' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans">
                  Patient Registry
                </h2>
                <p className="text-slate-400 text-xs mt-0.5 font-light">
                  Monitor registered patient details and block access privileges.
                </p>
              </div>
              <Button onClick={handleOpenPatModal} variant="secondary" size="sm" className="gap-1.5 text-xs font-bold">
                <Plus size={14} /> Register Walk-In Patient
              </Button>
            </div>

            <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-md">
              <form onSubmit={handlePatSearch} className="flex gap-4">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Search size={16} /></span>
                  <input
                    type="text"
                    placeholder="Search patients by name, email, phone, or NIC..."
                    value={patSearch}
                    onChange={(e) => setPatSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="primary" className="text-xs py-2 px-4">Search</Button>
                  {patSearch && (
                    <Button
                      type="button"
                      onClick={handleClearPatSearch}
                      variant="outline"
                      className="text-xs py-2 px-4 gap-1.5 flex items-center"
                    >
                      <X size={14} /> Clear
                    </Button>
                  )}
                </div>
              </form>
            </Card>

            {loadingPats ? (
              <Loader size="lg" className="py-20" />
            ) : patients.length === 0 ? (
              <Card className="p-12 text-center text-slate-400 text-xs font-light">
                No patient accounts found matching search criteria.
              </Card>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* Left Pane: Patient List */}
                <div className={`space-y-4 w-full transition-all duration-300 ${selectedPatientForHistory ? 'lg:w-[45%]' : 'lg:w-full'}`}>
                  <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="p-4">Patient Name</th>
                          {!selectedPatientForHistory && (
                            <>
                              <th className="p-4">Email</th>
                              <th className="p-4">Phone</th>
                              <th className="p-4">ID/NIC</th>
                            </>
                          )}
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                        {patients.map((pat) => {
                          const isSelected = selectedPatientForHistory?._id === pat._id;
                          return (
                            <tr
                              key={pat._id}
                              className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors ${isSelected ? 'bg-brand-50/30 dark:bg-brand-950/10 border-l-4 border-l-brand-500' : ''
                                }`}
                              onClick={() => {
                                handleSelectPatient(pat);
                              }}
                            >
                              <td className="p-4 font-bold text-slate-700 dark:text-slate-205">
                                {pat.name}
                                {selectedPatientForHistory && (
                                  <span className="block text-[10px] text-slate-400 font-light mt-0.5">{pat.email}</span>
                                )}
                              </td>
                              {!selectedPatientForHistory && (
                                <>
                                  <td className="p-4 text-slate-500">{pat.email}</td>
                                  <td className="p-4 text-slate-500">{pat.phone || 'N/A'}</td>
                                  <td className="p-4 text-slate-500">{pat.nicId || 'N/A'}</td>
                                </>
                              )}
                              <td className="p-4">
                                {pat.isBlocked ? (
                                  <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded border border-red-100 dark:border-red-900/10 uppercase tracking-wide">Blocked</span>
                                ) : (
                                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/10 uppercase tracking-wide">Active</span>
                                )}
                              </td>
                              <td className="p-4 text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleToggleBlock(pat._id)}
                                  className={`p-1.5 rounded border text-xs font-semibold ${pat.isBlocked
                                    ? 'text-emerald-500 border-emerald-100 dark:border-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                                    : 'text-red-500 border-red-100 dark:border-red-900/10 hover:bg-red-50 dark:hover:bg-red-950/20'
                                    }`}
                                >
                                  <Ban size={14} className="inline mr-1" />
                                  {pat.isBlocked ? 'Activate' : 'Block'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {patPages > 1 && (
                    <div className="flex justify-between items-center text-xs pt-2">
                      <span className="text-slate-400">Page {patPage} of {patPages}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={patPage === 1}
                          onClick={() => setPatPage(patPage - 1)}
                        >
                          Prev
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={patPage === patPages}
                          onClick={() => setPatPage(patPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Pane: Selected Patient Details & History */}
                {selectedPatientForHistory && (
                  <div className="w-full lg:w-[55%] animate-in fade-in slide-in-from-right duration-250">
                    <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-xl space-y-6 relative overflow-hidden">

                      {/* Close button */}
                      <button
                        onClick={() => setSelectedPatientForHistory(null)}
                        className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-all"
                      >
                        <X size={16} />
                      </button>

                      {/* Patient Basic Profile Info */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <div>
                          <span className="text-[10px] text-brand-500 font-bold uppercase tracking-widest">Selected Patient Profile</span>
                          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 font-sans flex items-center gap-2">
                            👤 {selectedPatientForHistory.name}
                          </h3>
                        </div>
                        <Button
                          onClick={() => handleOpenBookModal(selectedPatientForHistory)}
                          variant="secondary"
                          size="sm"
                          className="text-xs font-bold gap-1 px-3 py-2 self-start sm:self-auto"
                        >
                          <Plus size={12} /> Book Appointment
                        </Button>
                      </div>

                      {loadingHistory ? (
                        <div className="py-20 flex justify-center"><Loader size="md" /></div>
                      ) : !patientHistoryData ? (
                        <div className="p-8 text-center text-xs text-slate-400">Failed to load history details.</div>
                      ) : (
                        <>
                          {/* If a single record is not selected, show list and details */}
                          {!selectedAppointmentDetail ? (
                            <div className="space-y-6">
                              {/* Details Grid */}
                              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-xs font-semibold">
                                <div>
                                  <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Email Address</span>
                                  <span className="text-slate-800 dark:text-slate-200 font-bold block mt-0.5 break-all">{selectedPatientForHistory.email}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Phone Number</span>
                                  <span className="text-slate-800 dark:text-slate-200 font-bold block mt-0.5">{selectedPatientForHistory.phone || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 uppercase tracking-wider block text-[10px]">NIC / ID Number</span>
                                  <span className="text-slate-800 dark:text-slate-200 font-bold block mt-0.5">{selectedPatientForHistory.nicId || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Account Status</span>
                                  <span className="block mt-0.5">
                                    {selectedPatientForHistory.isBlocked ? (
                                      <span className="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded border border-red-100 dark:border-red-900/10 uppercase tracking-wide">Blocked</span>
                                    ) : (
                                      <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/10 uppercase tracking-wide">Active</span>
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Stats Counters */}
                              <div className="grid grid-cols-3 gap-2.5">
                                {[
                                  { label: 'Visits', value: patientHistoryData.stats.completed, color: 'text-blue-500 bg-blue-50/50 dark:bg-blue-950/10 border-blue-100' },
                                  { label: 'Confirmed', value: patientHistoryData.stats.confirmed, color: 'text-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100' },
                                  { label: 'Pending', value: patientHistoryData.stats.pending, color: 'text-amber-500 bg-amber-50/50 dark:bg-amber-950/10 border-amber-100' }
                                ].map((stat, idx) => (
                                  <div key={idx} className={`p-2.5 rounded-xl border text-center ${stat.color}`}>
                                    <span className="text-[9px] font-bold uppercase tracking-wider block opacity-75">{stat.label}</span>
                                    <span className="text-lg font-black mt-0.5 block">{stat.value}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Appointments Table */}
                              <div className="space-y-2.5">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 dark:border-slate-800 pb-2">
                                  Appointment History <span className="text-[10px] text-slate-400 font-light normal-case ml-1">(Click row to inspect record details)</span>
                                </h4>

                                {patientHistoryData.appointments.length === 0 ? (
                                  <p className="text-center py-6 text-xs text-slate-400 font-light italic">No booked appointments found.</p>
                                ) : (
                                  <div className="overflow-hidden border border-slate-100 dark:border-slate-800/80 rounded-xl shadow-sm bg-white dark:bg-slate-900">
                                    <table className="w-full text-left text-xs border-collapse">
                                      <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                                          <th className="p-3">Schedule</th>
                                          <th className="p-3">Doctor</th>
                                          <th className="p-3">Treatment</th>
                                          <th className="p-3">Status</th>
                                          <th className="p-3">Payment</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                                        {patientHistoryData.appointments.map((app) => (
                                          <tr
                                            key={app._id}
                                            onClick={() => setSelectedAppointmentDetail(app)}
                                            className="hover:bg-brand-50/20 dark:hover:bg-brand-950/5 cursor-pointer transition-colors"
                                          >
                                            <td className="p-3">
                                              <span className="font-bold text-slate-700 dark:text-slate-200">{app.date}</span>
                                              <span className="block text-[10px] text-slate-400 mt-0.5">⏰ {app.timeSlot}</span>
                                            </td>
                                            <td className="p-3 font-semibold text-slate-600 dark:text-slate-350">
                                              {app.doctorId?.name || 'Deleted Doctor'}
                                            </td>
                                            <td className="p-3 text-slate-500 font-medium">{app.treatmentType}</td>
                                            <td className="p-3">
                                              <span className={getStatusBadge(app.status)}>{app.status}</span>
                                            </td>
                                            <td className="p-3">
                                              {app.paymentDetails && app.paymentDetails.method ? (
                                                <div>
                                                  <span className="font-semibold text-teal-650 dark:text-teal-400">LKR {app.paymentDetails.amount.toLocaleString()}</span>
                                                  <span className="block text-[9px] text-slate-400 mt-0.5">{app.paymentDetails.method}</span>
                                                </div>
                                              ) : (
                                                <span className="text-slate-400 italic font-light">-</span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            /* Sub-detail: Clicked Appointment Record view */
                            <div className="space-y-5 animate-in zoom-in-95 duration-200">
                              <button
                                onClick={() => setSelectedAppointmentDetail(null)}
                                className="flex items-center gap-1.5 text-xs font-bold text-brand-500 hover:text-brand-650 transition-colors uppercase tracking-wider"
                              >
                                <span>←</span> Back to Visit History
                              </button>

                              <div className="p-5 border border-slate-150 dark:border-slate-800 rounded-2xl bg-slate-50/40 dark:bg-slate-950/20 space-y-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Appointment ID</span>
                                    <span className="text-xs font-mono text-slate-500">{selectedAppointmentDetail._id}</span>
                                  </div>
                                  <span className={getStatusBadge(selectedAppointmentDetail.status)}>{selectedAppointmentDetail.status}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xs font-semibold font-sans">
                                  <div>
                                    <span className="text-slate-400 uppercase tracking-wider text-[9px] block">Specialist Doctor</span>
                                    <span className="text-slate-800 dark:text-slate-200 block mt-0.5 font-bold">🩺 {selectedAppointmentDetail.doctorId?.name || 'Deleted Doctor'}</span>
                                    <span className="text-[10px] text-slate-450 block font-light">{selectedAppointmentDetail.doctorId?.qualification}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 uppercase tracking-wider text-[9px] block">Scheduled Booking</span>
                                    <span className="text-slate-850 dark:text-slate-200 block mt-0.5 font-bold">📅 {selectedAppointmentDetail.date}</span>
                                    <span className="text-[10px] text-slate-450 block font-light">⏰ {selectedAppointmentDetail.timeSlot}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 uppercase tracking-wider text-[9px] block">Treatment Type</span>
                                    <span className="text-slate-800 dark:text-slate-200 block mt-0.5 font-bold">{selectedAppointmentDetail.treatmentType}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 uppercase tracking-wider text-[9px] block">Emergency Level</span>
                                    <span className="block mt-1">
                                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold capitalize border ${selectedAppointmentDetail.emergencyLevel === 'high' ? 'bg-red-50 text-red-500 border-red-100 dark:bg-red-950/20' :
                                        selectedAppointmentDetail.emergencyLevel === 'medium' ? 'bg-amber-50 text-amber-500 border-amber-100 dark:bg-amber-950/20' :
                                          'bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-850/50'
                                        }`}>
                                        {selectedAppointmentDetail.emergencyLevel}
                                      </span>
                                    </span>
                                  </div>
                                </div>

                                {selectedAppointmentDetail.symptoms && (
                                  <div className="space-y-1">
                                    <span className="text-slate-400 uppercase tracking-wider text-[9px] block">Symptoms & Patient Notes</span>
                                    <blockquote className="p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl text-xs text-slate-650 dark:text-slate-400 leading-relaxed italic relative">
                                      "{selectedAppointmentDetail.symptoms}"
                                    </blockquote>
                                  </div>
                                )}

                                {selectedAppointmentDetail.attachment && (
                                  <div className="space-y-1">
                                    <span className="text-slate-400 uppercase tracking-wider text-[9px] block">Attached Medical Image / X-Ray</span>
                                    <div className="mt-1 flex justify-center border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 rounded-xl">
                                      <img src={selectedAppointmentDetail.attachment} alt="Attached medical file" className="max-h-60 w-auto object-contain rounded-lg" />
                                    </div>
                                  </div>
                                )}

                                {selectedAppointmentDetail.paymentDetails && selectedAppointmentDetail.paymentDetails.method && (
                                  <div className="p-3 bg-teal-50/50 dark:bg-teal-950/10 border border-teal-100 dark:border-teal-900/30 rounded-xl space-y-1">
                                    <span className="text-teal-650 dark:text-teal-400 uppercase tracking-wider text-[9px] block font-bold">Payment Details</span>
                                    <div className="grid grid-cols-2 text-xs font-semibold">
                                      <div>
                                        <span className="text-slate-400 text-[10px] block">Method:</span>
                                        <span className="text-slate-800 dark:text-slate-200">{selectedAppointmentDetail.paymentDetails.method}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 text-[10px] block">Amount Paid:</span>
                                        <span className="text-teal-600 dark:text-teal-400 font-bold">LKR {selectedAppointmentDetail.paymentDetails.amount.toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Inline Actions for the specific record */}
                                {['pending', 'confirmed'].includes(selectedAppointmentDetail.status) && (
                                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                                    {selectedAppointmentDetail.status === 'pending' && (
                                      <Button
                                        variant="primary"
                                        size="xs"
                                        isLoading={updatingApps[selectedAppointmentDetail._id]}
                                        onClick={() => handleAppStatusChange(selectedAppointmentDetail._id, 'confirmed')}
                                        className="text-[10px]"
                                      >
                                        Approve Booking
                                      </Button>
                                    )}
                                    <Button
                                      variant="secondary"
                                      size="xs"
                                      isLoading={updatingApps[selectedAppointmentDetail._id]}
                                      onClick={() => handleOpenCompletionModal(selectedAppointmentDetail)}
                                      className="text-[10px]"
                                    >
                                      Mark Completed
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="xs"
                                      isLoading={updatingApps[selectedAppointmentDetail._id]}
                                      onClick={() => handleAppStatusChange(selectedAppointmentDetail._id, 'cancelled')}
                                      className="text-[10px] text-rose-500 border-rose-100 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                    >
                                      Cancel Booking
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </Card>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {/* CLINIC DOCTORS CRUD TAB */}
        {activeTab === 'doctors' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans">
                  Specialist Doctors Registry
                </h2>
                <p className="text-slate-400 text-xs mt-0.5 font-light">
                  Add new doctors or edit availability shifts.
                </p>
              </div>
              <Button onClick={() => handleOpenDocModal()} variant="secondary" size="sm" className="gap-1.5 text-xs">
                <Plus size={14} /> Add Doctor
              </Button>
            </div>

            {loadingDocs ? (
              <Loader size="lg" className="py-20" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {doctors.map((doc) => (
                  <Card key={doc._id} className="p-5 flex items-start justify-between border border-slate-100 dark:border-slate-800">
                    <div className="flex gap-4">
                      <img
                        src={doc.profileImage || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150&h=150'}
                        alt={doc.name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shadow-sm"
                      />
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base">
                          {doc.name}
                        </h4>
                        <p className="text-xs text-slate-400">{doc.qualification} | {doc.experience} Years Exp</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleOpenDocModal(doc)}
                        className="p-1.5 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/20 border border-brand-100 dark:border-brand-900/10 rounded"
                        title="Edit Doctor Details"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(doc._id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-100 dark:border-red-900/10 rounded"
                        title="Remove Doctor"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MESSAGE INBOX TAB */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans">
                Contact Messages Inbox
              </h2>
              <p className="text-slate-400 text-xs mt-0.5 font-light">
                Review user inquiries submitted from the website form.
              </p>
            </div>

            {loadingInqs ? (
              <Loader size="lg" className="py-20" />
            ) : inquiries.length === 0 ? (
              <Card className="p-12 text-center text-slate-400 text-xs font-light">
                No contact inquiry messages found.
              </Card>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inq) => (
                  <Card key={inq._id} className="p-5 space-y-4 border border-slate-100 dark:border-slate-800/80">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium">Submitted: {new Date(inq.createdAt).toLocaleString()}</span>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                          {inq.subject}
                        </h4>
                        <p className="text-xs text-slate-400">
                          From: <strong className="text-slate-600 dark:text-slate-300">{inq.name}</strong> ({inq.email}) {inq.phone && `| Phone: ${inq.phone}`}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {inq.status === 'unread' && (
                          <button
                            onClick={() => handleMarkRead(inq._id)}
                            className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded border border-amber-100 dark:border-amber-900/10 uppercase"
                          >
                            Mark Read
                          </button>
                        )}
                        <Button
                          onClick={() => handleOpenReplyModal(inq)}
                          variant="secondary"
                          className="text-[10px] px-3 py-1.5"
                        >
                          <Mail size={12} className="inline mr-1" />
                          {inq.status === 'replied' ? 'Sent Again' : 'Reply'}
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-lg text-xs leading-relaxed text-slate-600 dark:text-slate-400 italic">
                      "{inq.message}"
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AUDIT LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans">
                Security Audit Logs
              </h2>
              <p className="text-slate-400 text-xs mt-0.5 font-light">
                Track administrator action logs for auditing security changes.
              </p>
            </div>

            {loadingLogs ? (
              <Loader size="lg" className="py-20" />
            ) : logs.length === 0 ? (
              <Card className="p-12 text-center text-slate-400 text-xs font-light">
                No system audit logs found.
              </Card>
            ) : (
              <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-md">
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div key={log._id} className="text-xs flex justify-between items-start py-3 border-b border-slate-100 dark:border-slate-800/50 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-700 dark:text-slate-200">
                          <span className="font-bold text-brand-500 uppercase tracking-wider text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mr-2">{log.action}</span>
                          {log.details}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          By: {log.adminId?.name} ({log.adminId?.email}) | IP: {log.ipAddress}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ADMIN SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-250">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans">
                Admin Settings
              </h2>
              <p className="text-slate-400 text-xs mt-0.5 font-light">
                Configure your administrator profile credentials and security settings.
              </p>
            </div>

            <Card className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <span className="text-xl">🔒</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Change Account Password</h4>
                  <p className="text-[10px] text-slate-400 font-light mt-0.5">
                    It is recommended to update your security password regularly.
                  </p>
                </div>
              </div>

              <form onSubmit={handlePasswordChangeSubmit} className="space-y-5" autoComplete="off">
                <Input
                  label="Current Password"
                  id="current-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={settingsForm.currentPassword}
                  onChange={(e) => setSettingsForm({ ...settingsForm, currentPassword: e.target.value })}
                />

                <Input
                  label="New Password"
                  id="new-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={settingsForm.newPassword}
                  onChange={(e) => setSettingsForm({ ...settingsForm, newPassword: e.target.value })}
                  helperText="Must be at least 6 characters and contain at least one uppercase letter, one lowercase letter, and one number."
                />

                <Input
                  label="Confirm New Password"
                  id="confirm-new-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={settingsForm.confirmPassword}
                  onChange={(e) => setSettingsForm({ ...settingsForm, confirmPassword: e.target.value })}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full sm:w-auto text-xs px-6 py-2.5 font-bold"
                    isLoading={isUpdatingPassword}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

      </main>

      {/* DOCTOR CRUD DIALOG MODAL */}
      <Modal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        title={editingDoc ? `Edit Doctor Details - ${editingDoc.name}` : 'Register New Clinic Doctor'}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDocModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="doc-form" variant="primary" size="sm">
              {editingDoc ? 'Save Changes' : 'Register Doctor'}
            </Button>
          </div>
        }
      >
        <form id="doc-form" onSubmit={handleDocSubmit} className="space-y-4">
          <Input
            label="Doctor Name"
            id="doc-name"
            required
            value={docForm.name}
            onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Qualifications (e.g. DDS, DMD, MD)"
              id="doc-qual"
              required
              value={docForm.qualification}
              onChange={(e) => setDocForm({ ...docForm, qualification: e.target.value })}
            />
            <Input
              label="Experience (in Years)"
              id="doc-exp"
              type="number"
              required
              value={docForm.experience}
              onChange={(e) => setDocForm({ ...docForm, experience: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Profile Image Link URL"
            id="doc-img"
            value={docForm.profileImage}
            placeholder="Unsplash link or base64 placeholder"
            onChange={(e) => setDocForm({ ...docForm, profileImage: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Doctor Bio / Description
            </label>
            <textarea
              rows={3}
              value={docForm.bio}
              onChange={(e) => setDocForm({ ...docForm, bio: e.target.value })}
              placeholder="Brief professional profile bio..."
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Working Days & Availability
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                const isChecked = !!(docForm.availability && docForm.availability[day] && docForm.availability[day].length > 0);

                const handleDayChange = (e) => {
                  const checked = e.target.checked;
                  const newAvail = { ...docForm.availability };
                  if (checked) {
                    const isWeekend = day === 'saturday' || day === 'sunday';
                    const weekdaySlots = ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'];
                    const weekendSlots = [
                      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
                      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
                      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
                      '18:00', '18:30', '19:00', '19:30'
                    ];
                    newAvail[day] = isWeekend ? weekendSlots : weekdaySlots;
                  } else {
                    delete newAvail[day];
                  }
                  setDocForm({ ...docForm, availability: newAvail });
                };

                return (
                  <label key={day} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer capitalize">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={handleDayChange}
                      className="rounded border-slate-200 dark:border-slate-800 text-brand-500 focus:ring-brand-500/20"
                    />
                    {day}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-405 uppercase tracking-wider mb-2">
              Performed Services & Treatments
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-850 max-h-48 overflow-y-auto pr-1">
              {CLINIC_SERVICES.map((service) => {
                const isChecked = !!(docForm.services && docForm.services.includes(service));

                const handleServiceChange = (e) => {
                  const checked = e.target.checked;
                  let newServices = [...(docForm.services || [])];
                  if (checked) {
                    newServices.push(service);
                  } else {
                    newServices = newServices.filter((s) => s !== service);
                  }
                  setDocForm({ ...docForm, services: newServices });
                };

                return (
                  <label key={service} className="flex items-start gap-2 text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={handleServiceChange}
                      className="rounded border-slate-200 dark:border-slate-800 text-brand-500 focus:ring-brand-500/20 mt-0.5"
                    />
                    <span>{service}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>

      {/* INQUIRY MOCKUP RESPONSE MODAL */}
      <Modal
        isOpen={replyModalOpen}
        onClose={() => setReplyModalOpen(false)}
        title={activeInquiry ? `Email Reply: ${activeInquiry.email}` : 'Inquiry Response'}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setReplyModalOpen(false)}>Close</Button>
            <Button variant="secondary" size="sm" isLoading={isSendingReply} onClick={handleSendReply}>
              Send Simulated Email
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200/50 text-xs">
            <p><strong>To:</strong> {activeInquiry?.name} ({activeInquiry?.email})</p>
            <p className="mt-1"><strong>Regarding:</strong> {activeInquiry?.subject}</p>
            <p className="mt-2 text-slate-400 italic">"${activeInquiry?.message}"</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Reply Message Body
            </label>
            <textarea
              rows={5}
              placeholder="Type email reply response message here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/20"
            />
          </div>
        </div>
      </Modal>

      {/* PATIENT HISTORY MODAL */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={selectedPatientForHistory ? `Patient History & Medical Records - ${selectedPatientForHistory.name}` : 'Patient History'}
        footer={
          <Button variant="outline" size="sm" onClick={() => setHistoryModalOpen(false)}>Close</Button>
        }
      >
        {loadingHistory ? (
          <Loader size="md" className="py-20" />
        ) : !patientHistoryData ? (
          <p className="text-center text-xs text-slate-400">Failed to load history data.</p>
        ) : (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">

            {/* Patient profile details card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-semibold">
              <div>
                <span className="text-slate-400 uppercase tracking-wider block">Email Address</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold block mt-0.5 break-all">{selectedPatientForHistory?.email}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase tracking-wider block">Phone Number</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold block mt-0.5">{selectedPatientForHistory?.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase tracking-wider block">NIC / ID Number</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold block mt-0.5">{selectedPatientForHistory?.nicId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase tracking-wider block">Status</span>
                <span className="block mt-0.5">
                  {selectedPatientForHistory?.isBlocked ? (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded border border-red-100 dark:border-red-900/10 uppercase tracking-wide">Blocked</span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/10 uppercase tracking-wide">Active</span>
                  )}
                </span>
              </div>
            </div>

            {/* Visit Statistics Counters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Total Bookings', value: patientHistoryData.stats.total, color: 'text-brand-500 bg-brand-50/50 dark:bg-brand-950/10 border-brand-100' },
                { label: 'Completed Visits', value: patientHistoryData.stats.completed, color: 'text-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100' },
                { label: 'Cancelled', value: patientHistoryData.stats.cancelled, color: 'text-red-500 bg-red-50/50 dark:bg-red-950/10 border-red-100' },
                { label: 'Confirmed', value: patientHistoryData.stats.confirmed, color: 'text-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-100' },
                { label: 'Pending Approval', value: patientHistoryData.stats.pending, color: 'text-amber-500 bg-amber-50/50 dark:bg-amber-950/10 border-amber-100' }
              ].map((stat, idx) => (
                <div key={idx} className={`p-3 rounded-xl border text-center ${stat.color}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">{stat.label}</span>
                  <span className="text-xl font-black mt-1 block">{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Detailed appointments list */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                Visits & Appointments History
              </h4>

              {patientHistoryData.appointments.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400 font-light italic">This patient has no recorded appointment history.</p>
              ) : (
                <div className="overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="p-3">Schedule</th>
                          <th className="p-3">Doctor</th>
                          <th className="p-3">Treatment</th>
                          <th className="p-3">Severity</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Payment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                        {patientHistoryData.appointments.map((app) => (
                          <tr key={app._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                            <td className="p-3">
                              <span className="font-bold text-slate-700 dark:text-slate-200">{app.date}</span>
                              <span className="block text-[10px] text-slate-400">⏰ {app.timeSlot}</span>
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-slate-600 dark:text-slate-350">{app.doctorId?.name || 'Deleted Doctor'}</span>
                            </td>
                            <td className="p-3 font-medium text-slate-500">
                              {app.treatmentType}
                              {app.symptoms && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal italic mt-0.5 max-w-xs truncate" title={app.symptoms}>
                                  "{app.symptoms}"
                                </p>
                              )}
                              {app.doctorNotes && (
                                <p className="text-[10px] text-teal-650 dark:text-teal-400 font-semibold mt-0.5 max-w-xs truncate" title={app.doctorNotes}>
                                  🩺 Note: "{app.doctorNotes}"
                                </p>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold capitalize ${app.emergencyLevel === 'high' ? 'bg-red-50 text-red-500 border border-red-100 dark:bg-red-950/20' :
                                app.emergencyLevel === 'medium' ? 'bg-amber-50 text-amber-500 border border-amber-100 dark:bg-amber-950/20' :
                                  'bg-slate-50 text-slate-400 border border-slate-100 dark:bg-slate-850'
                                }`}>
                                {app.emergencyLevel}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={getStatusBadge(app.status)}>{app.status}</span>
                            </td>
                            <td className="p-3">
                              {app.paymentDetails && app.paymentDetails.method ? (
                                <div>
                                  <span className="font-semibold text-teal-650 dark:text-teal-400">LKR {app.paymentDetails.amount.toLocaleString()}</span>
                                  <span className="block text-[9px] text-slate-400 mt-0.5">{app.paymentDetails.method}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic font-light">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </Modal>

      {/* PENDING APPOINTMENTS ALERT MODAL */}
      <Modal
        isOpen={showNewAppsPopup}
        onClose={() => setShowNewAppsPopup(false)}
        title="Pending Appointments Alert"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowNewAppsPopup(false)}>Dismiss</Button>
            <Button variant="primary" size="sm" onClick={handleReviewPending}>Review Requests</Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center p-4 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl animate-pulse" />
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/40 text-amber-500 border border-amber-200 dark:border-amber-900/40 rounded-full flex items-center justify-center relative z-10">
              <Clock size={32} className="animate-[bounce_2s_infinite]" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-sans">
              New Appointment Requests
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              There are currently <strong className="text-amber-500 font-extrabold">{pendingAppsCount}</strong> booking request(s) awaiting your validation.
            </p>
          </div>
        </div>
      </Modal>

      {/* FINALIZE APPOINTMENT & PAYMENT MODAL */}
      <Modal
        isOpen={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        title="Finalize Appointment & Payment"
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="outline" size="sm" onClick={() => setCompletionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isCompleting} onClick={handleCompleteSubmit}>
              Complete Appointment
            </Button>
          </div>
        }
      >
        {appointmentToComplete && (
          <div className="space-y-6">
            {/* Appointment Info (Non-editable) */}
            <div className="p-5 border border-slate-150 dark:border-slate-800 rounded-2xl bg-slate-50/40 dark:bg-slate-950/20 space-y-4">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Appointment ID</span>
                <span className="text-xs font-mono text-slate-500">{appointmentToComplete._id}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold font-sans">
                <div>
                  <span className="text-slate-400 uppercase tracking-wider text-[9px] block">Specialist Doctor</span>
                  <span className="text-slate-800 dark:text-slate-200 block mt-0.5 font-bold">🩺 {appointmentToComplete.doctorId?.name || 'Deleted Doctor'}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider text-[9px] block">Scheduled Booking</span>
                  <span className="text-slate-850 dark:text-slate-200 block mt-0.5 font-bold">📅 {appointmentToComplete.date}</span>
                  <span className="text-[10px] text-slate-450 block font-light">⏰ {appointmentToComplete.timeSlot}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider text-[9px] block">Treatment Type</span>
                  <span className="text-slate-800 dark:text-slate-200 block mt-0.5 font-bold">{appointmentToComplete.treatmentType}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider text-[9px] block">Emergency Level</span>
                  <span className="block mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold capitalize border ${appointmentToComplete.emergencyLevel === 'high' ? 'bg-red-50 text-red-500 border-red-100 dark:bg-red-950/20' :
                      appointmentToComplete.emergencyLevel === 'medium' ? 'bg-amber-50 text-amber-500 border-amber-100 dark:bg-amber-950/20' :
                        'bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-850/50'
                      }`}>
                      {appointmentToComplete.emergencyLevel}
                    </span>
                  </span>
                </div>
              </div>

              {appointmentToComplete.symptoms && (
                <div className="space-y-1">
                  <span className="text-slate-400 uppercase tracking-wider text-[9px] block">Symptoms & Patient Notes</span>
                  <blockquote className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl text-xs text-slate-650 dark:text-slate-400 leading-relaxed italic">
                    "{appointmentToComplete.symptoms}"
                  </blockquote>
                </div>
              )}
            </div>

            {/* Payment details (Editable) */}
            <div className="p-4 bg-teal-50/30 dark:bg-teal-950/10 border border-teal-100 dark:border-teal-900/30 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                💳 Payment Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="By Cash">By Cash</option>
                    <option value="By Card">By Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Payment Amount (LKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1500"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Doctor's notes field */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                🩺 Doctor's Notes (Prescriptions, Recommendations & Visit Notes)
              </label>
              <textarea
                rows={4}
                placeholder="Enter patient prescriptions, treatment details, or follow-up recommendations here..."
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Image / X-Ray Attachment Field */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                🖼️ Upload Medical Image / X-Ray (Max 2MB)
              </label>
              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    if (file.size > 2 * 1024 * 1024) {
                      setAttachmentError('Image size must be less than 2MB');
                      setAttachment('');
                      addToast('Image size must be less than 2MB', 'error');
                      return;
                    }

                    setAttachmentError('');
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setAttachment(reader.result);
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="w-full text-xs text-slate-500 dark:text-slate-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-xs file:font-semibold
                    file:bg-brand-50 file:text-brand-700
                    dark:file:bg-slate-800 dark:file:text-brand-400
                    hover:file:bg-brand-100 dark:hover:file:bg-slate-700
                    cursor-pointer"
                />
                {attachmentError && (
                  <p className="text-[10px] font-bold text-rose-500">{attachmentError}</p>
                )}
                {attachment && (
                  <div className="relative mt-2 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 flex items-center justify-between">
                    <img src={attachment} alt="Preview" className="h-20 w-auto object-contain rounded" />
                    <button
                      type="button"
                      onClick={() => {
                        setAttachment('');
                        setAttachmentError('');
                      }}
                      className="p-1 text-xs font-bold text-rose-500 hover:bg-rose-55 dark:hover:bg-rose-950/20 border border-rose-100 rounded transition-all"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* REGISTER WALK-IN PATIENT MODAL */}
      <Modal
        isOpen={patModalOpen}
        onClose={() => setPatModalOpen(false)}
        title="Register Walk-In Patient"
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="outline" size="sm" onClick={() => setPatModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="pat-form" variant="primary" size="sm" isLoading={isSubmittingPatient}>
              Register Patient
            </Button>
          </div>
        }
      >
        <form id="pat-form" onSubmit={handlePatSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              id="pat-name"
              required
              value={patForm.name}
              onChange={(e) => setPatForm({ ...patForm, name: e.target.value })}
            />
            <Input
              label="Email Address"
              id="pat-email"
              type="email"
              required
              value={patForm.email}
              onChange={(e) => setPatForm({ ...patForm, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              id="pat-phone"
              value={patForm.phone}
              onChange={(e) => setPatForm({ ...patForm, phone: e.target.value })}
            />
            <Input
              label="NIC / National ID"
              id="pat-nicId"
              value={patForm.nicId}
              onChange={(e) => setPatForm({ ...patForm, nicId: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              id="pat-dob"
              type="date"
              value={patForm.dob}
              onChange={(e) => setPatForm({ ...patForm, dob: e.target.value })}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-405 uppercase tracking-wider mb-1.5">
                Gender
              </label>
              <select
                id="pat-gender"
                value={patForm.gender}
                onChange={(e) => setPatForm({ ...patForm, gender: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/20"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <Input
            label="Residential Address"
            id="pat-address"
            value={patForm.address}
            onChange={(e) => setPatForm({ ...patForm, address: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Login Password"
              id="pat-password"
              required
              value={patForm.password}
              onChange={(e) => setPatForm({ ...patForm, password: e.target.value })}
              helperText="Prefilled default: Avenue@2026"
            />
            <div className="flex items-end pb-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs py-2.5 font-bold"
                onClick={() => {
                  const chars = 'abcdefghijklmnopqrstuvwxyz';
                  const caps = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                  const nums = '0123456789';
                  const rChar = () => chars[Math.floor(Math.random() * chars.length)];
                  const rCap = () => caps[Math.floor(Math.random() * caps.length)];
                  const rNum = () => nums[Math.floor(Math.random() * nums.length)];
                  const generated = `Avenue@${rCap()}${rChar()}${rNum()}${rNum()}`;
                  setPatForm({ ...patForm, password: generated });
                }}
              >
                Auto-Generate Strong Password
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-405 uppercase tracking-wider mb-1.5">
              Medical History Notes / Remarks
            </label>
            <textarea
              rows={3}
              value={patForm.medicalNotes}
              onChange={(e) => setPatForm({ ...patForm, medicalNotes: e.target.value })}
              placeholder="e.g. History of diabetes, allergies to penicillin, previous crown treatments..."
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/20"
            />
          </div>
        </form>
      </Modal>

      {/* BOOK APPOINTMENT FOR PATIENT MODAL */}
      <Modal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        title={`Book Appointment - ${bookForm.patientName}`}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="outline" size="sm" onClick={() => setBookModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="book-form" variant="primary" size="sm" isLoading={isBookingPatient}>
              Book Appointment
            </Button>
          </div>
        }
      >
        <form id="book-form" onSubmit={handleBookSubmit} className="space-y-4">
          {/* Patient summary badge */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-xs space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Patient Overview</span>
            <div className="flex justify-between items-center font-semibold text-slate-700 dark:text-slate-300">
              <span>{bookForm.patientName} ({bookForm.patientGender || 'Gender: N/A'})</span>
              <span className="text-slate-400">Email: {bookForm.patientEmail}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-455 uppercase tracking-wider mb-1.5">
                Treatment Type <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={bookForm.treatmentType}
                onChange={(e) => {
                  const selectedTreatment = e.target.value;
                  let newDocId = bookForm.doctorId;
                  if (selectedTreatment && newDocId) {
                    const doc = doctors.find(d => d._id === newDocId);
                    if (doc && (!doc.services || !doc.services.includes(selectedTreatment))) {
                      newDocId = '';
                    }
                  } else {
                    newDocId = '';
                  }
                  setBookForm({ ...bookForm, treatmentType: selectedTreatment, doctorId: newDocId, timeSlot: '' });
                }}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/20"
              >
                <option value="">Select Treatment</option>
                <option value="Dental check up">Dental check up</option>
                <option value="Restorations( Tooth coloured Fillings)">Restorations( Tooth coloured Fillings)</option>
                <option value="Tooth Extraction">Tooth Extraction</option>
                <option value="Root canal Treatment">Root canal Treatment</option>
                <option value="Dental implants">Dental implants</option>
                <option value="Complete & partial Dentures">Complete & partial Dentures</option>
                <option value="Crown and Bridges">Crown and Bridges</option>
                <option value="Orthodontic treatment">Orthodontic treatment</option>
                <option value="Clear aligner treatments">Clear aligner treatments</option>
                <option value="Full mouth scaling & polishing,whitening">Full mouth scaling & polishing,whitening</option>
                <option value="Paediatric dental treatment">Paediatric dental treatment</option>
                <option value="Oral & Maxillofacial surgery (minor oral surgeries)">Oral & Maxillofacial surgery (minor oral surgeries)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-405 uppercase tracking-wider mb-1.5">
                Select Specialist Doctor <span className="text-rose-500">*</span>
              </label>
              <select
                required
                disabled={!bookForm.treatmentType}
                value={bookForm.doctorId}
                onChange={(e) => setBookForm({ ...bookForm, doctorId: e.target.value, timeSlot: '' })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/20 disabled:opacity-50"
              >
                <option value="">{bookForm.treatmentType ? "Select Doctor" : "Select Treatment First"}</option>
                {(bookForm.treatmentType ? doctors.filter(doc => doc.services && doc.services.includes(bookForm.treatmentType)) : []).map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    {doc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Patient Age"
              id="book-age"
              type="number"
              required
              value={bookForm.patientAge}
              onChange={(e) => setBookForm({ ...bookForm, patientAge: e.target.value })}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">
                Select Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={bookForm.date}
                onChange={(e) => setBookForm({ ...bookForm, date: e.target.value, timeSlot: '' })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Time slot selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Choose Available Time Slot <span className="text-rose-500">*</span>
            </label>

            {!bookForm.doctorId || !bookForm.date ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center font-medium">
                Please select both a doctor and date to check slot availability.
              </p>
            ) : loadingSlots ? (
              <div className="flex justify-center p-4"><Loader size="sm" /></div>
            ) : availableSlots.length === 0 ? (
              <p className="text-xs text-rose-500 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/10 p-4 rounded-xl text-center font-bold">
                Doctor is unavailable or closed on this date.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                {availableSlots.map((slot) => {
                  const isSelected = bookForm.timeSlot === slot.timeSlot;
                  const isDisabled = slot.status !== 'green';
                  return (
                    <button
                      key={slot.timeSlot}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setBookForm({ ...bookForm, timeSlot: slot.timeSlot })}
                      className={`py-2 px-3 border rounded-xl font-bold text-xs transition-all duration-200 text-center ${isSelected
                          ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/15'
                          : isDisabled
                            ? 'bg-slate-100 dark:bg-slate-900 text-slate-350 dark:text-slate-600 border-slate-150 dark:border-slate-800 cursor-not-allowed opacity-50'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-brand-500 cursor-pointer'
                        }`}
                    >
                      {slot.timeSlot}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">
                Emergency Severity Level
              </label>
              <select
                value={bookForm.emergencyLevel}
                onChange={(e) => setBookForm({ ...bookForm, emergencyLevel: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-4 animate-all"
              >
                <option value="low">Low (Standard Checkup)</option>
                <option value="medium">Medium (Aching / discomfort)</option>
                <option value="high">High (Severe pain / Swelling)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">
                Communication Channel
              </label>
              <select
                value={bookForm.preferredCommunication}
                onChange={(e) => setBookForm({ ...bookForm, preferredCommunication: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-4 animate-all"
              >
                <option value="email">Email Notification</option>
                <option value="phone">Direct Phone Call</option>
                <option value="sms">SMS Text Alert</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-405 uppercase tracking-wider mb-1.5">
              Symptoms / Remarks
            </label>
            <textarea
              rows={2}
              value={bookForm.symptoms}
              onChange={(e) => setBookForm({ ...bookForm, symptoms: e.target.value })}
              placeholder="Brief description of patient's current symptoms..."
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-4"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
