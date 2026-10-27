import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import Course from './models/Course.js';

dotenv.config();

const fixFees = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const students = await Student.find({ role: 'student' }).populate('assignedCourses');
    let updatedCount = 0;
    
    for (let student of students) {
       let actualFeeTotal = 0;
       if (student.assignedCourses && student.assignedCourses.length > 0) {
           actualFeeTotal = student.assignedCourses.reduce((sum, course) => sum + (course.fees || 0), 0);
       }
       if (student.feeTotal !== actualFeeTotal) {
           console.log(`Updating student ${student.regNo}: feeTotal ${student.feeTotal} -> ${actualFeeTotal}`);
           student.feeTotal = actualFeeTotal;
           await student.save();
           updatedCount++;
       }
    }
    console.log(`Done! Updated ${updatedCount} students.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixFees();
