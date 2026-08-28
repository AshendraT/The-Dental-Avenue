import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { UserPlus, Check, X, ShieldAlert, Mail, ArrowLeft } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { GoogleLogin } from '@react-oauth/google';

const Signup = () => {
  const { signup, googleLogin, verifyCode, resendCode } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passValue, setPassValue] = useState('');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // Verification code states
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resize listener
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Timer effect for resend cooldown
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const nameRegister = register('name', { required: 'Name is required' });
  const emailRegister = register('email', { 
    required: 'Email is required',
    pattern: {
      value: /^\S+@\S+$/i,
      message: 'Invalid email address'
    }
  });
  const phoneRegister = register('phone');
  const passwordRegister = register('password', { 
    required: 'Password is required',
    onChange: (e) => setPassValue(e.target.value)
  });

  // Password rules validation helper
  const rules = {
    length: passValue.length >= 8,
    uppercase: /[A-Z]/.test(passValue),
    lowercase: /[a-z]/.test(passValue),
    number: /\d/.test(passValue),
    special: /[\W_]/.test(passValue)
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsSubmitting(true);
    try {
      const res = await googleLogin(credentialResponse.credential);
      if (res.requiresVerification) {
        setVerificationEmail(res.email);
        setShowVerification(true);
        addToast('A verification code has been sent to your Google email.', 'info');
        setResendCooldown(60); // 1-minute cooldown
      } else if (res.success) {
        addToast('Welcome to The Dental Avenue!', 'success');
        navigate('/dashboard');
      }
    } catch (err) {
      addToast(err.message || 'Google Sign-Up failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    addToast('Google authentication failed. Please try again.', 'error');
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.trim().length !== 6) {
      addToast('Please enter a valid 6-digit verification code.', 'warning');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await verifyCode(verificationEmail, verificationCode.trim());
      if (res.success) {
        addToast('Welcome to The Dental Avenue!', 'success');
        navigate('/dashboard');
      }
    } catch (err) {
      addToast(err.message || 'Verification failed. Please try again.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    try {
      const res = await resendCode(verificationEmail);
      if (res.success) {
        addToast('A new verification code has been sent to your email.', 'success');
        setResendCooldown(60); // Reset the 1-minute cooldown
      }
    } catch (err) {
      addToast(err.message || 'Failed to resend verification code.', 'error');
    }
  };

  const onSubmit = async (data) => {
    // Enforce check
    const isValid = Object.values(rules).every(Boolean);
    if (!isValid) {
      addToast('Please ensure your password meets all complexity rules.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signup(data.name, data.email, data.password, data.phone);
      if (res.requiresVerification) {
        setVerificationEmail(res.email);
        setShowVerification(true);
        addToast('A verification code has been sent to your email.', 'info');
        setResendCooldown(60); // 1-minute cooldown
      } else if (res.success) {
        addToast('Registration successful!', 'success');
        navigate('/dashboard');
      }
    } catch (err) {
      addToast(err.message || 'Signup failed. Email might already be taken.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center mb-4">
            <img src="/logo.png" alt="The Dental Avenue Logo" className="h-28 w-auto object-contain" />
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white font-sans">
            Create Patient Account
          </h2>
          <p className="text-slate-400 text-xs mt-1.5 font-light">
            Register to schedule appointments, view summaries, and manage profiles.
          </p>
        </div>

        <Card hoverEffect className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl">
          {showVerification ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-brand-50 dark:bg-brand-950/30 text-brand-500 rounded-full mb-3">
                  <Mail size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans">
                  Confirm Your Email
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 max-w-sm font-light">
                  We've sent a 6-digit verification code to <span className="text-brand-500 font-semibold">{verificationEmail}</span>. Please type it in below.
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-brand-500/20 focus:border-brand-500 rounded-lg text-slate-800 dark:text-slate-100 text-2xl font-bold tracking-[0.5em] transition-all duration-200 focus:outline-none focus:ring-4 placeholder-slate-200 dark:placeholder-slate-800"
                    required
                    autoComplete="one-time-code"
                  />
                </div>

                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full"
                  isLoading={isVerifying}
                >
                  Verify Code
                </Button>
              </form>

              <div className="flex flex-col items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0}
                  className={`font-semibold transition-colors ${
                    resendCooldown > 0 
                      ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed' 
                      : 'text-brand-500 hover:text-brand-600'
                  }`}
                >
                  {resendCooldown > 0 
                    ? `Resend code in ${resendCooldown}s` 
                    : 'Resend Verification Code'
                  }
                </button>

                <button
                  type="button"
                  onClick={() => setShowVerification(false)}
                  className="text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium transition-colors mt-2"
                >
                  <ArrowLeft size={12} /> Back to Sign Up
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
                <Input
                  label="Full Name"
                  id="name"
                  required
                  placeholder="John Doe"
                  error={errors.name?.message}
                  name={nameRegister.name}
                  ref={nameRegister.ref}
                  onChange={nameRegister.onChange}
                  onBlur={nameRegister.onBlur}
                />

                <Input
                  label="Email Address"
                  id="email"
                  type="email"
                  required
                  placeholder="john@example.com"
                  error={errors.email?.message}
                  name={emailRegister.name}
                  ref={emailRegister.ref}
                  onChange={emailRegister.onChange}
                  onBlur={emailRegister.onBlur}
                  autoComplete="off"
                />

                <Input
                  label="Phone Number"
                  id="phone"
                  placeholder="+94 76 727 0222"
                  error={errors.phone?.message}
                  name={phoneRegister.name}
                  ref={phoneRegister.ref}
                  onChange={phoneRegister.onChange}
                  onBlur={phoneRegister.onBlur}
                />

                <Input
                  label="Password"
                  type="password"
                  required
                  placeholder="••••••••"
                  name={passwordRegister.name}
                  ref={passwordRegister.ref}
                  onChange={passwordRegister.onChange}
                  onBlur={passwordRegister.onBlur}
                  autoComplete="new-password"
                />
                  
                  {/* Password complexity checklist */}
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <ShieldAlert size={12} /> Password Strength Requirements
                    </p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                      <div className={`flex items-center gap-1.5 ${rules.length ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`}>
                        {rules.length ? <Check size={12} /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                        <span>At least 8 characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${rules.uppercase ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`}>
                        {rules.uppercase ? <Check size={12} /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                        <span>One uppercase letter</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${rules.lowercase ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`}>
                        {rules.lowercase ? <Check size={12} /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                        <span>One lowercase letter</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${rules.number ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`}>
                        {rules.number ? <Check size={12} /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                        <span>One number</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${rules.special ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`}>
                        {rules.special ? <Check size={12} /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                        <span>One special character</span>
                      </div>
                    </div>
                  </div>

                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full mt-4"
                  isLoading={isSubmitting}
                >
                  Sign Up <UserPlus size={16} className="ml-2" />
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold tracking-wider font-sans">Or continue with</span>
                </div>
              </div>

              {/* Google Sign-In Button */}
              <div className="flex justify-center w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  width={windowWidth < 440 ? (windowWidth < 360 ? "260" : "300") : "380"}
                  text="signup_with"
                  shape="rectangular"
                  locale="en"
                />
              </div>

              {/* Prompt */}
              <div className="mt-6 text-center text-xs text-slate-400">
                Already have a patient account?{' '}
                <Link to="/login" className="text-brand-500 font-bold hover:underline">
                  Sign In
                </Link>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default Signup;
