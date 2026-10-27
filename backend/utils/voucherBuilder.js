import mongoose from 'mongoose';

export const buildVoucherData = (student) => {
    // Safety check
    if (!student) return null;

    const v = student.voucher || {};
    const f = v.fees || {};
    const s = v.lineStatus || {};

    // Basic Student Info
    const basicInfo = {
        name: student.name || '—',
        studentId: student.studentId || '—',
        regNo: student.regNo || '—',
    };

    // Dates
    const enrollmentDate = v.enrollmentDate || student.createdAt || new Date();
    let courseEndDate = v.courseEndDateOverride;
    
    if (!courseEndDate && v.durationMonths) {
        courseEndDate = new Date(enrollmentDate);
        courseEndDate.setMonth(courseEndDate.getMonth() + v.durationMonths);
    }
    
    // Academic Info
    const totalDiplomaEnrollment = v.totalDiplomaEnrollment || (student.assignedCourses && student.assignedCourses.length) || 0;
    
    let diploma1 = '—';
    if (student.assignedCourses && student.assignedCourses.length > 0) {
        // Handle both populated objects and unpopulated objectIds
        const firstCourse = student.assignedCourses[0];
        diploma1 = typeof firstCourse === 'object' && firstCourse.title ? firstCourse.title : '—';
    }

    const totalDuration = v.durationMonths ? `${v.durationMonths} Months` : '—';
    const currentDiploma = v.currentDiploma || student.programName || '—';
    
    let classInstructor = v.classInstructor || '—';
    if (!v.classInstructor && student.assignedCourses && student.assignedCourses.length > 0) {
        const firstCourse = student.assignedCourses[0];
        if (typeof firstCourse === 'object' && firstCourse.faculty) {
            classInstructor = firstCourse.faculty;
        }
    }

    // Semesters
    const currentSemester = student.currentSemester || 1;
    const totalSemesters = student.totalSemesters || 8;
    const remainingSemesters = Math.max(0, totalSemesters - currentSemester);

    const academic = {
        totalDiplomaEnrollment,
        diploma1,
        totalDuration,
        currentDiploma,
        currentSemester,
        totalSemesters,
        remainingSemesters,
        classInstructor,
    };

    const dates = {
        enrollmentDate: enrollmentDate,
        courseEndDate: courseEndDate || null,
        currentDate: new Date(),
    };

    // Fee Lines
    const fees = {
        enrollmentFee: Number(f.enrollmentFee) || 0,
        perSemesterFee: Number(f.perSemesterFee) || 0,
        secondSemesterFee: Number(f.secondSemesterFee) || 0,
        secondCertificateFee: Number(f.secondCertificateFee) || 0,
        currentFee: Number(f.currentFee) || 0,
        remainingSemestersFee: Number(f.remainingSemestersFee) || 0,
        certificateFeeCNS: Number(f.certificateFeeCNS) || 0,
        certificateFeeCPET: Number(f.certificateFeeCPET) || 0,
    };

    const lineStatus = {
        enrollmentFee: s.enrollmentFee || 'Unpaid',
        perSemesterFee: s.perSemesterFee || 'Unpaid',
        secondSemesterFee: s.secondSemesterFee || 'Unpaid',
        secondCertificateFee: s.secondCertificateFee || 'Unpaid',
        currentFee: s.currentFee || 'Unpaid',
        remainingSemestersFee: s.remainingSemestersFee || 'Unpaid',
        certificateFeeCNS: s.certificateFeeCNS || 'Unpaid',
        certificateFeeCPET: s.certificateFeeCPET || 'Unpaid',
    };

    // Totals fallback for old students
    let totalFee = 
        fees.enrollmentFee + 
        fees.perSemesterFee + 
        fees.secondSemesterFee + 
        fees.secondCertificateFee + 
        fees.currentFee + 
        fees.remainingSemestersFee + 
        fees.certificateFeeCNS + 
        fees.certificateFeeCPET;

    // If no voucher fees were defined but student has old feeTotal > 0, fallback to old feeTotal
    if (totalFee === 0 && Number(student.feeTotal) > 0) {
        totalFee = Number(student.feeTotal);
        // Map old feeItems to fees if available to show in breakdown, else it will just show in totals
        if (student.feeItems && student.feeItems.length > 0) {
            // Rough mapping if they match standard titles
            student.feeItems.forEach(item => {
                if (item.title === 'Enrollment Date + Fee') { fees.enrollmentFee = Number(item.amount); lineStatus.enrollmentFee = item.status; }
                else if (item.title === 'Per Semester Fee') { fees.perSemesterFee = Number(item.amount); lineStatus.perSemesterFee = item.status; }
                else if (item.title === 'Remaining / Next Semester Fee') { fees.remainingSemestersFee = Number(item.amount); lineStatus.remainingSemestersFee = item.status; }
                else if (item.title === 'Certificate Fee (CNS/CPET)') { fees.certificateFeeCNS = Number(item.amount); lineStatus.certificateFeeCNS = item.status; }
            });
        }
    }

    const paidFee = Number(student.feePaid) || 0;
    const pendingFee = Math.max(0, totalFee - paidFee);

    const totals = {
        totalFee,
        paidFee,
        pendingFee
    };

    // Voucher Number
    const d = new Date();
    const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    const safeId = (basicInfo.studentId && basicInfo.studentId !== '—') ? basicInfo.studentId : basicInfo.regNo;
    const voucherNumber = `KTK-${safeId}-${ym}`;

    return {
        student: basicInfo,
        academic,
        dates,
        fees,
        lineStatus,
        totals,
        voucherNumber,
        notesOverride: v.notesOverride || ''
    };
};
