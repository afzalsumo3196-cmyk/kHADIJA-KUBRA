import mongoose from 'mongoose';

const transcriptSchema = new mongoose.Schema(
    {
        regNo: {
            type: String,
            required: true,
        },
        semester: {
            type: String,
            required: true,
        },
        fileUrl: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Transcript = mongoose.model('Transcript', transcriptSchema);

export default Transcript;
