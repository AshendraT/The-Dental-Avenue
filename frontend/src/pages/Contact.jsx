import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, ShieldAlert, Send } from 'lucide-react';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const Contact = () => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/contact', data);
      if (response.success) {
        addToast(response.message || 'Inquiry message submitted successfully!', 'success');
        reset();
      }
    } catch (err) {
      addToast(err.message || 'Failed to submit inquiry. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-200 py-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="text-center max-w-xl mx-auto mb-16 space-y-4">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white font-sans">
            Connect With Our Clinic
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-light text-sm">
            Have questions about procedures, scheduling, or insurance? Send us a message and our reception coordinators will respond shortly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* Left Column: Form Card */}
          <div className="lg:col-span-2">
            <Card hoverEffect className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-sans mb-6">
                Send a Message
              </h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Full Name"
                    id="name"
                    required
                    placeholder="John Doe"
                    error={errors.name?.message}
                    {...register('name', { required: 'Name is required' })}
                  />
                  <Input
                    label="Email Address"
                    id="email"
                    type="email"
                    required
                    placeholder="john@example.com"
                    error={errors.email?.message}
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Invalid email format'
                      }
                    })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Phone Number"
                    id="phone"
                    placeholder="+94 76 727 0222"
                    error={errors.phone?.message}
                    {...register('phone')}
                  />
                  <Input
                    label="Inquiry Subject"
                    id="subject"
                    required
                    placeholder="Billing question, procedure query..."
                    error={errors.subject?.message}
                    {...register('subject', { required: 'Subject is required' })}
                  />
                </div>

                <Textarea
                  label="Message Body"
                  id="message"
                  required
                  rows={5}
                  placeholder="How can we assist you today? Please do not send sensitive medical details..."
                  error={errors.message?.message}
                  {...register('message', { required: 'Message body is required' })}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full sm:w-auto"
                    isLoading={isSubmitting}
                  >
                    Submit Inquiry <Send size={16} className="ml-2" />
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Right Column: Contact Cards */}
          <div className="space-y-6">
            
            {/* Info details */}
            <Card hoverEffect className="p-6 space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Clinic Information</h3>
              
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="p-2.5 bg-brand-500/10 text-brand-500 rounded-xl mt-0.5"><MapPin size={18} /></div>
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Address</h5>
                    <p className="text-xs text-slate-400 mt-0.5"># 54, Jaffna Road (New Bus Stand), Vavuniya, Sri Lanka</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="p-2.5 bg-brand-500/10 text-brand-500 rounded-xl mt-0.5"><Phone size={18} /></div>
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Contact Numbers</h5>
                    <p className="text-xs text-slate-400 mt-0.5">+94 76 727 0222, +94 71 712 2736</p>
                    <p className="text-xs text-red-500 font-semibold mt-0.5">+94 24 222 3637 (Hotline)</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="p-2.5 bg-brand-500/10 text-brand-500 rounded-xl mt-0.5"><Mail size={18} /></div>
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Email Address</h5>
                    <p className="text-xs text-slate-400 mt-0.5">thedentalavenue.lk@gmail.com</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="p-2.5 bg-brand-500/10 text-brand-500 rounded-xl mt-0.5"><Clock size={18} /></div>
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Opening Hours</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Mon - Fri: 4:00 PM - 8:00 PM</p>
                    <p className="text-xs text-slate-400 mt-0.5">Sat & Sun: 9:00 AM - 8:00 PM</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Google Map Container */}
            <Card hoverEffect className="overflow-hidden border border-slate-100 dark:border-slate-800/80 shadow-md">
              <iframe
                title="Clinic Location Map"
                src="https://maps.google.com/maps?q=8.762667,80.4975&z=17&output=embed"
                width="100%"
                height="220"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Card>

          </div>

        </div>

      </div>
    </motion.div>
  );
};

export default Contact;
