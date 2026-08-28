const User = require('../models/User');
const { isValidPhone } = require('../utils/validators');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
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

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      nicId,
      address,
      dob,
      gender,
      medicalNotes,
      emergencyContactName,
      emergencyContactPhone
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validation for patient users
    if (req.user.role === 'patient') {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Full Name is required'
        });
      }
      if (!phone || typeof phone !== 'string' || !phone.trim() || !isValidPhone(phone)) {
        return res.status(400).json({
          success: false,
          message: 'A valid Phone Number is required'
        });
      }
      if (!nicId || typeof nicId !== 'string' || !nicId.trim()) {
        return res.status(400).json({
          success: false,
          message: 'NIC / ID Number / Passport No is required'
        });
      }
      if (!dob || isNaN(new Date(dob).getTime()) || new Date(dob) >= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'A valid Date of Birth is required'
        });
      }
      if (!gender || !['male', 'female', 'other'].includes(gender)) {
        return res.status(400).json({
          success: false,
          message: 'Gender is required (must be male, female, or other)'
        });
      }

      user.name = name.trim();
      user.phone = phone.trim();
      user.nicId = nicId.trim();
      user.dob = new Date(dob);
      user.gender = gender;
    } else {
      // Non-patient role (e.g. admin) - allow partial updates
      if (name) user.name = name;
      if (phone !== undefined) user.phone = phone;
      if (nicId !== undefined) user.nicId = nicId;
      if (dob !== undefined) user.dob = dob;
      if (gender !== undefined) user.gender = gender;
    }

    if (address !== undefined) user.address = address;
    if (medicalNotes !== undefined) user.medicalNotes = medicalNotes;
    
    if (emergencyContactName !== undefined || emergencyContactPhone !== undefined) {
      user.emergencyContact = {
        name: emergencyContactName !== undefined ? emergencyContactName : user.emergencyContact.name,
        phone: emergencyContactPhone !== undefined ? emergencyContactPhone : user.emergencyContact.phone
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new passwords'
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isGoogleUser) {
      return res.status(400).json({
        success: false,
        message: 'Password change is disabled for accounts registered via Google Sign-In.'
      });
    }

    // Check if current password is correct
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect current password'
      });
    }

    // Password strength check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters and contain at least one uppercase letter, one lowercase letter, and one number'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
