import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Textarea = React.forwardRef(({
  label,
  error,
  className = '',
  id,
  required = false,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

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
        <textarea
          ref={ref}
          id={id}
          onFocus={(e) => {
            setIsFocused(true);
            if (props.onFocus) props.onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (props.onBlur) props.onBlur(e);
          }}
          className={`w-full px-4 py-2.5 bg-white dark:bg-slate-900 border ${
            error
              ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
              : 'border-slate-200 dark:border-slate-800 focus:ring-brand-500/20 focus:border-brand-500'
          } rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm transition-all duration-200 focus:outline-none focus:ring-4`}
          {...props}
        />
      </motion.div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500 font-medium">
          {error}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
