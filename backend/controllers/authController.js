import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Student from '../models/Student.js';

export const login = async (req, res) => {
    try {
        const { regNo, studentId, email, password } = req.body;

        // Support login via regNo, studentId, or email
        const identifier = regNo || studentId || email;

        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: 'Please provide credentials' });
        }

        // Find student by regNo or email
        const student = await Student.findOne({
            $or: [{ regNo: identifier }, { email: identifier }]
        });

        if (!student) {
            return res.status(404).json({ success: false, message: 'Account not found!' });
        }

        const isMatch = await bcrypt.compare(password, student.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Wrong password!' });
        }

        const token = jwt.sign(
            { id: student._id, role: student.role },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful!',
            token,
            student: {
                _id: student._id,
                name: student.name,
                regNo: student.regNo,
                email: student.email,
                faculty: student.faculty,
                status: student.status,
                cgpa: student.cgpa,
                attendanceRate: student.attendanceRate,
                role: student.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getProfile = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id).select('-password');
        
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        res.status(200).json({ success: true, student });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { 
            email, phone, address,
            fatherName, cnic, dob, gender, nationality,
            presentAddress, permanentAddress,
            designation, dateOfJoining
        } = req.body;
        const studentId = req.user.id;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        if (email !== undefined) student.email = email;
        if (phone !== undefined) student.phone = phone;
        if (address !== undefined) student.address = address;
        
        if (fatherName !== undefined) student.fatherName = fatherName;
        if (cnic !== undefined) student.cnic = cnic;
        if (dob !== undefined) student.dob = dob;
        if (gender !== undefined) student.gender = gender;
        if (nationality !== undefined) student.nationality = nationality;
        if (presentAddress !== undefined) student.presentAddress = presentAddress;
        if (permanentAddress !== undefined) student.permanentAddress = permanentAddress;

        if (designation !== undefined) student.designation = designation;
        if (dateOfJoining !== undefined) student.dateOfJoining = dateOfJoining;

        if (req.file) {
            student.photoUrl = req.file.path;
        }

        await student.save();

        res.status(200).json({ 
            success: true, 
            message: 'Profile updated successfully', 
            student: {
                _id: student._id,
                name: student.name,
                regNo: student.regNo,
                email: student.email,
                phone: student.phone,
                address: student.address,
                faculty: student.faculty,
                status: student.status,
                cgpa: student.cgpa,
                attendanceRate: student.attendanceRate,
                fatherName: student.fatherName,
                cnic: student.cnic,
                dob: student.dob,
                gender: student.gender,
                nationality: student.nationality,
                presentAddress: student.presentAddress,
                permanentAddress: student.permanentAddress,
                photoUrl: student.photoUrl,
                programName: student.programName,
                currentSemester: student.currentSemester,
                designation: student.designation,
                dateOfJoining: student.dateOfJoining
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
