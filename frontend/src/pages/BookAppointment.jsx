import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useForm } from 'react-hook-form';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import { Calendar, User, Clock, AlertTriangle, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';

const BookAppointment = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Extraction of pre-selected parameters if redirected from doctor profiles or reschedule requests
  const stateData = location.state || {};
  const { preSelectedDoctorId = '', preSelectedTreatment = '', rescheduleAppId = null } = stateData;

  // UI state
  const [step, setStep] = useState(1); // 1: Choose Doctor/Date/Slot, 2: Checkout Form
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(preSelectedDoctorId);
  const [selectedTreatment, setSelectedTreatment] = useState(preSelectedTreatment);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // visual booking stepper phases: 'treatment', 'doctor', 'datetime'
  const [bookingPhase, setBookingPhase] = useState(() => {
    if (rescheduleAppId || (preSelectedDoctorId && preSelectedTreatment)) {
      return 'datetime';
    }
    if (preSelectedTreatment) {
      return 'doctor';
    }
    return 'treatment';
  });

  const serviceCategories = [
    {
      title: 'Dental check up',
      icon: '🩺',
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      description: 'Check-ups, X-rays, and customized dental health plans.'
    },
    {
      title: 'Restorations( Tooth coloured Fillings)',
      icon: '💎',
      color: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
      description: 'Durable composite fillings to repair cavities seamlessly.'
    },
    {
      title: 'Tooth Extraction',
      icon: '🩹',
      color: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      description: 'Gentle extractions of decayed or problematic teeth.'
    },
    {
      title: 'Root canal Treatment',
      icon: '⚡',
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      description: 'Endodontic therapy to save infected teeth pain-free.'
    },
    {
      title: 'Dental implants',
      icon: '🔩',
      color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
      description: 'Permanent implants to substitute missing teeth.'
    },
    {
      title: 'Complete & partial Dentures',
      icon: '🦷',
      color: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
      description: 'Removable dentures to restore bite function.'
    },
    {
      title: 'Crown and Bridges',
      icon: '👑',
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      description: 'Custom porcelain crowns to fortify weak teeth.'
    },
    {
      title: 'Orthodontic treatment',
      icon: '✨',
      color: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
      description: 'Modern braces to align and correct teeth bites.'
    },
    {
      title: 'Clear aligner treatments',
      icon: '💎',
      color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      description: 'Discreet clear removable aligners to straighten teeth.'
    },
    {
      title: 'Full mouth scaling & polishing,whitening',
      icon: '💧',
      color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
      description: 'Scaling, polishing, and premium teeth whitening.'
    },
    {
      title: 'Paediatric dental treatment',
      icon: '👶',
      color: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
      description: 'Friendly, specialized dental care tailored for kids.'
    },
    {
      title: 'Oral & Maxillofacial surgery (minor oral surgeries)',
      icon: '🏥',
      color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      description: 'Surgical jaw issues, impacted teeth, and repairs.'
    }
  ];

  const filteredDoctors = selectedTreatment
    ? doctors.filter(doc => doc.services && doc.services.includes(selectedTreatment))
    : (selectedDoctor ? doctors.filter(doc => doc._id === selectedDoctor) : []);

  const getAvailableDaysArray = (doc) => {
    if (!doc || !doc.availability) return [];
    const daysOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const foundDays = [];
    const availability = doc.availability;
    for (const day of daysOrder) {
      let slots = [];
      if (typeof availability.get === 'function') {
        slots = availability.get(day);
      } else {
        slots = availability[day];
      }
      if (slots && slots.length > 0) {
        foundDays.push(day.charAt(0).toUpperCase() + day.slice(1));
      }
    }
    return foundDays;
  };

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300 seconds)
  const timerRef = useRef(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  // Fetch doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/doctors');
        if (res.success) {
          setDoctors(res.doctors);
        }
      } catch (err) {
        addToast('Failed to load doctors list.', 'error');
      }
    };
    fetchDoctors();
  }, [addToast]);

  // Fetch slots whenever doctor or date changes
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
      setSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await api.get(`/doctors/${selectedDoctor}/availability?date=${selectedDate}`);
        if (res.success) {
          setSlots(res.slots);
        }
      } catch (err) {
        addToast(err.message || 'Failed to check availability', 'error');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDoctor, selectedDate, addToast]);

  // Autofill patient details if user changes
  useEffect(() => {
    if (user) {
      reset({
        patientName: user.name,
        patientEmail: user.email,
        patientPhone: user.phone,
        patientAge: '',
        patientGender: user.gender || '',
        symptoms: '',
        emergencyLevel: 'low',
        preferredCommunication: 'email'
      });
    }
  }, [user, reset]);

  // Start checkout hold countdown
  useEffect(() => {
    if (step === 2) {
      setTimeLeft(300); // Reset timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            addToast('Your 5-minute reservation timer has expired. The slot has been released.', 'warning');
            setSelectedSlot(null);
            setStep(1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, addToast]);

  const isPatient = user?.role === 'patient';
  const isProfileComplete = !isPatient || (
    user?.name?.trim() &&
    user?.phone?.trim() &&
    user?.nicId?.trim() &&
    user?.dob &&
    user?.gender?.trim()
  );

  const profileFields = [
    { key: 'name', label: 'Full Name', value: user?.name },
    { key: 'phone', label: 'Phone Number', value: user?.phone },
    { key: 'nicId', label: 'NIC / ID Number / Passport No', value: user?.nicId },
    { key: 'dob', label: 'Date of Birth', value: user?.dob },
    { key: 'gender', label: 'Gender', value: user?.gender }
  ];

  if (!isProfileComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-200 py-12"
      >
        <div className="max-w-2xl mx-auto px-4">
          <Card className="p-8 bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 space-y-6 relative overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />
            
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/50 shadow-inner">
                <AlertTriangle size={32} className="animate-pulse" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                Patient Profile Update Required
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Before you can book dental appointments at The Dental Avenue, clinic regulations require a completed patient profile to set up your electronic medical records.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-250 dark:border-slate-800 pb-2">
                Your Profile Checklist
              </h3>
              
              <div className="space-y-2.5">
                {profileFields.map((field) => {
                  const isFieldFilled = !!field.value?.toString().trim();
                  return (
                    <div
                      key={field.key}
                      className={`flex items-center justify-between p-3 rounded-xl border text-sm font-semibold transition-all duration-300 ${
                        isFieldFilled
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/5 border-emerald-100/55 dark:border-emerald-900/10 text-emerald-800 dark:text-emerald-400'
                          : 'bg-rose-50/30 dark:bg-rose-950/5 border-rose-100/55 dark:border-rose-900/10 text-rose-850 dark:text-rose-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                          isFieldFilled
                            ? 'bg-emerald-500 text-white border-transparent'
                            : 'bg-rose-500 text-white border-transparent'
                        }`}>
                          {isFieldFilled ? '✓' : '✗'}
                        </span>
                        <span>{field.label}</span>
                      </div>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isFieldFilled
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-350'
                      }`}>
                        {isFieldFilled ? 'Completed' : 'Missing'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1 font-bold"
              >
                Go to Dashboard
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate('/dashboard', { state: { activeTab: 'profile' } })}
                className="flex-1 gap-2 font-extrabold"
              >
                Complete Profile Now <ArrowRight size={16} />
              </Button>
            </div>
          </Card>
        </div>
      </motion.div>
    );
  }

  const formatTimer = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleTreatmentSelect = (title) => {
    setSelectedTreatment(title);
    setSelectedSlot(null);
    
    if (selectedDoctor) {
      const doc = doctors.find(d => d._id === selectedDoctor);
      if (doc && (!doc.services || !doc.services.includes(title))) {
        setSelectedDoctor('');
      }
    }
    
    setBookingPhase('doctor');
  };

  const handleSlotClick = async (slot) => {
    if (slot.status === 'red') {
      addToast('This slot is fully booked and unavailable.', 'warning');
      return;
    }
    const isHeldByMe = slot.heldBy && (slot.heldBy === user?._id || slot.heldBy === user?.id);
    if (slot.status === 'yellow' && !isHeldByMe) {
      addToast('This slot is currently held by another patient checking out.', 'warning');
      return;
    }

    // Call /hold api to lock the slot
    try {
      const res = await api.post('/appointments/hold', {
        doctorId: selectedDoctor,
        date: selectedDate,
        timeSlot: slot.timeSlot
      });

      if (res.success) {
        setSelectedSlot(slot.timeSlot);
        
        // If they are rescheduling, we skip the details form because we already have their details!
        // We can just proceed to reschedule directly or prompt confirmation.
        // Let's prompt confirmation directly on step 2, or let them update notes.
        setStep(2);
      }
    } catch (err) {
      addToast(err.message || 'Failed to reserve slot. It may have just been held.', 'error');
      // Refresh slots
      // Trigger state re-fetch
      const fresh = await api.get(`/doctors/${selectedDoctor}/availability?date=${selectedDate}`);
      if (fresh.success) setSlots(fresh.slots);
    }
  };

  const handleBackClick = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedSlot(null);
    setStep(1);
  };

  const onSubmitBooking = async (data) => {
    try {
      if (rescheduleAppId) {
        // Rescheduling case
        const res = await api.put(`/appointments/${rescheduleAppId}/reschedule`, {
          date: selectedDate,
          timeSlot: selectedSlot
        });

        if (res.success) {
          addToast('Your appointment reschedule request has been approved!', 'success');
          if (timerRef.current) clearInterval(timerRef.current);
          navigate('/dashboard');
        }
      } else {
        // Normal booking case
        const payload = {
          doctorId: selectedDoctor,
          date: selectedDate,
          timeSlot: selectedSlot,
          treatmentType: selectedTreatment,
          symptoms: data.symptoms,
          emergencyLevel: data.emergencyLevel,
          preferredCommunication: data.preferredCommunication,
          patientDetails: {
            name: data.patientName,
            email: data.patientEmail,
            phone: data.patientPhone,
            age: Number(data.patientAge),
            gender: data.patientGender
          }
        };

        const res = await api.post('/appointments/book', payload);
        if (res.success) {
          addToast('Appointment booked successfully! Pending clinic confirmation.', 'success');
          if (timerRef.current) clearInterval(timerRef.current);
          navigate('/dashboard');
        }
      }
    } catch (err) {
      addToast(err.message || 'Double booking occurred. Please select another slot.', 'error');
      setSelectedSlot(null);
      setStep(1);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  
  // Calculate max booking window (e.g. 3 months from now)
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-200 py-12"
    >
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Progress Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans">
            {rescheduleAppId ? 'Reschedule Your Appointment' : 'Book a Medical Appointment'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-light uppercase tracking-widest">
            Step {step} of 2 • {step === 1 ? 'Select Time Slot' : 'Confirm Information'}
          </p>
        </div>

        {/* STEP 1: SELECT SLOT & STEPS */}
        {step === 1 && (
          <div className="space-y-6">
            
            {/* Rescheduling Mode Banner / Breadcrumbs */}
            {rescheduleAppId ? (
              <div className="p-4 bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 rounded-2xl border border-teal-100 dark:border-teal-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-sm font-bold">
                  <span className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-black">
                    ✓
                  </span>
                  <span>Rescheduling Appointment: Select New Date & Time Slot</span>
                </div>
                <span className="text-xs bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
                  Treatment & Doctor Locked
                </span>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 gap-4 shadow-sm">
                <div className="flex items-center w-full justify-between max-w-2xl mx-auto">
                  {/* Step 1: Treatment */}
                  <button
                    type="button"
                    onClick={() => setBookingPhase('treatment')}
                    className={`flex items-center gap-2 text-sm font-bold transition-all outline-none focus:outline-none ${
                      bookingPhase === 'treatment'
                        ? 'text-brand-500'
                        : selectedTreatment
                        ? 'text-emerald-500 hover:text-emerald-600'
                        : 'text-slate-400'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border transition-all ${
                      bookingPhase === 'treatment'
                        ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                        : selectedTreatment
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                        : 'border-slate-300 dark:border-slate-700 text-slate-400'
                    }`}>
                      {selectedTreatment ? '✓' : '1'}
                    </span>
                    <span>Treatment</span>
                  </button>

                  <div className="h-[2px] flex-1 bg-slate-200 dark:bg-slate-800 mx-4" />

                  {/* Step 2: Doctor */}
                  <button
                    type="button"
                    disabled={!selectedTreatment}
                    onClick={() => setBookingPhase('doctor')}
                    className={`flex items-center gap-2 text-sm font-bold transition-all outline-none focus:outline-none ${
                      bookingPhase === 'doctor'
                        ? 'text-brand-500'
                        : selectedDoctor
                        ? 'text-emerald-500 hover:text-emerald-600'
                        : selectedTreatment
                        ? 'text-slate-600 dark:text-slate-300 hover:text-brand-500'
                        : 'text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border transition-all ${
                      bookingPhase === 'doctor'
                        ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                        : selectedDoctor
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                        : 'border-slate-300 dark:border-slate-700 text-slate-400'
                    }`}>
                      {selectedDoctor ? '✓' : '2'}
                    </span>
                    <span>Doctor</span>
                  </button>

                  <div className="h-[2px] flex-1 bg-slate-200 dark:bg-slate-800 mx-4" />

                  {/* Step 3: Date & Slot */}
                  <button
                    type="button"
                    disabled={!selectedTreatment || !selectedDoctor}
                    onClick={() => setBookingPhase('datetime')}
                    className={`flex items-center gap-2 text-sm font-bold transition-all outline-none focus:outline-none ${
                      bookingPhase === 'datetime'
                        ? 'text-brand-500'
                        : selectedTreatment && selectedDoctor
                        ? 'text-slate-600 dark:text-slate-300 hover:text-brand-500'
                        : 'text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border transition-all ${
                      bookingPhase === 'datetime'
                        ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                        : 'border-slate-300 dark:border-slate-700 text-slate-400'
                    }`}>
                      3
                    </span>
                    <span>Date & Slot</span>
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 1: CHOOSE TREATMENT */}
            {bookingPhase === 'treatment' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-md">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white font-sans">Choose Dental Treatment</h2>
                    <p className="text-sm text-slate-400 mt-1 font-light">Select the primary service you wish to schedule today.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {serviceCategories.map((svc) => {
                      const isSelected = selectedTreatment === svc.title;
                      return (
                        <div
                          key={svc.title}
                          onClick={() => handleTreatmentSelect(svc.title)}
                          className={`group cursor-pointer rounded-2xl border p-5 transition-all duration-300 flex flex-col justify-between h-48 relative overflow-hidden bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/30 ${
                            isSelected
                              ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-lg dark:border-brand-500'
                              : 'border-slate-100 dark:border-slate-800/80 shadow-sm hover:border-slate-200 dark:hover:border-slate-700'
                          }`}
                        >
                          {/* Top row: Icon and Checkmark */}
                          <div className="flex justify-between items-start">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-md border ${svc.color}`}>
                              {svc.icon}
                            </div>
                            {isSelected && (
                              <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                                ✓
                              </span>
                            )}
                          </div>
                          
                          {/* Bottom info */}
                          <div className="mt-4 space-y-1">
                            <h4 className={`text-sm font-extrabold transition-colors duration-200 group-hover:text-brand-500 ${
                              isSelected ? 'text-brand-500' : 'text-slate-800 dark:text-slate-100'
                            }`}>
                              {svc.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-light leading-relaxed line-clamp-2">
                              {svc.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* PHASE 2: CHOOSE DOCTOR */}
            {bookingPhase === 'doctor' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-md">
                  <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 dark:text-white font-sans">Select Your Specialist</h2>
                      <p className="text-sm text-slate-400 mt-1 font-light">
                        Showing specialist doctors who perform <span className="font-semibold text-brand-500">{selectedTreatment}</span>.
                      </p>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBookingPhase('treatment')}
                      className="self-start sm:self-auto gap-1.5"
                    >
                      <ArrowLeft size={14} /> Back to Treatment
                    </Button>
                  </div>
                  
                  {filteredDoctors.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/80">
                      <User className="mx-auto text-slate-300 dark:text-slate-700 mb-2 animate-pulse" size={36} />
                      <p className="text-sm text-slate-400 font-medium">
                        No specialist doctors found for this treatment.
                      </p>
                      <button
                        type="button"
                        onClick={() => setBookingPhase('treatment')}
                        className="text-xs font-bold text-brand-500 hover:underline mt-2 inline-block"
                      >
                        Please choose a different treatment
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredDoctors.map((doc) => {
                        const isSelected = selectedDoctor === doc._id;
                        return (
                          <div
                            key={doc._id}
                            className={`group rounded-2xl border transition-all duration-300 overflow-hidden bg-white dark:bg-slate-900/40 flex flex-col justify-between relative ${
                              isSelected
                                ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-lg dark:border-brand-500'
                                : 'border-slate-100 dark:border-slate-800/80 shadow-sm hover:border-slate-200 dark:hover:border-slate-700'
                            }`}
                          >
                            <div className="p-5 flex gap-4">
                              {/* Doctor Image */}
                              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-inner">
                                <img
                                  src={doc.profileImage || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200&h=200'}
                                  alt={doc.name}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              </div>
                              
                              {/* Doctor Details */}
                              <div className="space-y-2 flex-1 min-w-0 flex flex-col justify-center">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <h4 className="font-extrabold text-base sm:text-lg text-slate-800 dark:text-slate-100 group-hover:text-brand-500 transition-colors truncate">
                                      {doc.name}
                                    </h4>
                                    {isSelected && (
                                      <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm shrink-0">
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                  {doc.qualification && (
                                    <p className="text-xs text-brand-500 dark:text-brand-400 font-bold truncate">
                                      {doc.qualification}
                                    </p>
                                  )}
                                </div>
                                
                                <div className="space-y-1 pt-1">
                                  <span className="text-[9px] uppercase font-extrabold tracking-widest text-slate-400 dark:text-slate-500">
                                    Available Days
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {getAvailableDaysArray(doc).map((day) => (
                                      <span
                                        key={day}
                                        className="text-[10px] font-bold bg-brand-50/85 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 border border-brand-100/50 dark:border-brand-900/30 px-2.5 py-0.5 rounded-full shadow-sm"
                                      >
                                        {day}
                                      </span>
                                    ))}
                                    {getAvailableDaysArray(doc).length === 0 && (
                                      <span className="text-[10px] text-slate-400 italic">
                                        Check calendar
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Card Footer Button */}
                            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-center gap-4">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                Scheduled availability on active days
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                variant={isSelected ? 'success' : 'primary'}
                                onClick={() => {
                                  setSelectedDoctor(doc._id);
                                  setSelectedSlot(null); // Reset selected slot since doctor changed
                                  setBookingPhase('datetime');
                                }}
                                className="font-extrabold shrink-0"
                              >
                                {isSelected ? 'Doctor Selected' : 'Choose & Continue'}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* PHASE 3: DATE & TIME SLOT PICKER */}
            {bookingPhase === 'datetime' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-md space-y-6">
                  
                  {/* Top Bar with doctor summary & back btn */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      {/* Doctor avatar indicator */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shrink-0">
                        <img
                          src={doctors.find((d) => d._id === selectedDoctor)?.profileImage || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=100&h=100'}
                          alt="Doctor"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                          {doctors.find((d) => d._id === selectedDoctor)?.name || 'Select Specialist'}
                        </h4>
                        <p className="text-xs text-brand-500 font-bold">
                          {selectedTreatment || 'Dental Treatment'}
                        </p>
                      </div>
                    </div>
                    
                    {!rescheduleAppId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBookingPhase('doctor')}
                        className="self-start sm:self-auto gap-1.5"
                      >
                        <ArrowLeft size={14} /> Back to Doctor
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Date Picker Input Card */}
                    <div className="md:col-span-1 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-4">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <Calendar size={18} className="text-brand-500" />
                        <h3 className="text-sm font-bold uppercase tracking-wider">Select Appointment Date</h3>
                      </div>
                      <Input
                        label=""
                        type="date"
                        min={todayStr}
                        max={maxDateStr}
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setSelectedSlot(null);
                        }}
                      />
                      <p className="text-[10px] text-slate-400 font-light leading-relaxed">
                        Slots are queryable up to 3 months in advance. Clinic schedule updates daily.
                      </p>
                    </div>

                    {/* Availability Slot Grid Panel */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                          <Clock size={18} className="text-brand-500" />
                          <h3 className="text-sm font-bold uppercase tracking-wider">Available Times</h3>
                        </div>
                        
                        {/* Status legends */}
                        <div className="flex gap-3 text-[10px]">
                          <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Free
                          </span>
                          <span className="flex items-center gap-1.5 text-amber-500 font-bold">
                            <span className="w-2 h-2 rounded-full bg-amber-500" /> Held
                          </span>
                          <span className="flex items-center gap-1.5 text-red-500 font-bold">
                            <span className="w-2 h-2 rounded-full bg-red-500" /> Booked
                          </span>
                        </div>
                      </div>

                      {!selectedDoctor || !selectedDate ? (
                        <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/80">
                          <Calendar className="mx-auto text-slate-300 dark:text-slate-700 mb-2 animate-bounce" size={28} />
                          <p className="text-xs text-slate-400 font-medium">
                            Please select an appointment date to query available slots.
                          </p>
                        </div>
                      ) : loadingSlots ? (
                        <Loader size="md" className="py-10" />
                      ) : slots.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/80">
                          <p className="text-xs text-red-500 font-bold">
                            No slots available or clinic closed on this day. Please choose another date.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-4 gap-2.5">
                          {slots.map((slot) => {
                            const isHeldByMe = slot.heldBy && (slot.heldBy === user?._id || slot.heldBy === user?.id);

                            const btnStyles = {
                              green: 'border-emerald-200 dark:border-emerald-900/30 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 cursor-pointer',
                              yellow: isHeldByMe
                                ? 'border-sky-300 dark:border-sky-900/30 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50 dark:bg-sky-950/10 dark:hover:bg-sky-950/20 text-sky-700 dark:text-sky-400 cursor-pointer ring-2 ring-sky-500/20'
                                : 'border-amber-200 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/5 text-amber-600 dark:text-amber-500 cursor-not-allowed opacity-60',
                              red: 'border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/5 text-red-600 dark:text-red-500 cursor-not-allowed opacity-50'
                            };

                            const isSelectable = slot.status === 'green' || isHeldByMe;

                            return (
                              <motion.button
                                key={slot.timeSlot}
                                type="button"
                                disabled={!isSelectable}
                                onClick={() => handleSlotClick(slot)}
                                whileTap={isSelectable ? { scale: 0.95 } : {}}
                                className={`py-2 px-3 border rounded-xl font-bold text-xs transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                                  btnStyles[slot.status]
                                }`}
                              >
                                <Clock size={14} className="opacity-70" />
                                {slot.timeSlot}
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        )}

        {/* STEP 2: DETAILS CONFIRMATION / FORM */}
        {step === 2 && (
          <Card className="p-8 bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 space-y-6">
            
            {/* Timer Banner */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 rounded-xl border border-amber-100 dark:border-amber-950 flex justify-between items-center">
              <span className="text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle size={16} /> Temporary Slot Hold Active
              </span>
              <span className="text-sm font-extrabold bg-amber-500 text-white px-2.5 py-1 rounded-lg">
                {formatTimer(timeLeft)}
              </span>
            </div>

            {/* Selected Summary */}
            <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
              <div>
                <span className="text-slate-400 uppercase tracking-wider">Doctor</span>
                <p className="text-slate-800 dark:text-slate-200 text-sm mt-0.5 font-bold">
                  {doctors.find((d) => d._id === selectedDoctor)?.name || 'Doctor'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 uppercase tracking-wider">Treatment</span>
                <p className="text-slate-800 dark:text-slate-200 text-sm mt-0.5 font-bold">
                  {selectedTreatment || 'Checkup'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 uppercase tracking-wider">Date</span>
                <p className="text-slate-800 dark:text-slate-200 text-sm mt-0.5 font-bold">{selectedDate}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase tracking-wider">Time Slot</span>
                <p className="text-slate-800 dark:text-slate-200 text-sm mt-0.5 font-bold">{selectedSlot}</p>
              </div>
            </div>

            {/* Form Details */}
            <form onSubmit={handleSubmit(onSubmitBooking)} className="space-y-5">
              
              {rescheduleAppId ? (
                // Rescheduling - Simple Confirmation
                <div className="py-6 text-center space-y-4">
                  <ShieldCheck className="mx-auto text-emerald-500" size={40} />
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-sans">
                    Confirm Rescheduling Request
                  </h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                    By submitting, your original appointment details will update to the slot selected above. A notification email will automatically trigger to alert you of changes.
                  </p>
                </div>
              ) : (
                // Normal Booking - Autofilled Profile details + Notes
                <div className="space-y-5">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                    Patient Profile Information
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <Input
                      label="Patient Name"
                      id="patientName"
                      required
                      error={errors.patientName?.message}
                      {...register('patientName', { required: 'Name is required' })}
                    />
                    <Input
                      label="Email Address"
                      id="patientEmail"
                      type="email"
                      required
                      error={errors.patientEmail?.message}
                      {...register('patientEmail', { required: 'Email is required' })}
                    />
                    <Input
                      label="Phone Number"
                      id="patientPhone"
                      required
                      error={errors.patientPhone?.message}
                      {...register('patientPhone', { required: 'Phone is required' })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input
                      label="Patient Age"
                      id="patientAge"
                      type="number"
                      required
                      error={errors.patientAge?.message}
                      {...register('patientAge', { 
                        required: 'Age is required',
                        min: { value: 1, message: 'Age must be valid' }
                      })}
                    />
                    <Select
                      label="Gender"
                      id="patientGender"
                      required
                      error={errors.patientGender?.message}
                      {...register('patientGender', { required: 'Gender is required' })}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </Select>
                  </div>
 
                  <Textarea
                    label="Symptoms / Patient Description"
                    id="symptoms"
                    rows={3}
                    placeholder="Explain what symptoms or pain you are feeling..."
                    {...register('symptoms')}
                  />
 
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Select
                      label="Emergency Severity Level"
                      id="emergencyLevel"
                      {...register('emergencyLevel')}
                    >
                      <option value="low">Low (Standard Checkup)</option>
                      <option value="medium">Medium (Aching / discomfort)</option>
                      <option value="high">High (Severe pain / Swelling)</option>
                    </Select>
                    <Select
                      label="Preferred Communication Channel"
                      id="preferredCommunication"
                      {...register('preferredCommunication')}
                    >
                      <option value="email">Email Notification</option>
                      <option value="phone">Direct Phone Call</option>
                      <option value="sms">SMS Text Alert</option>
                    </Select>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" onClick={handleBackClick} className="gap-2">
                  <ArrowLeft size={16} /> Choose Another Slot
                </Button>
                <Button type="submit" variant="success" isLoading={isSubmitting} className="gap-2 font-extrabold">
                  {rescheduleAppId ? 'Confirm Reschedule' : 'Complete Appointment Booking'} <ArrowRight size={16} />
                </Button>
              </div>

            </form>
          </Card>
        )}

      </div>
    </motion.div>
  );
};

export default BookAppointment;
