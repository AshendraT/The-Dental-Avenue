import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { KeyRound, ArrowLeft } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const ForgotPassword = () => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: data.email });
      if (response.success) {
        addToast(response.message || 'Reset instructions sent to email!', 'success');
        setSentEmail(data.email);
        setIsSent(true);
      }
    } catch (err) {
      addToast(err.message || 'Failed to submit forgot password request.', 'error');
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
            Reset Password
          </h2>
          <p className="text-slate-400 text-xs mt-1.5 font-light">
            Enter your email below and we will send you instructions to reset your password.
          </p>
        </div>

        <Card hoverEffect className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl">
          {isSent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-xl">
                ✉️
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Check Your Email</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                If the email address <strong className="font-semibold text-slate-700 dark:text-slate-200">{sentEmail}</strong> matches an active account, we have sent a secure link to reset your password. Check your spam folder if you do not receive it in 5 minutes.
              </p>
              <Link to="/login" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
              <Input
                label="Email Address"
                id="email"
                type="email"
                required
                placeholder="john@example.com"
                error={errors.email?.message}
                autoComplete="off"
                {...register('email', { 
                  required: 'Email address is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address'
                  }
                })}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={isSubmitting}
              >
                Send Reset Link <KeyRound size={16} className="ml-2" />
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-center gap-1">
                  <ArrowLeft size={12} /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
