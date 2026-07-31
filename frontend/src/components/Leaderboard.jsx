import React, { useState, useEffect } from 'react';
import { Award, Star, ShieldCheck, Trophy, Heart, RefreshCw, MessageSquare, TrendingUp } from 'lucide-react';

export default function Leaderboard() {
  const [recentRatings, setRecentRatings] = useState([]);
  const [activeTab, setActiveTab] = useState('boards'); // 'boards' | 'reviews'

  const topDonors = [
    { rank: 1, name: 'Taj Palace Hotel & Caterers', meals: 3420, trust: 4.98, type: 'Hotel', change: '+0.02' },
    { rank: 2, name: 'NSUT Campus Dining Hall', meals: 2150, trust: 4.95, type: 'University', change: '+0.01' },
    { rank: 3, name: "Haldiram's Sweets & Kitchen", meals: 1890, trust: 4.92, type: 'Restaurant', change: '—' },
    { rank: 4, name: 'Bikanervala Sweets Dwarka', meals: 1450, trust: 4.89, type: 'Bakery', change: '—' },
    { rank: 5, name: 'Dominos Pizza Dwarka Hub', meals: 1120, trust: 4.86, type: 'Cloud Kitchen', change: '—' }
  ];

  const topNGOs = [
    { rank: 1, name: 'Akshaya Patra Foundation', distributed: 5120, punctuality: 4.97, type: 'NGO Shelter' },
    { rank: 2, name: 'Robin Hood Army Delhi', distributed: 4310, punctuality: 4.94, type: 'Civic NGO' },
    { rank: 3, name: 'Feeding India Shelter', distributed: 3280, punctuality: 4.91, type: 'NGO Shelter' },
    { rank: 4, name: 'Sunrise Children Orphanage', distributed: 2740, punctuality: 4.88, type: 'Orphanage' },
    { rank: 5, name: 'Safe Haven Animal Rescue', distributed: 1980, punctuality: 4.85, type: 'Animal Shelter' }
  ];

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('foodbridge_ratings') || '[]');
      setRecentRatings(stored.slice(0, 20));
    } catch (e) {
      setRecentRatings([]);
    }
  };

  const renderStars = (n) => {
    const count = Math.round(n || 0);
    return (
      <span className="text-amber-400">
        {'★'.repeat(count)}{'☆'.repeat(5 - count)}
      </span>
    );
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ', ' +
             d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch { return ''; }
  };

  const rankStyle = (rank) => {
    if (rank === 1) return 'bg-amber-500/20 text-amber-400 border border-amber-500/40';
    if (rank === 2) return 'bg-zinc-300/20 text-zinc-200 border border-zinc-300/30';
    if (rank === 3) return 'bg-amber-700/20 text-amber-600 border border-amber-700/30';
    return 'bg-zinc-800 text-zinc-400';
  };

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-[#1f2b1f] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-white">Trust Score & Impact Leaderboards</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Recognizing top food donors, NGOs, orphanages & animal shelters across Delhi NCR</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#111711] p-1 rounded-xl border border-zinc-800 text-xs max-w-sm">
        <button
          onClick={() => setActiveTab('boards')}
          className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'boards' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Leaderboards</span>
        </button>
        <button
          onClick={() => { setActiveTab('reviews'); loadRatings(); }}
          className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'reviews' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Live Reviews {recentRatings.length > 0 ? `(${recentRatings.length})` : ''}</span>
        </button>
      </div>

      {activeTab === 'boards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Top Donors */}
          <div className="glass-panel rounded-2xl p-6 border border-[#1f2b1f] space-y-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Top Food Donors</span>
              </span>
              <span className="text-xs text-emerald-400 font-normal px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">80G Certified</span>
            </h3>

            <div className="space-y-2.5">
              {topDonors.map((donor) => (
                <div
                  key={donor.rank}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#111711] border border-zinc-800 text-xs hover:border-amber-500/30 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center text-xs flex-shrink-0 ${rankStyle(donor.rank)}`}>
                      {donor.rank <= 3 ? ['🥇','🥈','🥉'][donor.rank - 1] : `#${donor.rank}`}
                    </div>
                    <div>
                      <div className="font-semibold text-white group-hover:text-amber-300 transition-colors">{donor.name}</div>
                      <div className="text-[11px] text-zinc-400">
                        {donor.type} · <span className="text-emerald-400">{donor.meals.toLocaleString()} meals donated</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <div className="flex items-center space-x-1 text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{donor.trust}</span>
                    </div>
                    {donor.change !== '—' && (
                      <span className="text-[10px] text-emerald-400 mt-0.5 flex items-center">
                        <TrendingUp className="w-2.5 h-2.5 mr-0.5" />{donor.change}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top NGOs & Shelters */}
          <div className="glass-panel rounded-2xl p-6 border border-[#1f2b1f] space-y-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-emerald-400" />
                <span>Top Recipients</span>
              </span>
              <span className="text-xs text-emerald-400 font-normal px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">100% Verified</span>
            </h3>

            <div className="space-y-2.5">
              {topNGOs.map((ngo) => (
                <div
                  key={ngo.rank}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#111711] border border-zinc-800 text-xs hover:border-emerald-500/30 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center text-xs flex-shrink-0 ${rankStyle(ngo.rank)}`}>
                      {ngo.rank <= 3 ? ['🥇','🥈','🥉'][ngo.rank - 1] : `#${ngo.rank}`}
                    </div>
                    <div>
                      <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors">{ngo.name}</div>
                      <div className="text-[11px] text-zinc-400">
                        <span className="text-blue-400 text-[10px]">{ngo.type}</span> · <span className="text-emerald-400">{ngo.distributed.toLocaleString()} meals distributed</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{ngo.punctuality}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-lg text-white flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <span>Live Trust Reviews ({recentRatings.length})</span>
            </h3>
            <button
              onClick={loadRatings}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-white transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {recentRatings.length === 0 ? (
            <div className="glass-panel p-10 rounded-2xl border border-zinc-800 text-center text-zinc-400 space-y-3">
              <MessageSquare className="w-10 h-10 text-zinc-700 mx-auto" />
              <p className="text-sm">No reviews yet.</p>
              <p className="text-xs">Submit a rating from the Surplus Feed to see it appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentRatings.map((rating, idx) => (
                <div
                  key={idx}
                  className={`glass-panel rounded-xl p-4 border text-xs space-y-3 transition-all ${
                    rating.evaluator_role === 'NGO'
                      ? 'border-amber-500/20 hover:border-amber-500/40'
                      : 'border-emerald-500/20 hover:border-emerald-500/40'
                  }`}
                >
                  {/* Direction Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      rating.evaluator_role === 'NGO'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {rating.evaluator_role === 'NGO' ? 'NGO → Donor' : 'Donor → Recipient'}
                    </span>
                    <span className="text-zinc-600 text-[10px]">{formatTime(rating.created_at)}</span>
                  </div>

                  {/* Target org */}
                  <div>
                    <div className="text-zinc-400 text-[10px]">Rating for:</div>
                    <div className="font-semibold text-white">{rating.target_org_name || rating.evaluator_name}</div>
                    {rating.food_title && <div className="text-emerald-400 text-[10px] mt-0.5">{rating.food_title}</div>}
                    {rating.target_org_type && (
                      <div className="text-blue-400 text-[10px]">{rating.target_org_type}</div>
                    )}
                  </div>

                  {/* Stars */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-zinc-400">Overall Rating</div>
                      <div className="text-lg leading-none mt-0.5">{renderStars(rating.overall_rating || rating.rating || 5)}</div>
                    </div>
                    {rating.avg_score && (
                      <div className="text-right">
                        <div className="text-[10px] text-zinc-400">Avg Score</div>
                        <div className="text-amber-400 font-bold text-base">{rating.avg_score}/5</div>
                      </div>
                    )}
                  </div>

                  {/* Feedback */}
                  {rating.feedback_text && (
                    <div className="p-2.5 rounded-lg bg-[#111711] border border-zinc-800 text-zinc-300 italic text-[11px] leading-relaxed">
                      "{rating.feedback_text}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
