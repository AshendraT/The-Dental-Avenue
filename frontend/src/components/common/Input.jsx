import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

const Input = React.forwardRef(({
  label,
  type = 'text',
  error,
  placeholder = '',
  className = '',
  id,
  required = false,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordType = type === 'password';
  const inputType = isPasswordType && showPassword ? 'text' : type;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <motion.div
        animate={{
          y: isFocused ? -2 : 0,
          boxShadow: isFocused 
            ? '0 10px 15px -3px rgba(14, 165, 233, 0.08), 0 4px 6px -4px rgba(14, 165, 233, 0.08)' 
            : '0 0px 0px 0px rgba(0,0,0,0)'
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative"
      >
        <input
          ref={ref}
          type={inputType}
          id={id}
          placeholder={placeholder}
          onFocus={(e) => {
            setIsFocused(true);
            if (props.onFocus) props.onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (props.onBlur) props.onBlur(e);
          }}
          className={`w-full pl-4 ${isPasswordType ? 'pr-12' : 'pr-4'} py-2.5 bg-white dark:bg-slate-900 border ${
            error
              ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
              : 'border-slate-200 dark:border-slate-800 focus:ring-brand-500/20 focus:border-brand-500'
          } rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm transition-all duration-200 focus:outline-none focus:ring-4`}
          {...props}
        />
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-600 dark:hover:text-slate-350 transition-colors focus:outline-none cursor-pointer"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </motion.div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 6 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="text-xs text-red-500 font-medium overflow-hidden"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

