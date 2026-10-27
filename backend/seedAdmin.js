import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Student from './models/Student.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB...');

    // YEH LINE DATABASE SE DUPLICATE ERROR KO HAMESHA KE LIYE DROP KAR DEGI
    try {
      await Student.collection.dropIndex('studentId_1');
      console.log('✅ Fixed Indexing Issue...');
    } catch (err) {
      // Ignore if index doesn't exist
    }

    const adminExists = await Student.findOne({ regNo: 'ADMIN-001' });
    if (adminExists) {
      console.log('⚠️ Admin account already exists. You can login with RegNo: ADMIN-001');
      process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const newAdmin = new Student({
      name: 'Institute Admin',
      email: 'admin@ktk.edu.pk',
      regNo: 'ADMIN-001',
      studentId: 'ADMIN-001', // Passing both just to be safe
      password: hashedPassword,
      role: 'admin',              
      faculty: 'Administration',
      status: 'Active',
      cgpa: 0,                    
      attendanceRate: 100         
    });

    await newAdmin.save();
    console.log('🎉 Super Admin Created Successfully!');
    console.log('------------------------------------');
    console.log('👉 Registration ID: ADMIN-001');
    console.log('👉 Password: admin123');
    console.log('------------------------------------');
    
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();