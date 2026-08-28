import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, Smile, Users, ArrowRight, Star, Heart, Calendar, Plus, Minus } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';

// Service Images
import checkUpImg from '../assets/services/check_up.png';
import restorationsImg from '../assets/services/restorations.png';
import extractionImg from '../assets/services/extraction.png';
import rootCanalImg from '../assets/services/root_canal.png';
import implantsImg from '../assets/services/implants.png';
import denturesImg from '../assets/services/dentures.png';
import crownBridgeImg from '../assets/services/crown_bridge.png';
import orthodonticImg from '../assets/services/orthodontic.png';
import alignersImg from '../assets/services/aligners.png';
import scalingWhiteningImg from '../assets/services/scaling_whitening.png';
import pediatricImg from '../assets/services/pediatric.png';
import maxillofacialImg from '../assets/services/maxillofacial.png';

const Home = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/doctors');
        if (res.success) {
          setDoctors(res.doctors);
        }
      } catch (err) {
        console.error('Failed to load doctors for homepage:', err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const services = [
    {
      title: 'Dental check up',
      description: 'Comprehensive check-ups, diagnostic X-rays, and customized treatment plans for optimal oral health.',
      icon: '🩺',
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      image: checkUpImg
    },
    {
      title: 'Restorations( Tooth coloured Fillings)',
      description: 'Durable, natural-looking composite fillings to repair cavities and restore damaged teeth seamlessly.',
      icon: '💎',
      color: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
      image: restorationsImg
    },
    {
      title: 'Tooth Extraction',
      description: 'Safe, gentle extractions of severely decayed, crowded, or problematic wisdom teeth.',
      icon: '🩹',
      color: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      image: extractionImg
    },
    {
      title: 'Root canal Treatment',
      description: 'Pain-free endodontic therapy to rescue infected teeth, remove diseased pulp, and preserve structure.',
      icon: '⚡',
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      image: rootCanalImg
    },
    {
      title: 'Dental implants',
      description: 'State-of-the-art permanent implants to substitute missing teeth and restore absolute bite function.',
      icon: '🔩',
      color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
      image: implantsImg
    },
    {
      title: 'Complete & partial Dentures',
      description: 'High-quality, customized removable dentures to comfortably replace multiple or full arches of missing teeth.',
      icon: '🦷',
      color: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
      image: denturesImg
    },
    {
      title: 'Crown and Bridges',
      description: 'Custom-made porcelain crowns and bridges to fortify weak teeth and fill gaps beautifully.',
      icon: '👑',
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      image: crownBridgeImg
    },
    {
      title: 'Orthodontic treatment',
      description: 'Modern aligners and braces to realign teeth, correct bad bites, and deliver perfectly straight smiles.',
      icon: '✨',
      color: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
      image: orthodonticImg
    },
    {
      title: 'Clear aligner treatments',
      description: 'Custom-designed clear, removable aligners to straighten your teeth discreetly and comfortably.',
      icon: '💎',
      color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      image: alignersImg
    },
    {
      title: 'Full mouth scaling & polishing,whitening',
      description: 'Professional scaling and polishing to remove plaque and tartar, combined with premium whitening for a bright smile.',
      icon: '💧',
      color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
      image: scalingWhiteningImg
    },
    {
      title: 'Paediatric dental treatment',
      description: 'Gentle, friendly, and specialized dental care specifically tailored to children and toddlers.',
      icon: '👶',
      color: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
      image: pediatricImg
    },
    {
      title: 'Oral & Maxillofacial surgery (minor oral surgeries)',
      description: 'Expert surgical procedures for minor jaw issues, impacted wisdom teeth, and minor soft tissue repairs.',
      icon: '🏥',
      color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      image: maxillofacialImg
    }
  ];

  const testimonials = [
    {
      name: 'Kandeepan Elilan',
      role: 'Invisalign Patient',
      review: 'My alignment journey at The Dental Avenue was exceptional. Dr. Denusha designed my custom clear aligners and the results are absolutely perfect! The staff is so polite.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150'
    },
    {
      name: 'Poorvika Sugumar',
      role: 'Dental Implant Recipient',
      review: 'I was extremely nervous about getting dental implants, but Dr. Shajeevan made the oral surgery completely painless. The facility is state-of-the-art and ultra-clean.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150'
    },
    {
      name: 'Thavaratnam Ashendra',
      role: 'Tooth Whitening Patient',
      review: 'I received fantastic care during my recent visits. The dentists are incredibly skilled, professional, and knowledgeable. They performed a thorough examination and provided a very clear, transparent treatment plan.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150'
    }
  ];

  const faqs = [
    {
      q: 'Do you accept health and dental insurance?',
      a: 'Yes, we accept major health and dental insurance providers. Our reception desk will help file claims directly to minimize your out-of-pocket expenses.'
    },
    {
      q: 'How can I reschedule or cancel my booking?',
      a: 'You can easily reschedule or cancel appointments by logging into your patient dashboard. We kindly request cancellations at least 24 hours in advance.'
    },
    {
      q: 'What is the "Yellow" slot status on the booking portal?',
      a: 'A yellow slot means another patient has selected this time and is currently completing their booking form. The slot is temporarily locked for 5 minutes.'
    },
    {
      q: 'What should I do in case of a dental emergency?',
      a: 'We offer emergency dental care! Please call our emergency hotline (+94 76 727 0222) immediately. Admin and surgical doctors are on-call to help you.'
    }
  ];

  const handleBookClick = (doctorId = '') => {
    navigate('/book', { state: { preSelectedDoctorId: doctorId } });
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-200">

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 bg-gradient-to-b from-brand-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left Hero Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-200/50 dark:border-brand-900/30 text-xs font-semibold uppercase tracking-wider">
                <Sparkles size={14} className="animate-[float_2s_infinite]" /> Premium Dental Care Experience
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.1] font-sans">
                Crafting Healthy, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-tealbrand-400">
                  Radiant Smiles
                </span> <br />
                With Premium Expertise.
              </h1>

              <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0 font-light">
                Welcome to The Dental Avenue, where state-of-the-art clinical technology meets warm, individualized patient care. Schedule your reservation online today.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  onClick={() => handleBookClick()}
                  variant="primary"
                  size="lg"
                  className="group shadow-lg"
                >
                  Book Appointment
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Link to="/contact">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Contact Clinic
                  </Button>
                </Link>
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800 max-w-md mx-auto lg:mx-0">
                <div>
                  <h4 className="text-2xl font-extrabold text-brand-500">99%</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Satisfaction</p>
                </div>
                <div>
                  <h4 className="text-2xl font-extrabold text-tealbrand-500">1000+</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Happy Patients</p>
                </div>
                <div>
                  <h4 className="text-2xl font-extrabold text-slate-700 dark:text-slate-300">2</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Specialists</p>
                </div>
              </div>
            </motion.div>

            {/* Right Hero Image / Illustration */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative flex justify-center"
            >
              <div className="relative w-full max-w-md lg:max-w-none">
                {/* Decorative backgrounds */}
                <div className="absolute -top-6 -left-6 w-72 h-72 bg-brand-200/40 dark:bg-brand-950/20 rounded-full filter blur-3xl -z-10 animate-pulse-slow" />
                <div className="absolute -bottom-6 -right-6 w-72 h-72 bg-tealbrand-200/40 dark:bg-tealbrand-950/20 rounded-full filter blur-3xl -z-10 animate-pulse-slow" />

                {/* Main image container */}
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                  <img
                    src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800&h=600"
                    alt="Dental Avenue Clinic Interior"
                    className="w-full h-auto rounded-xl object-cover"
                  />
                </div>

                {/* Micro notification badge */}
                <div className="absolute -bottom-4 -left-4 glass p-4 rounded-xl shadow-lg border border-white/20 flex items-center gap-3 animate-float max-w-[200px]">
                  <div className="p-2 bg-emerald-500 text-white rounded-lg"><ShieldCheck size={20} /></div>
                  <div>
                    <h5 className="text-xs font-bold dark:text-white">Sterile Zone</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">100% OSHA Compliant</p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. INTRODUCTION */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 rounded-2xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=600&h=450"
                alt="Consultation Room"
                className="w-full h-auto object-cover"
              />
            </div>

            <div className="space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-tealbrand-500 uppercase tracking-widest">
                <Heart size={14} /> Who We Are
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans">
                A New Standard of Patient-First Dental Excellence
              </h2>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                At The Dental Avenue, we believe dental care is more than just cleanings and fillings. It is about building lasting relationships, restoring self-assurance, and providing a relaxing medical journey.
              </p>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="shrink-0 mt-1 p-1 bg-brand-50 dark:bg-brand-950/40 text-brand-500 rounded"><ShieldCheck size={18} /></div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">Advanced Diagnostic Tech</h4>
                    <p className="text-sm text-slate-400 mt-0.5">We utilize ultra-low radiation 3D CBCT imaging and painless digital scans.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="shrink-0 mt-1 p-1 bg-brand-50 dark:bg-brand-950/40 text-brand-500 rounded"><Smile size={18} /></div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">Compassionate Anxiety Management</h4>
                    <p className="text-sm text-slate-400 mt-0.5">Dental anxiety is real. Our team is trained in gentle techniques and sedation therapies.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SERVICES SECTION */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 max-w-xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-500 uppercase tracking-widest">
              Our Services
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans">
              Comprehensive Oral Solutions
            </h2>
            <p className="text-slate-400 text-sm font-light">
              From cosmetic smile designs to complex surgical implant restorations, discover our full suite of premium services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc, idx) => (
              <Card
                key={idx}
                hoverEffect
                className="group flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Service Image Header */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={svc.image}
                      alt={svc.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Icon Badge Overlay */}
                    <div className={`absolute bottom-3 left-3 w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-lg backdrop-blur-md border ${svc.color}`}>
                      {svc.icon}
                    </div>
                  </div>

                  {/* Service Text Details */}
                  <div className="p-5 space-y-2">
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-brand-500 transition-colors">
                      {svc.title}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                      {svc.description}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <button
                    onClick={() => handleBookClick()}
                    className="text-xs font-bold text-brand-500 hover:text-brand-600 flex items-center gap-1.5 hover:underline group/btn"
                  >
                    Schedule this Service
                    <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. MEET THE DOCTORS */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 max-w-xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-tealbrand-500 uppercase tracking-widest">
              <Users size={14} /> Medical Directors
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans">
              Meet Our Specialist Team
            </h2>
            <p className="text-slate-400 text-sm font-light">
              Highly credentialed dentists with postgraduate specializations and years of clinical practice.
            </p>
          </div>

          {isLoading ? (
            <Loader size="lg" className="my-10" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {doctors.map((doc) => (
                <Card
                  key={doc._id}
                  hoverEffect
                  className="group flex flex-col justify-between"
                >
                  <div>
                    <div className="p-5 space-y-2">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-brand-500 transition-colors">
                        {doc.name}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
                        {doc.qualification}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light line-clamp-2">
                        {doc.bio}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                    <Button
                      onClick={() => handleBookClick(doc._id)}
                      variant="outline"
                      size="sm"
                      className="w-full group-hover:bg-brand-500 group-hover:text-white group-hover:border-brand-500 transition-colors"
                    >
                      Book With Me
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. TESTIMONIALS */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 max-w-xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-500 uppercase tracking-widest">
              Testimonials
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans">
              What Our Patients Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <Card key={idx} hoverEffect className="p-6 bg-white dark:bg-slate-900 relative">
                {/* Quote symbol mark */}
                <span className="absolute top-4 right-6 text-6xl text-slate-100 dark:text-slate-800 font-serif leading-none select-none">“</span>

                <div className="space-y-4">
                  {/* Rating */}
                  <div className="flex gap-0.5 text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-light italic">
                    "{t.review}"
                  </p>

                  <div className="flex items-center gap-3 pt-2">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-10 h-10 rounded-full object-cover shadow-sm"
                    />
                    <div>
                      <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">{t.name}</h5>
                      <p className="text-xs text-slate-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-tealbrand-500 uppercase tracking-widest">
              FAQs
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans">
              Common Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-slate-100 dark:border-slate-800/80 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900/40"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span className="text-sm pr-4">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: activeFaq === idx ? 135 : 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="text-slate-500"
                  >
                    <Plus size={16} />
                  </motion.div>
                </button>

                <motion.div
                  initial={false}
                  animate={{
                    height: activeFaq === idx ? 'auto' : 0,
                    opacity: activeFaq === idx ? 1 : 0
                  }}
                  transition={{ duration: 0.25, ease: [0.04, 0.62, 0.23, 0.98] }}
                  className="overflow-hidden"
                >
                  <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800/40 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                    {faq.a}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. APPOINTMENT CTA SECTION */}
      <section className="py-16 bg-gradient-to-r from-brand-600 to-tealbrand-600 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans">
            Ready to Experience Premium Dental Care?
          </h2>
          <p className="text-white/80 max-w-xl mx-auto text-sm sm:text-base font-light">
            Book your appointments instantly. Complete details, query availability slots, and get real-time email reminders.
          </p>
          <div className="flex gap-4 justify-center pt-2">
            <Button
              onClick={() => handleBookClick()}
              variant="outline"
              className="bg-white text-brand-600 hover:bg-slate-100 hover:text-brand-700 border-none font-bold shadow-lg"
            >
              Book Now
            </Button>
            <Link to="/contact">
              <Button variant="outline" className="px-5 py-2.5 rounded-lg border border-white/30 text-white hover:bg-white/10 bg-transparent transition-colors font-semibold">
                Contact Office
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
