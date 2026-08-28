import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = 'relative overflow-hidden inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-brand-500 hover:bg-brand-600 text-white focus:ring-brand-500 shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30',
    secondary: 'bg-tealbrand-500 hover:bg-tealbrand-600 text-white focus:ring-tealbrand-500 shadow-md shadow-tealbrand-500/20 hover:shadow-lg hover:shadow-tealbrand-500/30',
    outline: 'border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-slate-500',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 shadow-md shadow-red-500/20 hover:shadow-lg',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white focus:ring-emerald-500 shadow-md',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 focus:ring-slate-500'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const isInteractive = !disabled && !isLoading;
  const hoverAnimation = isInteractive ? { scale: 1.02, y: -1 } : {};
  const tapAnimation = isInteractive ? { scale: 0.97 } : {};

  return (
    <motion.button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      whileHover={hoverAnimation}
      whileTap={tapAnimation}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      {...props}
    >
      {/* Interactive Sheen Overlay */}
      {isInteractive && (variant === 'primary' || variant === 'secondary') && (
        <span className="absolute inset-0 block overflow-hidden pointer-events-none rounded-lg">
          <motion.span
            className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          />
        </span>
      )}
      
      <span className="relative z-10 flex items-center justify-center">
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </span>
    </motion.button>
  );
};

export default Button;

