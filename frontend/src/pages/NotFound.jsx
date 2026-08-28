import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/common/Button';

const NotFound = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200"
    >
      <div className="max-w-md space-y-6">
        <span className="text-8xl select-none animate-bounce inline-block">🦷</span>
        <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white font-sans leading-tight">
          404 Error
        </h1>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">
          Page Not Found
        </h2>
        <p className="text-sm text-slate-400 font-light leading-relaxed">
          The clinic resource you are trying to access does not exist, or has been relocated by administration. Please verify the URL or return to home.
        </p>
        
        <div className="pt-4">
          <Link to="/">
            <Button variant="primary" size="lg">
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default NotFound;
