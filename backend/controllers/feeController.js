import Student from '../models/Student.js';
import Setting from '../models/Setting.js';
import { buildVoucherData } from '../utils/voucherBuilder.js';

// Check deadline
const checkDeadline = async () => {
    let deadlineStr = process.env.FEE_DEADLINE; // Fallback

    const setting = await Setting.findOne({ key: 'FEE_DEADLINE' });
    if (setting && setting.value) {
        deadlineStr = setting.value;
    }

    if (!deadlineStr) return true; // No deadline set, always allow
    const deadlineDate = new Date(deadlineStr);
    const currentDate = new Date();
    // Reset time for both to compare just dates (optional, but good practice)
    deadlineDate.setHours(23, 59, 59, 999);
    return currentDate <= deadlineDate;
};

export const getStudentFeeDetails = async (req, res) => {
    try {
        const { regNo } = req.params;

        // Verify deadline
        const isAllowed = await checkDeadline();
        if (!isAllowed) {
            return res.status(403).json({ success: false, message: 'Fees jama karwane ki tareeq guzar chuki hai!' });
        }

        const student = await Student.findOne({ regNo });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found with this Roll Number/CNIC.' });
        }

        const bankSetting = await Setting.findOne({ key: 'BANK_DETAILS' });
        const bankDetails = bankSetting ? bankSetting.value : {
            bankName: 'Meezan Bank Ltd.',
            accountTitle: 'Khadeeja Tul Kubra Institute',
            accountNumber: '0123 4567 8901',
            iban: 'PK12 MEZN 0001 2345 6789'
        };

        const defaultFeeItems = [
            { title: "Enrollment Date + Fee", term: "Initial Enrollment", amount: 3000, status: "Paid" },
            { title: "Per Semester Fee", term: "Month 1 - 2", amount: 6000, status: "Unpaid" },
            { title: "Remaining / Next Semester Fee", term: "Month 3 - 4", amount: 4500, status: "Upcoming" },
            { title: "Certificate Fee (CNS/CPET)", term: "End of Course", amount: 1500, status: "Upcoming" }
        ];

        const feeItems = (student.feeItems && student.feeItems.length > 0) ? student.feeItems : defaultFeeItems;
        const calcTotal = feeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const calcPaid = feeItems.filter(item => item.status === 'Paid').reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

        res.status(200).json({
            success: true,
            student: {
                id: student._id,
                name: student.name,
                regNo: student.regNo,
                programName: student.programName,
                feeStatus: student.feeStatus,
                feeTotal: calcTotal,
                feePaid: calcPaid,
                feeItems: feeItems,
            },
            feeAmount: Math.max(0, calcTotal - calcPaid),
            bankDetails
        });
    } catch (error) {
        console.error('Error fetching student fee details:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching details.' });
    }
};

export const submitFeeSlip = async (req, res) => {
    try {
        const { studentId, amount } = req.body;

        // Verify deadline again just in case
        const isAllowed = await checkDeadline();
        if (!isAllowed) {
            return res.status(403).json({ success: false, message: 'Fees jama karwane ki tareeq guzar chuki hai!' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Fee slip image is required.' });
        }

        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            return res.status(400).json({ success: false, message: 'Valid fee amount is required.' });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        const fileUrl = req.file.path;
        
        student.feeSlipLink = fileUrl; // Legacy support
        student.feeStatus = 'Pending';
        student.pendingFeeAmount = Number(amount);
        
        // Add to history
        const fileExt = req.file.originalname ? req.file.originalname.split('.').pop().toLowerCase() : '';
        const isPdf = fileExt === 'pdf' || req.file.mimetype === 'application/pdf';
        
        student.feeSlips.push({
            url: fileUrl,
            amount: Number(amount),
            fileType: isPdf ? 'pdf' : 'image',
            uploadedAt: new Date(),
            status: 'Pending'
        });

        await student.save();

        res.status(200).json({ success: true, message: 'Fee slip uploaded successfully. Status updated to Pending.' });
    } catch (error) {
        console.error('Error submitting fee slip:', error);
        res.status(500).json({ success: false, message: 'Server error while submitting fee slip.' });
    }
};

export const getMyVoucher = async (req, res) => {
    try {
        const studentId = req.user.userId || req.user._id || req.user.id;
        const student = await Student.findById(studentId).populate('assignedCourses');
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        const voucherData = buildVoucherData(student);
        
        // Get Bank Details
        const bankSetting = await Setting.findOne({ key: 'BANK_DETAILS' });
        const bankDetails = bankSetting ? bankSetting.value : {
            bankName: 'Meezan Bank Ltd.',
            accountTitle: 'Khadeeja Tul Kubra Institute',
            accountNumber: '0123 4567 8901',
            iban: 'PK12 MEZN 0001 2345 6789'
        };

        // Get Deadline
        const deadlineSetting = await Setting.findOne({ key: 'FEE_DEADLINE' });
        const deadline = deadlineSetting ? deadlineSetting.value : null;

        res.status(200).json({ 
            success: true, 
            voucher: voucherData,
            feeStatus: student.feeStatus,
            bankDetails,
            deadline
        });
    } catch (error) {
        console.error('Error fetching my voucher:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
