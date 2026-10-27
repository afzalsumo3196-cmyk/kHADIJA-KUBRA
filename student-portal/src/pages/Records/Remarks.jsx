import React from 'react';
import { MessageCircle, Star, Sparkles } from 'lucide-react';

const remarks = [
  {
    id: 1,
    teacher: 'Dr. Ahmad Ali',
    subject: 'Tafseer-e-Quran',
    date: 'Nov 05, 2026',
    priority: 'Insightful',
    note: 'Excellent understanding of classical tafseer. Keep focusing on the linguistic nuance and structure in each verse.',
  },
  {
    id: 2,
    teacher: 'Mufti Usman',
    subject: 'Islamic Jurisprudence',
    date: 'Oct 28, 2026',
    priority: 'Important',
    note: 'Your reasoning is strong. Continue to refine your qiyas examples and support answers with Quranic evidence.',
  },
  {
    id: 3,
    teacher: 'Sheikh Tariq',
    subject: 'Arabic Literature',
    date: 'Oct 20, 2026',
    priority: 'Encouraging',
    note: 'Good progress with grammar comprehension. Review the new vocabulary list before the next class for faster fluency.',
  },
];

const Remarks = () => {
  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <p className="text-sm uppercase tracking-[0.32em] text-emerald-700 font-semibold">Teacher Feedback</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Remarks & Guidance</h1>
        <p className="mt-3 text-slate-500 max-w-2xl">
          Review personalized remarks from instructors with actionable feedback and performance highlights.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {remarks.map((remark) => (
          <article key={remark.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700">
                  <MessageCircle size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{remark.teacher}</p>
                  <p className="mt-1 text-sm text-slate-500">{remark.subject}</p>
                </div>
              </div>
              <span className="rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">
                {remark.priority}
              </span>
            </div>
            <p className="mt-6 text-slate-600 leading-7">{remark.note}</p>
            <div className="mt-6 flex items-center justify-between gap-3 text-sm text-slate-500">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                <Star size={16} className="text-emerald-600" /> High value
              </div>
              <span>{remark.date}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-600/10 to-slate-50 p-6 shadow-sm">
        <div className="flex items-center gap-4 text-emerald-700 font-semibold">
          <Sparkles size={24} />
          <div>
            <p className="text-sm uppercase tracking-[0.32em]">Insight</p>
            <p className="mt-2 text-base text-slate-700">Use teacher remarks to develop a study plan with priority actions and weekly review goals.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Remarks;
