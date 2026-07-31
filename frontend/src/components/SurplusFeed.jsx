import React, { useState, useEffect } from 'react';
import { Utensils, MapPin, Clock, PhoneCall, QrCode, Split, Search, Star, CheckCircle2, ShieldCheck, AlertCircle, PawPrint } from 'lucide-react';

function FreshnessBar({ score }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 55 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = score >= 80 ? 'text-emerald-400' : score >= 55 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[10px] text-zinc-500">Freshness</span>
        <span className={`text-[10px] font-bold ${textColor}`}>{score}%</span>
      </div>
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function StatusBadge({ status, allocations }) {
  if (status === 'VERIFIED_PICKUP') {
    return (
      <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
        <CheckCircle2 className="w-3 h-3" />
        <span>Verified Pickup ✓</span>
      </span>
    );
  }
  if (status === 'SPLIT_ALLOCATED') {
    return (
      <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
        <Split className="w-3 h-3" />
        <span>Split ({allocations?.length || 0} Orgs)</span>
      </span>
    );
  }
  if (status === 'MATCHED') {
    return (
      <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
        <ShieldCheck className="w-3 h-3" />
        <span>Matched</span>
      </span>
    );
  }
  return (
    <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/20 text-green-300 border border-green-500/40">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      <span>Available</span>
    </span>
  );
}

export default function SurplusFeed({ listings, onTriggerSplit, onOpenContactModal, onOpenQRModal, onOpenRatingModal }) {
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [ratedListings, setRatedListings] = useState(new Set());

  // Load rated listings from localStorage
  useEffect(() => {
    try {
      const ratings = JSON.parse(localStorage.getItem('foodbridge_ratings') || '[]');
      const ratedIds = new Set(ratings.map(r => r.listing_id).filter(Boolean));
      setRatedListings(ratedIds);
    } catch (e) {}
  }, []);

  const filteredListings = listings.filter(item => {
    const matchesCategory = filterCategory === 'ALL' || item.classification === filterCategory;
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      item.food_title.toLowerCase().includes(lowerQuery) ||
      item.donor_name.toLowerCase().includes(lowerQuery) ||
      item.pickup_address.toLowerCase().includes(lowerQuery);
    return matchesCategory && matchesSearch;
  });

  const availableCount = listings.filter(l => l.status === 'AVAILABLE').length;
  const verifiedCount = listings.filter(l => l.status === 'VERIFIED_PICKUP').length;
  const splitCount = listings.filter(l => l.status === 'SPLIT_ALLOCATED').length;

  const isCompleted = (item) => item.status === 'VERIFIED_PICKUP';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-panel p-4 rounded-xl border border-[#1f2b1f]">
        <div>
          <h2 className="font-display font-bold text-xl text-white flex items-center space-x-2">
            <Utensils className="w-5 h-5 text-emerald-400" />
            <span>Active Surplus Food Feed</span>
          </h2>
          <div className="flex items-center space-x-4 mt-1.5 text-[11px]">
            <span className="text-emerald-400 font-semibold">{availableCount} Available</span>
            {splitCount > 0 && <span className="text-blue-400">{splitCount} Split</span>}
            {verifiedCount > 0 && <span className="text-emerald-300">{verifiedCount} Verified</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by dish, donor, or area..."
              className="w-full bg-[#111711] text-xs text-white pl-9 pr-3 py-2 rounded-xl border border-zinc-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-1 bg-[#111711] p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setFilterCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterCategory === 'ALL' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({listings.length})
            </button>
            <button
              onClick={() => setFilterCategory('CATEGORY_A')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1 ${
                filterCategory === 'CATEGORY_A' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Cat A</span>
            </button>
            <button
              onClick={() => setFilterCategory('CATEGORY_B')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1 ${
                filterCategory === 'CATEGORY_B' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Cat B</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredListings.length === 0 ? (
          <div className="md:col-span-2 glass-panel p-12 text-center text-zinc-400 rounded-2xl border border-zinc-800">
            <Utensils className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            No surplus listings matched your filter. Try clearing the search or list new surplus.
          </div>
        ) : (
          filteredListings.map((item) => {
            const isRated = ratedListings.has(item.id);
            const isDone = isCompleted(item);

            return (
              <div
                key={item.id}
                className={`glass-panel rounded-2xl p-6 border flex flex-col justify-between space-y-4 transition-all ${
                  isDone
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : item.status === 'SPLIT_ALLOCATED'
                    ? 'border-blue-500/20 glass-panel-hover'
                    : 'border-[#1f2b1f] glass-panel-hover'
                }`}
              >
                {/* Top Row: Donor & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-semibold text-white text-base">{item.donor_name}</span>
                      <span className="text-xs text-zinc-500">({item.donor_phone || '+91 98765 43210'})</span>
                      {isRated && (
                        <span className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Star className="w-2.5 h-2.5 fill-amber-400" />
                          <span>Rated</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-lg text-emerald-400 mt-1 truncate">{item.food_title}</h3>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide ${
                      item.classification === 'CATEGORY_B'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {item.classification === 'CATEGORY_B' ? '❄️ Cold Chain' : '🌾 Ambient'}
                    </span>
                    <StatusBadge status={item.status} allocations={item.split_allocations} />
                  </div>
                </div>

                {/* Freshness Bar */}
                <FreshnessBar score={item.freshness_score || 0} />

                {/* Middle Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-xs bg-[#111711] p-3 rounded-xl border border-zinc-800/80">
                  <div>
                    <span className="text-zinc-400 block">Quantity</span>
                    <span className="font-bold text-white text-sm">{item.quantity_servings}</span>
                    <span className="text-[10px] text-zinc-500 block">Servings ({item.weight_kg} kg)</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">AI Score</span>
                    <span className={`font-bold text-sm ${
                      (item.freshness_score || 0) >= 80 ? 'text-emerald-400' :
                      (item.freshness_score || 0) >= 55 ? 'text-amber-400' : 'text-red-400'
                    }`}>{item.freshness_score}%</span>
                    <span className="text-[10px] text-zinc-500 block">Risk: {item.risk_level || 'LOW'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      <span>Safe Until</span>
                    </span>
                    <span className="font-bold text-white text-sm">{item.estimated_shelf_life_hours}h</span>
                    <span className="text-[10px] text-zinc-500 block">Remaining</span>
                  </div>
                </div>

                {/* Address & Allergens */}
                <div className="space-y-1.5 text-xs text-zinc-300">
                  <div className="flex items-center space-x-1.5 text-zinc-400">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">{item.pickup_address}</span>
                  </div>

                  {item.allergens && item.allergens.length > 0 && item.allergens[0] !== 'None Detected' && (
                    <div className="flex items-center space-x-2 pt-1 text-[11px]">
                      <span className="text-amber-400 font-semibold flex-shrink-0">⚠️ Allergens:</span>
                      <div className="flex gap-1 flex-wrap">
                        {item.allergens.map((alg, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {alg}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Split Allocation Display */}
                {item.status === 'SPLIT_ALLOCATED' && item.split_allocations && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider flex items-center space-x-1">
                      <Split className="w-3 h-3" />
                      <span>Auto-Split Allocated Across {item.split_allocations.length} Organizations</span>
                    </div>
                    <div className="space-y-1">
                      {item.split_allocations.map((alloc, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-[#111711] border border-blue-500/20 text-[10px]">
                          <div>
                            <span className="text-white font-medium">{alloc.ngo_name}</span>
                            {alloc.category_type && (
                              <span className="text-blue-400 ml-1.5 text-[9px]">({alloc.category_type})</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-zinc-400">
                            <span className="text-emerald-400 font-bold">{alloc.allocated_servings} srv</span>
                            <span>·</span>
                            <span>{alloc.distance_km} km</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-2">

                  {/* Call Donor */}
                  <button
                    onClick={() => onOpenContactModal(item)}
                    className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1 transition-all"
                    title="Call Donor"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </button>

                  {/* Auto-Split (disabled if already split or verified) */}
                  {!isDone && item.status !== 'SPLIT_ALLOCATED' && (
                    <button
                      onClick={() => onTriggerSplit(item)}
                      className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold flex items-center space-x-1 transition-all"
                      title="Auto-Split across nearby organizations"
                    >
                      <Split className="w-3.5 h-3.5" />
                      <span>Auto-Split</span>
                    </button>
                  )}

                  {/* QR Handoff */}
                  {!isDone && (
                    <button
                      onClick={() => onOpenQRModal(item)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1 transition-all shadow-md shadow-emerald-600/20"
                      title="Generate QR Pickup Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>QR Handoff</span>
                    </button>
                  )}

                  {/* Rate Donor (NGO rates) */}
                  <button
                    onClick={() => onOpenRatingModal(item, 'NGO')}
                    className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center space-x-1 transition-all"
                    title="Rate Donor (as NGO)"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>Rate Donor</span>
                  </button>

                  {/* Rate Recipient (Donor rates NGO/Shelter) */}
                  <button
                    onClick={() => onOpenRatingModal(item, 'RESTAURANT')}
                    className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1 transition-all"
                    title="Rate Recipient (as Donor)"
                  >
                    <Star className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Rate Recipient</span>
                  </button>

                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
