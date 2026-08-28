import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, ShieldAlert } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 transition-colors duration-200">
      {/* Upper Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center">
              <img src="/logo.png" alt="The Dental Avenue Logo" className="h-16 w-auto object-contain" />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed font-sans font-light">
              Experience the highest standard of modern, gentle, and premium dental care. We utilize state-of-the-art technologies to craft your perfect smile.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="hover:text-brand-400 transition-colors p-1.5 bg-slate-800 rounded-lg" aria-label="Facebook">
                <svg className="w-4 h-4 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="#" className="hover:text-brand-400 transition-colors p-1.5 bg-slate-800 rounded-lg" aria-label="Instagram">
                <svg className="w-4 h-4 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="#" className="hover:text-brand-400 transition-colors p-1.5 bg-slate-800 rounded-lg" aria-label="Twitter">
                <svg className="w-4 h-4 text-current" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/signup" className="hover:text-white transition-colors">Register Portal</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Patient Login</Link></li>
            </ul>
          </div>

          {/* Services Column */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/book" className="hover:text-white transition-colors">Dental check up</Link></li>
              <li><Link to="/book" className="hover:text-white transition-colors">Orthodontic treatment</Link></li>
              <li><Link to="/book" className="hover:text-white transition-colors">Restorations & Fillings</Link></li>
              <li><Link to="/book" className="hover:text-white transition-colors">Dental implants</Link></li>
              <li><Link to="/book" className="hover:text-white transition-colors">Oral & Maxillofacial surgery</Link></li>
            </ul>
          </div>

          {/* Contact Details Column */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Contact & Hours</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-brand-400 shrink-0 mt-0.5" />
                <span># 54, Jaffna Road (New Bus Stand), Vavuniya, Sri Lanka</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={16} className="text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <p>+94 76 727 0222</p>
                  <p>+94 71 712 2736</p>
                  <p className="text-red-400 font-semibold mt-0.5">+94 24 222 3637 (Hotline)</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-brand-400 shrink-0" />
                <span>thedentalavenue.lk@gmail.com</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={16} className="text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <p>Mon - Fri: 4:00 PM - 8:00 PM</p>
                  <p>Sat & Sun: 9:00 AM - 8:00 PM</p>
                </div>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Lower Footer */}
      <div className="bg-slate-950/60 border-t border-slate-800/60 py-6 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© {currentYear} The Dental Avenue. All rights reserved. Designed with premium care.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
