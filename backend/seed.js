import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Student from './models/Student.js'; // Adjust path if needed

dotenv.config();

const seedStudent = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI); // Make sure you have MONGO_URI in .env
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

  const newStudent = new Student({
      name: 'Ayesha Ahmed',
      email: 'ayesha@student.edu.pk',
      regNo: 'KTK-2026-041',
      password: hashedPassword,
      faculty: 'Aalima',
      status: 'Active', // <--- Isko 'Active' kar dein
      cgpa: 3.85,
      attendanceRate: 92
    });

    await newStudent.save();
    console.log('✅ Test Student Created! You can now login.');
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedStudent();