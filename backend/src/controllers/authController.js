const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendVerificationCodeEmail, sendPasswordResetEmail } = require('../utils/emailService');
const { OAuth2Client } = require('google-auth-library');
const { isValidEmail, isValidPhone } = require('../utils/validators');

const googleClientId = process.env.GOOGLE_CLIENT_ID || '422868012066-1cbb2mqcbj33hd5sjupu6qrngd41pic5.apps.googleusercontent.com';
const client = new OAuth2Client(googleClientId);

// Helper to sign JWT
const signToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('CRITICAL: JWT_SECRET environment variable is not defined!');
  }
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
};

// @desc    Register a new patient
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate inputs
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid name'
      });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number'
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email: email.trim().toLowerCase() });
    if (userExists && userExists.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists'
      });
    }

    // Password strength check (min 8 chars, 1 upper, 1 lower, 1 digit, 1 special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character/symbol'
      });
    }

    // Generate cryptographically secure 6-digit verification code (OTP)
    const otpCode = crypto.randomInt(100000, 1000000).toString();

    let user;
    if (userExists) {
      // Overwrite/update existing unverified user record
      userExists.name = name.trim();
      userExists.password = password; // Will be hashed by pre-save hook
      userExists.phone = phone ? phone.trim() : '';
      userExists.isGoogleUser = false; // Reset to standard registration type
      userExists.verificationCode = otpCode;
      userExists.verificationCodeExpire = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
      userExists.verificationCodeLastSent = new Date();
      user = await userExists.save();
    } else {
      // Create new User (unverified by default)
      user = await User.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone ? phone.trim() : '',
        role: 'patient', // Default role is always patient
        isVerified: false,
        verificationCode: otpCode,
        verificationCodeExpire: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
        verificationCodeLastSent: new Date()
      });
    }

    // Send email code
    try {
      await sendVerificationCodeEmail(user.email, user.name, otpCode);
    } catch (err) {
      console.error('Signup email sending failed:', err.message);
    }

    // Return requiresVerification to frontend without standard JWT log in
    res.status(201).json({
      success: true,
      requiresVerification: true,
      email: user.email,
      message: 'Registration successful! A verification code has been sent to your email.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login patient/admin
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    // Check user
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Restrict Google users from using standard password login
    if (user.isGoogleUser || !user.password) {
      return res.status(400).json({
        success: false,
        message: 'This email is associated with Google Sign-In. Please sign in using the "Continue with Google" button.'
      });
    }

    // Check if account is temporarily locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to too many failed login attempts. Please try again in ${minutesLeft} minute(s).`
      });
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      let message = 'Invalid credentials';
      
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
        message = 'Too many failed login attempts. Your account has been temporarily locked for 15 minutes.';
      } else {
        const attemptsLeft = 5 - user.loginAttempts;
        message = `Invalid credentials. You have ${attemptsLeft} attempt(s) remaining before your account is locked.`;
      }
      
      await user.save();
      
      return res.status(401).json({
        success: false,
        message
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended. Please contact support.'
      });
    }

    // Successful login: reset attempts
    if (user.loginAttempts > 0 || user.lockUntil) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    // Check if user is verified
    if (!user.isVerified) {
      // Enforce the 1-minute resend cooldown on login too to prevent spamming
      if (user.verificationCodeLastSent && (Date.now() - user.verificationCodeLastSent.getTime() < 60000)) {
        return res.status(200).json({
          success: true,
          requiresVerification: true,
          email: user.email,
          message: 'Account not verified. A verification code was recently sent. Please check your email or wait 1 minute to resend.'
        });
      }

      // Generate secure verification code (OTP)
      const otpCode = crypto.randomInt(100000, 1000000).toString();
      user.verificationCode = otpCode;
      user.verificationCodeExpire = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
      user.verificationCodeLastSent = new Date();
      await user.save();

      try {
        await sendVerificationCodeEmail(user.email, user.name, otpCode);
      } catch (err) {
        console.error('Login unverified email code sending failed:', err.message);
      }

      return res.status(200).json({
        success: true,
        requiresVerification: true,
        email: user.email,
        message: 'Account not verified. A verification code has been sent to your email.'
      });
    }

    // Sign token
    const token = signToken(user._id);

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify email address
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email address verified successfully!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) {
      // Security practice: do not reveal that email is not registered.
      return res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    if (user.isGoogleUser) {
      return res.status(400).json({
        success: false,
        message: 'This email is associated with Google Sign-In. Please sign in using Google.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire (10 minutes)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    // Send email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (err) {
      console.error('Password reset email sending failed:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to email'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash token to match saved token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    // Password strength check (min 8 chars, 1 upper, 1 lower, 1 digit, 1 special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character/symbol'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully! You can now log in.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user && user.role === 'patient' && !user.patientId) {
      const lastPatient = await User.findOne({
        role: 'patient',
        patientId: { $regex: /^DC\d+$/ }
      }).sort({ patientId: -1, createdAt: -1, _id: -1 }).select('patientId');

      let nextNum = 1;
      if (lastPatient && lastPatient.patientId) {
        const match = lastPatient.patientId.match(/DC(\d+)/);
        if (match && match[1]) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }
      user.patientId = `DC${String(nextNum).padStart(5, '0')}`;
      await user.save();
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Auth with Google (Login or Register)
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'No Google credential token provided'
      });
    }

    // Verify Google ID Token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleClientId
    });

    const payload = ticket.getPayload();
    const { email, name, email_verified } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email not provided by Google account'
      });
    }

    // Find if user exists
    let user = await User.findOne({ email: email.toLowerCase() });

    const adminEmail = (process.env.ADMIN_EMAIL || 'thedentalavenue.lk@gmail.com').toLowerCase();
    const isAdminEmail = email.toLowerCase() === adminEmail;

    if (isAdminEmail) {
      if (!user) {
        // Create verified admin user instantly
        user = await User.create({
          name: name || 'Admin',
          email: email.toLowerCase(),
          role: 'admin',
          isVerified: true
        });
      } else if (user.role !== 'admin' || !user.isVerified) {
        // Upgrade existing user to verified admin if needed
        user.role = 'admin';
        user.isVerified = true;
        await user.save();
      }
    } else if (!user) {
      // Generate cryptographically secure 6-digit OTP code for Google signup
      const otpCode = crypto.randomInt(100000, 1000000).toString();

      // Create new user (Sign up as unverified)
      user = await User.create({
        name,
        email: email.toLowerCase(),
        role: 'patient',
        isVerified: false,
        verificationCode: otpCode,
        verificationCodeExpire: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
        verificationCodeLastSent: new Date(),
        isGoogleUser: true
      });

      // Send verification code email
      try {
        await sendVerificationCodeEmail(user.email, user.name, otpCode);
      } catch (err) {
        console.error('Google Signup code email sending failed:', err.message);
      }

      return res.status(200).json({
        success: true,
        requiresVerification: true,
        email: user.email,
        message: 'Verification code sent to your email.'
      });
    } else {
      // Check if blocked
      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: 'Your account is suspended. Please contact support.'
        });
      }
      
      // If user exists but is unverified (incomplete Google signup)
      if (!user.isVerified) {
        // Enforce the 1-minute resend cooldown on backend
        if (user.verificationCodeLastSent && (Date.now() - user.verificationCodeLastSent.getTime() < 60000)) {
          return res.status(200).json({
            success: true,
            requiresVerification: true,
            email: user.email,
            message: 'A verification code was recently sent. Please check your email or wait 1 minute to resend.'
          });
        }

        // Generate and send secure OTP
        const otpCode = crypto.randomInt(100000, 1000000).toString();
        user.verificationCode = otpCode;
        user.verificationCodeExpire = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
        user.verificationCodeLastSent = new Date();
        await user.save();

        try {
          await sendVerificationCodeEmail(user.email, user.name, otpCode);
        } catch (err) {
          console.error('Google Signup code email resending failed:', err.message);
        }

        return res.status(200).json({
          success: true,
          requiresVerification: true,
          email: user.email,
          message: 'A new verification code has been sent to your email.'
        });
      }
    }

    // Sign JWT token for verified user
    const token = signToken(user._id);

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error('Google Auth Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed: ' + error.message
    });
  }
};

