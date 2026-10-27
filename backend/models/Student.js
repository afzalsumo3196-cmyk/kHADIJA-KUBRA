import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        regNo: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        studentId: {
            type: String,
            unique: true,
            sparse: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        faculty: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['Active', 'Graduated', 'Suspended', 'On Leave'],
            default: 'Active',
        },
        role: {
            type: String,
            enum: ['student', 'admin', 'teacher'],
            default: 'student',
        },
        cgpa: {
            type: Number,
            min: 0,
            max: 4.0,
            default: 0,
        },
        attendanceRate: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        phone: {
            type: String,
            default: '',
            trim: true,
        },
        address: {
            type: String,
            default: '',
            trim: true,
        },
        assignedCourses: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }],
        programName: {
            type: String,
            default: "Diploma in Islamic Studies",
            trim: true,
        },
        currentSemester: {
            type: Number,
            default: 1,
            min: 1,
        },
        totalSemesters: {
            type: Number,
            default: 8,
            min: 1,
        },
        feeSlipLink: {
            type: String,
            default: '',
        },
        feeStatus: {
            type: String,
            enum: ['Unpaid', 'Pending', 'Paid', 'Re-upload'],
            default: 'Unpaid',
        },
        feeTotal: {
            type: Number,
            default: 15000,
        },
        feePaid: {
            type: Number,
            default: 3000,
        },
        pendingFeeAmount: {
            type: Number,
            default: 0,
        },
        feeItems: [
            {
                title: { type: String, default: '' },
                term: { type: String, default: '' },
                amount: { type: Number, default: 0 },
                status: { type: String, enum: ['Paid', 'Unpaid', 'Upcoming'], default: 'Unpaid' }
            }
        ],
        feeSlips: [
            {
                url: { type: String },
                amount: { type: Number },
                fileType: { type: String },
                uploadedAt: { type: Date, default: Date.now },
                status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
                reviewedAt: { type: Date },
                reviewNote: { type: String }
            }
        ],
        // Personal Information
        fatherName: { type: String, default: '', trim: true },
        cnic: { type: String, default: '', trim: true },
        dob: { type: Date },
        gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
        nationality: { type: String, default: '', trim: true },
        // Contact Details (Extra)
        presentAddress: { type: String, default: '', trim: true },
        permanentAddress: { type: String, default: '', trim: true },
        // Academic Details
        previousQualification: { type: String, default: '', trim: true },
        boardName: { type: String, default: '', trim: true },
        passingYear: { type: String, default: '', trim: true },
        totalMarks: { type: Number, default: 0 },
        obtainedMarks: { type: Number, default: 0 },
        // Emergency Contact
        emergencyGuardianName: { type: String, default: '', trim: true },
        emergencyRelation: { type: String, default: '', trim: true },
        emergencyContact: { type: String, default: '', trim: true },
        // Document Links
        photoUrl: { type: String, default: '' },
        cnicUrl: { type: String, default: '' },
        marksheetUrl: { type: String, default: '' },
        
        // Teacher Specific Fields
        // Academic Qualifications (Teacher)
        highestDegree: { type: String, default: '', trim: true },
        specialization: { type: String, default: '', trim: true },
        instituteName: { type: String, default: '', trim: true },
        // Teaching Experience
        experienceYears: { type: Number, default: 0 },
        previousInstitute: { type: String, default: '', trim: true },
        keySubjectsTaught: { type: String, default: '', trim: true },
        // Job Preferences
        appliedPosition: { type: String, default: '', trim: true },
        department: { type: String, default: '', trim: true },
        preferredShift: { type: String, default: '', trim: true },
        designation: { type: String, default: '', trim: true },
        dateOfJoining: { type: Date },
        // Document Links (Teacher)
        cvUrl: { type: String, default: '' },
        degreeUrl: { type: String, default: '' },
        coverLetterUrl: { type: String, default: '' },

        // Voucher Information (Optional / Null-Safe)
        voucher: {
            enrollmentDate: { type: Date },
            durationMonths: { type: Number },
            courseEndDateOverride: { type: Date },
            semesterLengthMonths: { type: Number, default: 3 },
            classInstructor: { type: String, default: '' },
            totalDiplomaEnrollment: { type: Number },
            currentDiploma: { type: String, default: '' },
            fees: {
                enrollmentFee: { type: Number, default: 0 },
                perSemesterFee: { type: Number, default: 0 },
                secondSemesterFee: { type: Number, default: 0 },
                secondCertificateFee: { type: Number, default: 0 },
                currentFee: { type: Number, default: 0 },
                remainingSemestersFee: { type: Number, default: 0 },
                certificateFeeCNS: { type: Number, default: 0 },
                certificateFeeCPET: { type: Number, default: 0 }
            },
            lineStatus: {
                enrollmentFee: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
                perSemesterFee: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
                secondSemesterFee: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
                secondCertificateFee: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
                currentFee: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
                remainingSemestersFee: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
                certificateFeeCNS: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
                certificateFeeCPET: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' }
            },
            notesOverride: { type: String, default: '' }
        },

        // Soft Delete Fields
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
    },
    {
        timestamps: true,
    }
);

const Student = mongoose.model('Student', studentSchema);

export default Student;