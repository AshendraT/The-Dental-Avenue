import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Check, X, ShieldAlert, KeyRound } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const ResetPassword = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passValue, setPassValue] = useState('');
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Password rules validation
  const rules = {
    length: passValue.length >= 8,
    uppercase: /[A-Z]/.test(passValue),
    lowercase: /[a-z]/.test(passValue),
    number: /\d/.test(passValue),
    special: /[\W_]/.test(passValue)
  };

  const onSubmit = async (data) => {
    if (!token) {
      addToast('No password reset token was found in the URL. Please request a new link.', 'error');
      return;
    }

    const isValid = Object.values(rules).every(Boolean);
    if (!isValid) {
      addToast('Please ensure your password meets all complexity rules.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post(`/auth/reset-password/${token}`, { password: data.password });
      if (response.success) {
        addToast(response.message || 'Password updated successfully!', 'success');
        navigate('/login');
      }
    } catch (err) {
      addToast(err.message || 'Failed to reset password. The link may have expired.', 'error');
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
            Choose New Password
          </h2>
          <p className="text-slate-400 text-xs mt-1.5 font-light">
            Please enter your new strong password below to secure your account.
          </p>
        </div>

        <Card hoverEffect className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl">
          {!token ? (
            <div className="text-center space-y-4 py-4">
              <div className="text-4xl text-red-500">⚠️</div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Missing Token</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                This reset link is missing a validation token or has expired. Please go back and request a new password recovery link.
              </p>
              <Link to="/forgot-password" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full">
                  Request New Link
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                required
                placeholder="••••••••"
                {...register('password', { 
                  required: 'Password is required',
                  onChange: (e) => setPassValue(e.target.value)
                })}
              />
                
                {/* Real-time Checklist */}
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
                variant="primary"
                className="w-full mt-4"
                isLoading={isSubmitting}
              >
                Reset Password <KeyRound size={16} className="ml-2" />
              </Button>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
