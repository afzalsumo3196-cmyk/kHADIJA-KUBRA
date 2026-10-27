import { useEffect, useState, forwardRef } from 'react';
import { formatDate, formatRs, normalizeVoucherData } from '../utils/voucherPdf';

const PAGE_STYLE = {
  width: '794px',
  height: '1123px',
  backgroundColor: '#ffffff',
  color: '#000000',
  fontFamily: '"Times New Roman", Times, serif',
  padding: '30px',
  boxSizing: 'border-box',
  overflow: 'hidden',
  position: 'relative',
  margin: 0
};

const VoucherTemplate = forwardRef(({ data, bankDetails, deadline }, ref) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = '/logo.png';
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(true);
  }, []);

  if (!data) return null;

  const voucher = normalizeVoucherData(data) || {};
  const student = voucher.student || {};
  const academic = voucher.academic || {};
  const dates = voucher.dates || {};
  const fees = voucher.fees || {};
  const status = voucher.lineStatus || {};
  const totals = voucher.totals || {};

  const TdLabel = { border: '1px solid #000000', padding: '6px 8px', fontWeight: 'bold', boxSizing: 'border-box' };
  const TdValue = { border: '1px solid #000000', padding: '6px 8px', boxSizing: 'border-box' };

  return (
    <div ref={ref} style={{ ...PAGE_STYLE, opacity: imageLoaded ? 1 : 0 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <img src="/logo.png" alt="Logo" style={{ width: '100px', height: 'auto', display: 'block', margin: '0 auto 5px auto' }} />
        <div style={{ display: 'inline-block', backgroundColor: '#d9d9d9', padding: '2px 8px', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '22px', fontWeight: 'bold', fontFamily: '"Times New Roman", Times, serif', margin: 0, padding: 0 }}>KHADEEJA TUL KUBRA ISLAMIC INSTITUTE</div>
        </div>
        <div style={{ marginTop: '10px' }}>
          <span style={{ backgroundColor: '#006400', color: '#00b000', fontSize: '18px', fontWeight: 'bold', padding: '4px 12px', display: 'inline-block', fontFamily: '"Times New Roman", Times, serif', boxSizing: 'border-box' }}>
            FEE VOUCHER
          </span>
        </div>
      </div>

      {/* Student Info */}
      <div style={{ marginBottom: '15px', fontSize: '12px', lineHeight: '1.35', fontFamily: '"Times New Roman", Times, serif' }}>
        <div style={{ fontWeight: 'bold' }}>Student Name: <span style={{ fontWeight: 'normal' }}>{student.name || '—'}</span></div>
        <div style={{ fontWeight: 'bold' }}>Student ID: <span style={{ fontWeight: 'normal' }}>{student.studentId || '—'}</span></div>
        <div style={{ fontWeight: 'bold' }}>Registration Number: <span style={{ fontWeight: 'normal' }}>{student.regNo || '—'}</span></div>
        <div style={{ fontWeight: 'bold' }}>Total Diploma Enrollment: <span style={{ fontWeight: 'normal' }}>{academic.totalDiplomaEnrollment || '—'}</span></div>
        <div style={{ fontWeight: 'bold' }}>Diploma 1: <span style={{ fontWeight: 'normal' }}>{academic.diploma1 || '—'}</span></div>
        <div style={{ fontWeight: 'bold' }}>Total Duration: <span style={{ fontWeight: 'normal' }}>{academic.totalDuration || '—'}</span></div>
        <div style={{ fontWeight: 'bold' }}>Current Diploma: <span style={{ fontWeight: 'normal' }}>{academic.currentDiploma || '—'}</span></div>
        <div style={{ fontWeight: 'bold' }}>Current Semester: <span style={{ fontWeight: 'normal' }}>{academic.currentSemester || '—'}</span></div>
        <div style={{ fontWeight: 'bold' }}>Class Instructor: <span style={{ fontWeight: 'normal' }}>{academic.classInstructor || '—'}</span></div>
      </div>

      {/* Main Fee Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '15px', fontFamily: '"Times New Roman", Times, serif' }}>
        <thead>
          <tr style={{ backgroundColor: '#9DC3E6' }}>
            <th style={{ border: '1px solid #000000', padding: '6px', height: '44px', width: '50%', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', boxSizing: 'border-box' }}>Fee Type</th>
            <th style={{ border: '1px solid #000000', padding: '6px', height: '44px', width: '50%', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', boxSizing: 'border-box' }}>Amount (PKR)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ backgroundColor: '#ffffff' }}>
            <td style={TdLabel}>Enrollment Date+Fee<br/>Record of Semes-1</td>
            <td style={TdValue}>{formatRs(fees.enrollmentFee)}</td>
          </tr>
          <tr style={{ backgroundColor: '#9DC3E6' }}>
            <td style={TdLabel}>Enrollment Date</td>
            <td style={TdValue}>{formatDate(dates.enrollmentDate)}</td>
          </tr>
          <tr style={{ backgroundColor: '#ffffff' }}>
            <td style={TdLabel}>Per Semester fee</td>
            <td style={TdValue}>{formatRs(fees.perSemesterFee)}</td>
          </tr>
          <tr style={{ backgroundColor: '#9DC3E6' }}>
            <td style={TdLabel}>Current Semester</td>
            <td style={TdValue}>{academic.currentSemester && academic.totalSemesters ? `${academic.currentSemester} of ${academic.totalSemesters}` : (academic.currentSemester || '—')}</td>
          </tr>
          <tr style={{ backgroundColor: '#ffffff' }}>
            <td style={TdLabel}>Second Semester<br/>fee+2nd Certificate</td>
            <td style={TdValue}>
              {formatRs((Number(fees.secondSemesterFee) || 0) + (Number(fees.secondCertificateFee) || 0))}
              <div style={{ fontSize: '11px', marginTop: '2px', fontWeight: 'normal' }}>
                Semester: {formatRs(fees.secondSemesterFee)} + Certificate: {formatRs(fees.secondCertificateFee)}
              </div>
            </td>
          </tr>
          <tr style={{ backgroundColor: '#9DC3E6' }}>
            <td style={TdLabel}>Current Date+Fee</td>
            <td style={TdValue}>{formatDate(new Date().toISOString())} — {formatRs(fees.currentFee)}</td>
          </tr>
          <tr style={{ backgroundColor: '#ffffff' }}>
            <td style={TdLabel}>Remaining Semesters</td>
            <td style={TdValue}>{academic.remainingSemesters !== undefined && academic.remainingSemesters !== '—' ? `${academic.remainingSemesters} remaining — ` : ''}{formatRs(fees.remainingSemestersFee)}</td>
          </tr>
          {/* Certificate Fees added to same table */}
          <tr style={{ backgroundColor: '#9DC3E6' }}>
            <td style={TdLabel}>Certificate Fee of CNS</td>
            <td style={TdValue}>
              {formatRs(fees.certificateFeeCNS)} ({status.certificateFeeCNS || 'Unpaid'})
            </td>
          </tr>
          <tr style={{ backgroundColor: '#ffffff' }}>
            <td style={TdLabel}>Certificate Fee of CPET</td>
            <td style={TdValue}>
              {formatRs(fees.certificateFeeCPET)} ({status.certificateFeeCPET || 'Unpaid'})
            </td>
          </tr>
        </tbody>
      </table>

      {/* Summary Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '15px', fontFamily: '"Times New Roman", Times, serif' }}>
        <tbody>
          <tr>
            <td style={{ ...TdLabel, backgroundColor: '#f0f0f0' }}>Total Fee</td>
            <td style={TdValue}>{formatRs(totals.totalFee)}</td>
            <td style={{ ...TdLabel, backgroundColor: '#f0f0f0' }}>Issue Date</td>
            <td style={TdValue}>{formatDate(new Date().toISOString())}</td>
          </tr>
          <tr>
            <td style={{ ...TdLabel, backgroundColor: '#f0f0f0' }}>Paid Fee</td>
            <td style={TdValue}>{formatRs(totals.paidFee)}</td>
            <td style={{ ...TdLabel, backgroundColor: '#f0f0f0' }}>Due Date</td>
            <td style={TdValue}>{formatDate(deadline)}</td>
          </tr>
          <tr>
            <td style={{ ...TdLabel, backgroundColor: '#f0f0f0' }}>Pending Fee</td>
            <td style={TdValue}>{formatRs(totals.pendingFee)}</td>
            <td style={{ ...TdLabel, backgroundColor: '#f0f0f0' }}>Course End Date</td>
            <td style={TdValue}>{formatDate(dates.courseEndDate)}</td>
          </tr>
          <tr>
            <td style={{ ...TdLabel, backgroundColor: '#f0f0f0' }}>Bank Name</td>
            <td style={TdValue}>{bankDetails?.bankName || '—'}</td>
            <td style={{ ...TdLabel, backgroundColor: '#f0f0f0' }}>Voucher No</td>
            <td style={TdValue}>{voucher.voucherNumber || '—'}</td>
          </tr>
          <tr>
            <td style={{ ...TdLabel, backgroundColor: '#f0f0f0' }}>Account Title</td>
            <td style={TdValue}>{bankDetails?.accountTitle || '—'}</td>
            <td style={{ ...TdLabel, backgroundColor: '#f0f0f0' }}>Account No</td>
            <td style={TdValue}>{bankDetails?.accountNumber || '—'}</td>
          </tr>
          <tr>
            <td style={{ ...TdLabel, backgroundColor: '#f0f0f0' }}>IBAN</td>
            <td colSpan="3" style={TdValue}>{bankDetails?.iban || '—'}</td>
          </tr>
        </tbody>
      </table>

      {/* Note Section */}
      <div style={{ marginBottom: '15px', fontFamily: '"Times New Roman", Times, serif' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', margin: '0 0 3px 0' }}>Note:</div>
        <ul style={{ fontSize: '11px', margin: 0, paddingLeft: '15px', listStyleType: 'disc', lineHeight: '1.4' }}>
          <li>Exams will be taken on Zoom.</li>
          <li>90 Percent attendance is mandatory to appear in Exams.</li>
          <li><span style={{ backgroundColor: '#ffff00', color: '#000000' }}>If students skip in between Course no Marksheet or Certificates will be issue.</span></li>
          <li>If student face any Sort of Issue it will be handled directly by Head.</li>
        </ul>
      </div>

      {/* Footer Text */}
      <div style={{ position: 'absolute', bottom: '30px', left: '30px', right: '30px', fontSize: '10px', lineHeight: '1.4', fontFamily: '"Times New Roman", Times, serif' }}>
        <div>If you have any query kindly Gmail us at <span style={{ color: '#0000ff' }}>khadeejatulkubraislamicinstitu@gmail.com</span></div>
        <div>or contact us with our Helpline</div>
        <div>Desk no: +92 3164092870</div>
      </div>
    </div>
  );
});

export default VoucherTemplate;
