import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        courseCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        faculty: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        semester: {
            type: Number,
            required: true,
            default: 1,
            min: 1,
        },
        classDays: {
            type: [String],
            required: true,
        },
        classTime: {
            type: String,
            required: true,
        },
        outlineTitle: {
            type: String,
            default: '',
        },
        outlineDescription: {
            type: String,
            default: '',
        },
        outlineFile: {
            type: String,
            default: '',
        },
        fees: {
            type: Number,
            required: true,
            default: 0,
        }
    },
    {
        timestamps: true,
    }
);

const Course = mongoose.model('Course', courseSchema);

export default Course;
