import React from 'react';

const Loader = ({
  variant = 'spinner', // 'spinner' | 'fullscreen' | 'skeleton'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = ''
}) => {
  const sizes = {
    sm: 'h-5 w-5 border-2',
    md: 'h-10 w-10 border-4',
    lg: 'h-16 w-16 border-4'
  };

  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/80 dark:bg-slate-950/85 backdrop-blur-sm">
        <div className={`animate-spin rounded-full border-t-brand-500 border-r-transparent border-b-tealbrand-500 border-l-transparent ${sizes.lg}`} />
        <p className="mt-4 text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 animate-pulse uppercase">
          Loading Dental Avenue...
        </p>
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={`space-y-3 animate-pulse ${className}`}>
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-full" />
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-brand-500 border-t-transparent ${sizes[size]}`}
      />
    </div>
  );
};

export default Loader;
