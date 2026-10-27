import React from 'react';
import { Receipt, CheckCircle2, Clock, AlertCircle, Sparkles } from 'lucide-react';

export const DEFAULT_FEE_ITEMS = [
  { title: "Enrollment Date + Fee", term: "Initial Enrollment", amount: 3000, status: "Paid" },
  { title: "Per Semester Fee", term: "Month 1 - 2", amount: 6000, status: "Unpaid" },
  { title: "Remaining / Next Semester Fee", term: "Month 3 - 4", amount: 4500, status: "Upcoming" },
  { title: "Certificate Fee (CNS/CPET)", term: "End of Course", amount: 1500, status: "Upcoming" }
];

const FeeBreakdownTable = ({ 
  feeItems = DEFAULT_FEE_ITEMS, 
  title = "Official Fee Voucher Breakdown", 
  subtitle = "Detailed instalment and fee schedule allocation",
  onItemStatusChange = null,
  isEditable = false
}) => {
  const items = Array.isArray(feeItems) && feeItems.length > 0 ? feeItems : DEFAULT_FEE_ITEMS;

  // Dynamic calculations
  const totalFee = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalPaid = items
    .filter(item => item.status === 'Paid')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const remainingDue = Math.max(0, totalFee - totalPaid);

  const getNetStatus = () => {
    if (remainingDue === 0 && totalFee > 0) {
      return { text: 'Paid in Full', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
    if (totalPaid > 0) {
      return { text: 'Partially Paid', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
    return { text: 'Unpaid', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
  };

  const netStatus = getNetStatus();

  const renderStatusBadge = (status, index) => {
    if (isEditable && onItemStatusChange) {
      return (
        <select
          value={status}
          onChange={(e) => onItemStatusChange(index, e.target.value)}
          className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none transition-colors cursor-pointer ${
            status === 'Paid'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : status === 'Unpaid'
              ? 'bg-rose-50 text-rose-800 border-rose-300'
              : 'bg-slate-100 text-slate-700 border-slate-300'
          }`}
        >
          <option value="Paid">Paid</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Upcoming">Upcoming</option>
        </select>
      );
    }

    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-600" />
            Paid
          </span>
        );
      case 'Unpaid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle size={12} className="text-rose-600" />
            Unpaid
          </span>
        );
      case 'Upcoming':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <Clock size={12} className="text-slate-400" />
            Upcoming
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Table Header / Title */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Receipt size={16} />
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider font-extrabold text-slate-800">{title}</h4>
            {subtitle && <p className="text-[11px] text-slate-400 font-medium">{subtitle}</p>}
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${netStatus.bg}`}>
          {netStatus.text}
        </span>
      </div>

      {/* Official Voucher Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
                <th className="p-3 pl-4">Fee Type / Description</th>
                <th className="p-3">Term / Month</th>
                <th className="p-3 text-right">Amount (PKR)</th>
                <th className="p-3 pr-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3 pl-4 font-bold text-slate-900">
                    {item.title}
                  </td>
                  <td className="p-3 text-slate-500 font-medium">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[11px] text-slate-600 font-semibold">
                      {item.term}
                    </span>
                  </td>
                  <td className="p-3 text-right font-extrabold text-slate-900">
                    Rs. {Number(item.amount).toLocaleString()}
                  </td>
                  <td className="p-3 pr-4 text-center">
                    {renderStatusBadge(item.status, idx)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Table Summary Row */}
            <tfoot>
              <tr className="bg-slate-50/90 border-t-2 border-slate-200 font-bold text-slate-900">
                <td colSpan="2" className="p-3 pl-4 text-slate-700">
                  Total Voucher Amount
                </td>
                <td className="p-3 text-right text-sm text-emerald-800 font-black">
                  Rs. {totalFee.toLocaleString()}
                </td>
                <td className="p-3 pr-4 text-center">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${netStatus.bg}`}>
                    {netStatus.text}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Dynamic Summary Cards (Total Fee, Total Paid, Remaining Balance) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Total Fee */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Fee</p>
          <p className="text-base font-black text-slate-900 mt-0.5">Rs. {totalFee.toLocaleString()}</p>
        </div>

        {/* Total Paid */}
        <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/70 text-center">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Total Paid</p>
          <p className="text-base font-black text-emerald-700 mt-0.5">Rs. {totalPaid.toLocaleString()}</p>
        </div>

        {/* Remaining Balance */}
        <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200/70 text-center">
          <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Remaining Balance</p>
          <p className="text-base font-black text-rose-700 mt-0.5">Rs. {remainingDue.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default FeeBreakdownTable;
