import { jsPDF } from 'jspdf';

export const formatDate = (dateStr) => {
  if (!dateStr || dateStr === '—') return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatRs = (amount) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '—';
  return `Rs. ${Number(amount).toLocaleString()}`;
};

const loadImage = (src) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
  });
};

export const normalizeVoucherData = (apiResponse) => {
  if (!apiResponse) return null;
  // If it's already the inner voucher object
  if (apiResponse.student && apiResponse.academic) return apiResponse;
  // If it's the wrapper response
  if (apiResponse.voucher) return apiResponse.voucher;
  return null;
};

export const generateVoucherPdf = async (data, bankDetails, deadline, isNodeMode = false, nodeLogoData = null) => {
  const voucher = normalizeVoucherData(data);
  
  if (!voucher || !voucher.student || (!voucher.student.name && !voucher.student.studentId)) {
    if (!isNodeMode) {
      import('react-hot-toast').then(m => m.default.error('Voucher data could not be loaded'));
    }
    console.error("Invalid or empty voucher data passed to PDF generator", data);
    return null;
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  doc.setFont('times', 'normal');

  const student = voucher.student || {};
  const academic = voucher.academic || {};
  const dates = voucher.dates || {};
  const fees = voucher.fees || {};
  const status = voucher.lineStatus || {};
  const totals = voucher.totals || {};

  let logoData = nodeLogoData;
  if (!isNodeMode) {
    logoData = await loadImage('/logo.png');
  }

  // Configuration for compact start
  const baseConf = {
    logoW: 26, logoH: 26, logoY: 8,
    titleGap: 3, titleH: 8, titleFont: 17,
    voucherGap: 4, voucherH: 7, voucherFont: 13,
    studentGap: 5, studentLineGap: 4.6, studentFont: 10,
    tableGap: 4, headerH: 10, rowH: 8.5, rowLargeH: 10, tableFont: 10.5, tableFontSmall: 8,
    summaryGap: 4, summaryRowH: 5.8, summaryFont: 8.5,
    noteGap: 6, noteHeadH: 4.5, noteFont: 9, bulletGap: 4.2, bulletFont: 8.5
  };

  // Measure pass
  let startY = baseConf.logoY + baseConf.logoH;
  const cTitle = baseConf.titleGap + baseConf.titleH;
  const cVoucher = baseConf.voucherGap + baseConf.voucherH;
  const cStudent = baseConf.studentGap + (9 * baseConf.studentLineGap);
  const cTable = baseConf.tableGap + baseConf.headerH + (7 * baseConf.rowH) + (2 * baseConf.rowLargeH);
  const cSummary = baseConf.summaryGap + (6 * baseConf.summaryRowH);
  const cNote = baseConf.noteGap + baseConf.noteHeadH + (4 * baseConf.bulletGap);
  
  const contentTotal = cTitle + cVoucher + cStudent + cTable + cSummary + cNote;
  const availableContent = 271 - startY;
  
  let scale = 1;
  if (contentTotal > availableContent) {
    scale = availableContent / contentTotal;
  }
  
  const fontScale = Math.max(0.85, scale); // prevent fonts from becoming microscopic
  const finalFont = (size) => Math.max(8, size * fontScale);

  // Apply scale to dimensions
  const titleGap = baseConf.titleGap * scale;
  const titleH = baseConf.titleH * scale;
  const voucherGap = baseConf.voucherGap * scale;
  const voucherH = baseConf.voucherH * scale;
  const studentGap = baseConf.studentGap * scale;
  const studentLineGap = baseConf.studentLineGap * scale;
  const tableGap = baseConf.tableGap * scale;
  const headerH = baseConf.headerH * scale;
  const rowH = baseConf.rowH * scale;
  const rowLargeH = baseConf.rowLargeH * scale;
  const summaryGap = baseConf.summaryGap * scale;
  const summaryRowH = baseConf.summaryRowH * scale;
  const noteGap = baseConf.noteGap * scale;
  const noteHeadH = baseConf.noteHeadH * scale;
  const bulletGap = baseConf.bulletGap * scale;

  // Drawing cursors
  let cursorY = baseConf.logoY;

  if (logoData) {
    doc.addImage(logoData, 'PNG', 105 - (baseConf.logoW / 2), cursorY, baseConf.logoW, baseConf.logoH);
  }
  cursorY += baseConf.logoH;

  const truncateText = (text, maxWidth) => {
    if (!text) return '—';
    let str = String(text);
    if (doc.getTextWidth(str) <= maxWidth) return str;
    while (str.length > 0 && doc.getTextWidth(str + '...') > maxWidth) {
      str = str.slice(0, -1);
    }
    return str + '...';
  };

  const drawBoxedText = (text, centerY, h, fill, color, fontSize, bold) => {
    doc.setFont('times', bold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(color);
    const tw = doc.getTextWidth(text);
    const pad = 4;
    const boxW = tw + pad * 2;
    doc.setFillColor(fill);
    doc.rect(105 - (boxW / 2), centerY - h / 2, boxW, h, 'F');
    const baselineY = centerY + (fontSize * 0.352777 * 0.35);
    doc.text(text, 105, baselineY, { align: 'center' });
  };

  // Title
  cursorY += titleGap + (titleH / 2);
  drawBoxedText("KHADEEJA TUL KUBRA ISLAMIC INSTITUTE", cursorY, titleH, '#d9d9d9', '#000000', finalFont(baseConf.titleFont), true);
  cursorY += (titleH / 2);

  // Voucher
  cursorY += voucherGap + (voucherH / 2);
  drawBoxedText("FEE VOUCHER", cursorY, voucherH, '#006400', '#ffffff', finalFont(baseConf.voucherFont), true);
  cursorY += (voucherH / 2);

  // Student block
  cursorY += studentGap;
  const drawStudentLine = (label, val) => {
    cursorY += studentLineGap;
    doc.setFontSize(finalFont(baseConf.studentFont));
    doc.setFont('times', 'bold');
    doc.setTextColor('#000000');
    doc.text(label + ":", 15, cursorY);
    const lw = doc.getTextWidth(label + ": ");
    doc.setFont('times', 'normal');
    const safeVal = truncateText(val, 180 - lw);
    doc.text(safeVal, 15 + lw, cursorY);
  };

  drawStudentLine("Student Name", student.name);
  drawStudentLine("Student ID", student.studentId);
  drawStudentLine("Registration Number", student.regNo);
  drawStudentLine("Total Diploma Enrollment", String(academic.totalDiplomaEnrollment || '—'));
  drawStudentLine("Diploma 1", academic.diploma1);
  drawStudentLine("Total Duration", academic.totalDuration);
  drawStudentLine("Current Diploma", academic.currentDiploma);
  drawStudentLine("Current Semester", String(academic.currentSemester || '—'));
  drawStudentLine("Class Instructor", academic.classInstructor);

  // Main Fee Table
  cursorY += tableGap;
  const tableX = 15;
  const colW = 90;

  const drawCell = (x, y, w, h, text, isHeader, isBlue, isCol2, text2) => {
    doc.setFillColor(isHeader || isBlue ? '#9DC3E6' : '#ffffff');
    doc.setDrawColor('#000000');
    doc.setLineWidth(0.3);
    doc.rect(x, y, w, h, 'FD');
    doc.setTextColor('#000000');
    doc.setFont('times', isHeader || !isCol2 ? 'bold' : 'normal');
    doc.setFontSize(finalFont(isHeader ? 11 : baseConf.tableFont));
    
    const align = isHeader ? 'center' : 'left';
    const tx = isHeader ? x + (w / 2) : x + 3;
    
    if (text2) {
      const ty1 = y + (h / 2) - 1.5;
      const ty2 = y + (h / 2) + 2.5;
      doc.text(truncateText(text, w - 6), tx, ty1, { align });
      doc.setFont('times', 'normal');
      doc.setFontSize(finalFont(baseConf.tableFontSmall));
      doc.text(truncateText(text2, w - 6), tx, ty2, { align });
    } else if (text.includes('\n')) {
      const parts = text.split('\n');
      const ty1 = y + (h / 2) - 2;
      const ty2 = y + (h / 2) + 2;
      doc.text(truncateText(parts[0], w - 6), tx, ty1, { align });
      doc.text(truncateText(parts[1], w - 6), tx, ty2, { align });
    } else {
      const ty = y + (h / 2) + (doc.getFontSize() * 0.352777 * 0.35);
      doc.text(truncateText(text, w - 6), tx, ty, { align });
    }
  };

  drawCell(tableX, cursorY, colW, headerH, "Fee Type", true, false, false);
  drawCell(tableX + colW, cursorY, colW, headerH, "Amount (PKR)", true, false, false);
  cursorY += headerH;

  const rows = [
    { type: 'Enrollment Date+Fee\nRecord of Semes-1', amount: formatRs(fees.enrollmentFee), blue: false, h: rowLargeH },
    { type: 'Enrollment Date', amount: formatDate(dates.enrollmentDate), blue: true, h: rowH },
    { type: 'Per Semester fee', amount: formatRs(fees.perSemesterFee), blue: false, h: rowH },
    { type: 'Current Semester', amount: academic.currentSemester && academic.totalSemesters ? `${academic.currentSemester} of ${academic.totalSemesters}` : (academic.currentSemester || '—'), blue: true, h: rowH },
    { 
      type: 'Second Semester\nfee+2nd Certificate', 
      amount: formatRs((Number(fees.secondSemesterFee) || 0) + (Number(fees.secondCertificateFee) || 0)), 
      amount2: `Semester: ${formatRs(fees.secondSemesterFee)} + Certificate: ${formatRs(fees.secondCertificateFee)}`,
      blue: false, h: rowLargeH 
    },
    { type: 'Current Date+Fee', amount: `${formatDate(new Date().toISOString())} — ${formatRs(fees.currentFee)}`, blue: true, h: rowH },
    { type: 'Remaining Semesters', amount: academic.remainingSemesters !== undefined && academic.remainingSemesters !== '—' ? `${academic.remainingSemesters} remaining — ${formatRs(fees.remainingSemestersFee)}` : formatRs(fees.remainingSemestersFee), blue: false, h: rowH },
    { type: 'Certificate Fee of CNS', amount: `${formatRs(fees.certificateFeeCNS)} (${status.certificateFeeCNS || 'Unpaid'})`, blue: true, h: rowH },
    { type: 'Certificate Fee of CPET', amount: `${formatRs(fees.certificateFeeCPET)} (${status.certificateFeeCPET || 'Unpaid'})`, blue: false, h: rowH },
  ];

  for (const r of rows) {
    drawCell(tableX, cursorY, colW, r.h, r.type, false, r.blue, false);
    drawCell(tableX + colW, cursorY, colW, r.h, r.amount, false, r.blue, true, r.amount2);
    cursorY += r.h;
  }

  // Summary Table
  cursorY += summaryGap;
  const sC1 = 30;
  const sC2 = 60;
  
  const drawSummaryCell = (x, y, w, h, text, isLabel) => {
    doc.setFillColor(isLabel ? '#f0f0f0' : '#ffffff');
    doc.setDrawColor('#000000');
    doc.setLineWidth(0.2);
    doc.rect(x, y, w, h, 'FD');
    doc.setTextColor('#000000');
    doc.setFont('times', isLabel ? 'bold' : 'normal');
    doc.setFontSize(finalFont(baseConf.summaryFont));
    const ty = y + (h / 2) + (doc.getFontSize() * 0.352777 * 0.35);
    doc.text(truncateText(text || '—', w - 4), x + 2, ty);
  };

  const drawSummaryRow = (l1, v1, l2, v2) => {
    drawSummaryCell(tableX, cursorY, sC1, summaryRowH, l1, true);
    drawSummaryCell(tableX + sC1, cursorY, sC2, summaryRowH, v1, false);
    drawSummaryCell(tableX + sC1 + sC2, cursorY, sC1, summaryRowH, l2, true);
    drawSummaryCell(tableX + sC1 * 2 + sC2, cursorY, sC2, summaryRowH, v2, false);
    cursorY += summaryRowH;
  };

  drawSummaryRow("Total Fee", formatRs(totals.totalFee), "Issue Date", formatDate(new Date().toISOString()));
  drawSummaryRow("Paid Fee", formatRs(totals.paidFee), "Due Date", formatDate(deadline));
  drawSummaryRow("Pending Fee", formatRs(totals.pendingFee), "Course End Date", formatDate(dates.courseEndDate));
  drawSummaryRow("Bank Name", bankDetails?.bankName, "Voucher No", voucher.voucherNumber || '—');
  drawSummaryRow("Account Title", bankDetails?.accountTitle, "Account No", bankDetails?.accountNumber);
  
  // IBAN
  drawSummaryCell(tableX, cursorY, sC1, summaryRowH, "IBAN", true);
  drawSummaryCell(tableX + sC1, cursorY, sC2 * 2 + sC1, summaryRowH, bankDetails?.iban, false);
  cursorY += summaryRowH;

  // Notes
  cursorY += noteGap;
  doc.setFontSize(finalFont(baseConf.noteFont));
  doc.setFont('times', 'bold');
  doc.text("Note:", tableX, cursorY);
  cursorY += noteHeadH;
  
  const bullets = [
    "Exams will be taken on Zoom.",
    "90 Percent attendance is mandatory to appear in Exams.",
    "If students skip in between Course no Marksheet or Certificates will be issue.",
    "If student face any Sort of Issue it will be handled directly by Head."
  ];

  doc.setFontSize(finalFont(baseConf.bulletFont));
  doc.setFont('times', 'normal');
  for (let i = 0; i < bullets.length; i++) {
    cursorY += bulletGap;
    doc.text("•", tableX + 2, cursorY);
    
    if (i === 2) {
      const tw = doc.getTextWidth(bullets[i]);
      doc.setFillColor('#ffff00');
      doc.rect(tableX + 5, cursorY - (finalFont(baseConf.bulletFont)*0.352777), tw, finalFont(baseConf.bulletFont)*0.352777 + 1.2, 'F');
      doc.text(bullets[i], tableX + 5, cursorY);
    } else {
      doc.text(bullets[i], tableX + 5, cursorY);
    }
  }

  // Final check
  console.log(`Final Content Y: ${cursorY.toFixed(2)}mm, Max Allowed: 271mm, Scale Used: ${scale.toFixed(3)}`);
  if (cursorY > 271) {
    console.error("Warning: Content overflowed 271mm bound!");
  }

  // Footer (fixed at y=274)
  const footY = 274;
  doc.setFontSize(finalFont(8));
  doc.setFont('times', 'normal');
  doc.setTextColor('#000000');
  doc.text("If you have any query kindly Gmail us at ", tableX, footY);
  const w1 = doc.getTextWidth("If you have any query kindly Gmail us at ");
  doc.setTextColor('#0000ff');
  doc.text("khadeejatulkubraislamicinstitu@gmail.com", tableX + w1, footY);
  doc.setTextColor('#000000');
  doc.text("or contact us with our Helpline", tableX, footY + 4);
  doc.text("Desk no: +92 3164092870", tableX, footY + 8);

  const numPages = doc.getNumberOfPages();
  console.assert(numPages === 1, "PDF Page count is not 1!");
  console.log("PDF Pages Count:", numPages);
  
  if (!isNodeMode) {
    const safeId = (student.studentId || student.regNo || 'Unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
    const outName = `Fee_Voucher_${safeId}.pdf`;
    doc.save(outName);
  } else {
    return doc;
  }
};
