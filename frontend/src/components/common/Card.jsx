import React from 'react';
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';

const Card = ({
  children,
  className = '',
  hoverEffect = false,
  variant = 'default',
  onClick,
  ...props
}) => {
  const baseStyles = 'rounded-xl border transition-all duration-200 overflow-hidden';
  
  const variants = {
    default: 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm',
    glass: 'glass shadow-md',
    neutral: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-800/80',
    brand: 'bg-brand-50/30 dark:bg-brand-950/10 border-brand-100/50 dark:border-brand-900/20'
  };

  const hoverStyle = hoverEffect
    ? 'hover:-translate-y-1 hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer'
    : '';

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e) => {
    const { currentTarget, clientX, clientY } = e;
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <div
      onClick={onClick}
      onMouseMove={hoverEffect ? handleMouseMove : undefined}
      className={`${baseStyles} ${variants[variant]} ${hoverStyle} relative group ${className}`}
      {...props}
    >
      {children}
      
      {/* Interactive Spotlight Overlay */}
      {hoverEffect && (
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
          style={{
            background: useMotionTemplate`radial-gradient(250px circle at ${mouseX}px ${mouseY}px, rgba(14, 165, 233, 0.12) 0%, transparent 80%)`
          }}
        />
      )}
    </div>
  );
};

export default Card;

