import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Menu, X, Sun, Moon, LogOut, User as UserIcon, Calendar, MessageSquare, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../common/Button';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    logout();
    navigate('/');
    setShowDropdown(false);
  };

  const isActive = (path) => location.pathname === path;
  
  const navLinkClass = (path) => `
    relative text-sm font-semibold transition-colors duration-200 py-1.5 px-3 rounded-lg z-10 select-none
    ${isActive(path) 
      ? 'text-brand-500' 
      : 'text-slate-600 hover:text-brand-500 dark:text-slate-300 dark:hover:text-brand-400'}
  `;

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-100 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/85 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <img src="/logo.png" alt="The Dental Avenue Logo" className="h-14 w-auto object-contain group-hover:scale-110 transition-transform duration-200" />
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/" className={navLinkClass('/')}>
              {isActive('/') && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 bg-brand-50/70 dark:bg-brand-950/30 rounded-lg -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              Home
            </Link>
            <Link to="/contact" className={navLinkClass('/contact')}>
              {isActive('/contact') && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 bg-brand-50/70 dark:bg-brand-950/30 rounded-lg -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              Contact Us
            </Link>
            
            {isAuthenticated && (
              <>
                {user?.role === 'admin' ? (
                  <Link to="/admin" className={navLinkClass('/admin')}>
                    {isActive('/admin') && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 bg-brand-50/70 dark:bg-brand-950/30 rounded-lg -z-10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="flex items-center gap-1"><Shield size={16} /> Admin Panel</span>
                  </Link>
                ) : (
                  <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                    {isActive('/dashboard') && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 bg-brand-50/70 dark:bg-brand-950/30 rounded-lg -z-10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="flex items-center gap-1"><Calendar size={16} /> My Appointments</span>
                  </Link>
                )}
              </>
            )}

            {/* Vertical Divider */}
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* User Profile / Login CTAs */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 p-1 px-3 rounded-full border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800 transition-all duration-200"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                    {user?.name ? user.name[0] : 'U'}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[80px] truncate">
                    {user?.name.split(' ')[0]}
                  </span>
                </button>

                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg shadow-xl py-1 z-20 animate-[slideIn_0.2s_ease-out]">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.email}</p>
                      </div>
                      
                      {user?.role === 'patient' && (
                        <Link
                          to="/dashboard"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <UserIcon size={14} /> Profile Settings
                        </Link>
                      )}
                      
                      <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-left"
                      >
                        <LogOut size={14} /> Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 pt-2 pb-4 space-y-1">
          <Link to="/" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Home</Link>
          <Link to="/contact" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Contact Us</Link>
          
          {isAuthenticated && (
            <>
              {user?.role === 'admin' ? (
                <Link to="/admin" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Admin Panel</Link>
              ) : (
                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">My Appointments</Link>
              )}
            </>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            {isAuthenticated ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm uppercase">
                    {user?.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{user?.name}</p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogoutClick}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  aria-label="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">Sign In</Button>
                </Link>
                <Link to="/signup" onClick={() => setIsOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
