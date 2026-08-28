const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const SlotHold = require('../models/SlotHold');
const ContactMessage = require('../models/ContactMessage');
const Notification = require('../models/Notification');
const AdminLog = require('../models/AdminLog');

// Load env variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dental_avenue');
    console.log('Database connected for seeding...');

    // Clear existing data
    await User.deleteMany();
    await Doctor.deleteMany();
    await Appointment.deleteMany();
    await SlotHold.deleteMany();
    await ContactMessage.deleteMany();
    await Notification.deleteMany();
    await AdminLog.deleteMany();
    console.log('Existing collections cleared.');

    // Seed Admin Account
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      throw new Error('Missing INITIAL_ADMIN_EMAIL or INITIAL_ADMIN_PASSWORD in environment variables. Please check your .env file.');
    }
    
    const admin = await User.create({
      name: 'Administrator',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      phone: '+94 76 727 0222',
      isVerified: true
    });
    console.log(`Admin account seeded: ${admin.email}`);

    // Seed Doctor Profiles
    const weekdaySlots = ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'];
    const weekendSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'];

    const doctors = [
      {
        name: 'Dr. Sarah Jenkins',
        qualification: 'DDS, MS (Columbia University)',
        experience: 12,
        profileImage: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=400&h=400',
        bio: 'Dr. Jenkins specializes in straightening teeth, adjusting bite patterns, and jaw alignments. She utilizes state-of-the-art clear aligners and modern aesthetic brackets.',
        availability: {
          monday: weekdaySlots,
          wednesday: weekdaySlots,
          friday: weekdaySlots
        }
      },
      {
        name: 'Dr. Marcus Vance',
        qualification: 'DMD, MD (Harvard Dental Medicine)',
        experience: 15,
        profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400&h=400',
        bio: 'Dr. Vance is a double-degree oral surgeon performing wisdom tooth extractions, bone grafting, dental implants, and corrective jaw surgeries with maximum comfort.',
        availability: {
          tuesday: weekdaySlots,
          thursday: weekdaySlots,
          saturday: weekendSlots,
          sunday: weekendSlots
        }
      },
      {
        name: 'Dr. Emily Taylor',
        qualification: 'DDS (UCLA School of Dentistry)',
        experience: 8,
        profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400&h=400',
        bio: 'Dr. Taylor provides cosmetic enhancements, porcelain veneers, teeth whitening, and complete smile makeovers, focusing on healthy, vibrant, and natural-looking teeth.',
        availability: {
          monday: weekdaySlots,
          tuesday: weekdaySlots,
          thursday: weekdaySlots
        }
      },
      {
        name: 'Dr. Robert Chen',
        qualification: 'DDS (NYU College of Dentistry)',
        experience: 10,
        profileImage: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400&h=400',
        bio: 'Dr. Chen is dedicated to making dental visits fun and fear-free for children of all ages. He specializes in preventative care, cavity management, and habit breaking.',
        availability: {
          wednesday: weekdaySlots,
          friday: weekdaySlots,
          saturday: weekendSlots,
          sunday: weekendSlots
        }
      }
    ];

    await Doctor.insertMany(doctors);
    console.log(`${doctors.length} doctors seeded.`);

    console.log('Data successfully seeded!');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
