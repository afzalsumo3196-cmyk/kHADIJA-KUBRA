import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import Course from './models/Course.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const courses = await Course.find({});
        console.log(`Found ${courses.length} courses:`);
        for (const c of courses) {
            console.log(`  Course: ${c.title} (${c.courseCode}), ID: ${c._id}`);
        }

        const teachers = await Student.find({ role: 'teacher' });
        console.log(`Found ${teachers.length} teachers:`);
        for (const t of teachers) {
            console.log(`  Teacher: ${t.name}, Email: ${t.email}`);
            console.log(`    Assigned Courses: ${JSON.stringify(t.assignedCourses)}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
