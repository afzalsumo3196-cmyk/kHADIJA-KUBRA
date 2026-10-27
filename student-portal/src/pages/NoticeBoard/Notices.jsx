import React, { useState, useEffect } from 'react';
import { Pin, Calendar, BellRing, Gift, Clock4, Loader2 } from 'lucide-react';
import api from '../../api/axios';

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await api.get('/portal/notices');
        if (res.data.success) {
          setNotices(res.data.notices);
        }
      } catch (err) {
        console.error('Failed to fetch notices:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <p className="text-sm uppercase tracking-[0.32em] text-emerald-700 font-semibold">Announcements</p>
        <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Notice Board</h2>
        <p className="mt-2 text-slate-500 max-w-2xl">
          Important institute updates and upcoming events curated for every student.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-5">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin text-emerald-600" size={40} />
            </div>
          ) : notices.length === 0 ? (
            <div className="p-8 text-center rounded-[32px] border border-slate-200 bg-white/95 text-slate-500">
              No notices or announcements have been posted yet.
            </div>
          ) : (
            notices.map((notice) => (
              <article key={notice._id} className="group overflow-hidden rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700`}>
                      {notice.type === 'Urgent' ? <BellRing size={24} className="text-red-500" /> : <Pin size={24} />}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.32em] text-slate-400 font-semibold">{notice.type}</p>
                      <h3 className="mt-3 text-xl font-bold text-slate-900">{notice.title}</h3>
                    </div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    <Calendar size={14} className="inline-block mr-1" />{' '}
                    {new Date(notice.date || notice.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <p className="mt-5 text-slate-600 leading-7">{notice.description}</p>
              </article>
            ))
          )}
        </div>

        <aside className="space-y-4 rounded-[32px] border border-slate-200 bg-gradient-to-br from-emerald-600/10 to-slate-50 p-6 shadow-sm h-fit">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700">
                <Gift size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold">Today’s Highlight</p>
                <p className="mt-2 text-sm text-slate-500">Check notice board regularly for schedule adjustments.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-700">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-400 font-semibold">Guideline</p>
            <p className="mt-3 text-sm leading-6">
              Keep your contact details updated and complete fee submissions before the examination deadlines.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Notices;