// @desc    Verify Sign-Up Verification Code (Google or Standard)
// @route   POST /api/auth/verify-code
// @access  Public
exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 6-digit verification code'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      const token = signToken(user._id);
      user.password = undefined;
      return res.status(200).json({
        success: true,
        token,
        user,
        message: 'Account already verified. Logging in.'
      });
    }

    // Check code and expiry
    if (!user.verificationCode || user.verificationCode !== code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    if (user.verificationCodeExpire && user.verificationCodeExpire.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    // Set user as verified
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpire = undefined;
    user.verificationCodeLastSent = undefined;
    await user.save();

    // Sign JWT token
    const token = signToken(user._id);

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      token,
      user,
      message: 'Email verified successfully! Registration completed.'
    });
  } catch (error) {
    console.error('Verify Code Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Resend Verification Code (Google or Standard)
// @route   POST /api/auth/resend-code
// @access  Public
exports.resendCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified'
      });
    }

    // Enforce 1-minute cooldown
    if (user.verificationCodeLastSent && (Date.now() - user.verificationCodeLastSent.getTime() < 60000)) {
      const secondsLeft = Math.ceil((60000 - (Date.now() - user.verificationCodeLastSent.getTime())) / 1000);
      return res.status(400).json({
        success: false,
        message: `Please wait ${secondsLeft} second(s) before requesting a new code.`
      });
    }

    // Generate secure OTP
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    user.verificationCode = otpCode;
    user.verificationCodeExpire = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
    user.verificationCodeLastSent = new Date();
    await user.save();

    // Send email
    await sendVerificationCodeEmail(user.email, user.name, otpCode);

    res.status(200).json({
      success: true,
      message: 'A new verification code has been sent to your email.'
    });
  } catch (error) {
    console.error('Resend Code Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
