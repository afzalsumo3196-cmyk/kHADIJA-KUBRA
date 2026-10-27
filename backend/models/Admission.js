import mongoose from 'mongoose';

const admissionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        fatherName: {
            type: String,
            required: true,
            trim: true,
        },
        dob: {
            type: String,
            default: '',
            trim: true,
        },
        cnic: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        country: {
            type: String,
            required: true,
            trim: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },
        nationality: {
            type: String,
            default: '',
            trim: true,
        },
        religion: {
            type: String,
            default: 'Islam',
            trim: true,
        },
        maritalStatus: {
            type: String,
            default: 'Single',
            trim: true,
        },
        qualification: {
            type: String,
            required: true,
            trim: true,
        },
        number: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        fatherPhone: {
            type: String,
            default: '',
            trim: true,
        },
        husbandPhone: {
            type: String,
            default: '',
            trim: true,
        },
        course: {
            type: String,
            default: '',
            trim: true,
        },
        enrollmentPlan: {
            type: String,
            default: '',
            trim: true,
        },
        programs: [{
            type: String,
            trim: true,
        }],
        fileUrls: {
            documentFile: { type: String, default: '' },
            passportPhoto: { type: String, default: '' },
            cnicPhoto: { type: String, default: '' },
        },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending',
        },
    },
    {
        timestamps: true,
    }
);

const Admission = mongoose.model('Admission', admissionSchema);
export default Admission;
