const mongoose = require('mongoose');

// Regular Expressions
const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}$/;
const phoneRegex = /^[+]?[0-9]{8,15}$/; // Simple international phone regex

exports.isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  return emailRegex.test(email.trim());
};

exports.isValidPhone = (phone) => {
  if (!phone) return true; // Optional field, skip if empty/falsy
  if (typeof phone !== 'string') return false;
  return phoneRegex.test(phone.trim().replace(/[\s-]/g, ''));
};

exports.isValidDate = (dateStr) => {
  if (typeof dateStr !== 'string') return false;
  if (!dateRegex.test(dateStr)) return false;
  
  // Verify it is a valid date (e.g. not 2026-02-31)
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === dateStr;
};

exports.isValidTimeSlot = (timeStr) => {
  if (typeof timeStr !== 'string') return false;
  if (!timeRegex.test(timeStr)) return false;
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60;
};

exports.isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

exports.isValidAge = (age) => {
  const num = Number(age);
  return !isNaN(num) && num > 0 && num < 150;
};

exports.isValidDob = (dobStr) => {
  if (!dobStr) return true; // Optional field, skip if empty/falsy
  const d = new Date(dobStr);
  return !isNaN(d.getTime()) && d < new Date(); // Must be a parseable date in the past
};
