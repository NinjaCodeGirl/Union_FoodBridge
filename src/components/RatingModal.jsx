import React, { useState } from 'react';
import { Star, ShieldCheck, CheckCircle2, X, Building, HeartHandshake, PawPrint, Home, Users, Heart } from 'lucide-react';

const RECIPIENT_ORG_TYPES = [
  { value: 'NGO_SHELTER', label: 'NGO / Food Shelter', emoji: '🏠', icon: HeartHandshake },
  { value: 'ORPHANAGE', label: 'Orphanage / Children Home', emoji: '👶', icon: Heart },
  { value: 'OLD_AGE_HOME', label: 'Old Age Home', emoji: '🧓', icon: Home },
  { value: 'ANIMAL_SHELTER', label: 'Animal Shelter / Rescue', emoji: '🐾', icon: PawPrint },
  { value: 'COMMUNITY_KITCHEN', label: 'Community Kitchen', emoji: '🍲', icon: Users },
];

function StarRating({ value, onChange, size = 'lg' }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className={`transition-transform hover:scale-110 focus:outline-none ${size === 'lg' ? 'p-1' : ''}`}
        >
          <Star className={`${size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'} ${
            star <= (hovered || value) ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'
          } transition-colors`} />
        </button>
      ))}
    </div>
  );
}

export default function RatingModal({ listing, initialRole = 'NGO', onClose, API_URL, onRatingSubmitted }) {
  const [evaluatorRole, setEvaluatorRole] = useState(initialRole === 'RESTAURANT' ? 'RESTAURANT' : 'NGO');
  const [recipientOrgType, setRecipientOrgType] = useState('NGO_SHELTER');
  const [overallRating, setOverallRating] = useState(5);
  const [criterion1Rating, setCriterion1Rating] = useState(5);
  const [criterion2Rating, setCriterion2Rating] = useState(5);
  const [criterion3Rating, setCriterion3Rating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!listing) return null;

  const isNGORating = evaluatorRole === 'NGO';

  // Dynamic labels based on who is rating
  const targetName = isNGORating
    ? listing.donor_name
    : (RECIPIENT_ORG_TYPES.find(t => t.value === recipientOrgType)?.label || 'Recipient Shelter');

  const ratingConfig = isNGORating
    ? {
        directionTag: 'NGO → Donor',
        directionTagClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        title: 'Rate Donor Restaurant / Kitchen',
        c1Label: '🧼 Food Hygiene & Packaging',
        c1Hint: 'Was food properly sealed and hygienically prepared?',
        c2Label: '🌡️ Temperature Maintenance',
        c2Hint: 'Was correct storage temperature maintained?',
        c3Label: '⏰ Pickup Coordination',
        c3Hint: 'Were pickup instructions clear and timely?',
        submitColor: 'from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500',
        submitText: 'Submit Donor Rating to Trust Ledger'
      }
    : {
        directionTag: 'Donor → Recipient',
        directionTagClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        title: 'Rate Recipient Organization',
        c1Label: '🚚 Pickup Punctuality',
        c1Hint: 'Did they arrive on time for pickup?',
        c2Label: '🧹 Vehicle & Transport Hygiene',
        c2Hint: 'Was their transport vehicle clean and food-safe?',
        c3Label: '🤝 Staff Cooperation',
        c3Hint: 'Were staff courteous and professional?',
        submitColor: 'from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500',
        submitText: 'Submit Recipient Rating to Trust Ledger'
      };

  const avgScore = ((overallRating + criterion1Rating + criterion2Rating + criterion3Rating) / 4).toFixed(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const selectedOrgType = RECIPIENT_ORG_TYPES.find(t => t.value === recipientOrgType);

    const payload = {
      id: `rate-${Date.now()}`,
      listing_id: listing.id,
      food_title: listing.food_title,
      target_org_id: listing.id,
      target_org_name: targetName,
      target_org_type: isNGORating ? 'RESTAURANT' : (selectedOrgType?.label || 'NGO Shelter'),
      evaluator_role: evaluatorRole,
      evaluator_name: isNGORating ? 'Verified NGO Dispatcher' : listing.donor_name,
      overall_rating: overallRating,
      criterion_1_rating: criterion1Rating,
      criterion_2_rating: criterion2Rating,
      criterion_3_rating: criterion3Rating,
      avg_score: parseFloat(avgScore),
      feedback_text: feedbackText || (isNGORating
        ? 'High quality surplus food, well packaged and hygienically stored.'
        : 'Prompt pickup, clean vehicle, professional staff coordination.'),
      created_at: new Date().toISOString()
    };

    // Try to POST to backend, then save to localStorage
    try {
      const res = await fetch(`${API_URL}/api/ratings/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_org_id: payload.target_org_id,
          target_org_name: payload.target_org_name,
          evaluator_role: payload.evaluator_role,
          evaluator_name: payload.evaluator_name,
          rating: overallRating,
          hygiene_rating: criterion1Rating,
          punctuality_rating: criterion2Rating,
          feedback_text: payload.feedback_text
        })
      });
      // continue regardless of response
    } catch (err) {
      // backend offline, that's ok
    }

    // Always save to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('foodbridge_ratings') || '[]');
      existing.unshift(payload);
      // keep only last 50 ratings
      localStorage.setItem('foodbridge_ratings', JSON.stringify(existing.slice(0, 50)));
    } catch (e) {}

    setSubmitting(false);
    setSubmitted(true);
    if (onRatingSubmitted) onRatingSubmitted();
  };

  const renderStarDisplay = (value) => {
    return '★'.repeat(value) + '☆'.repeat(5 - value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-amber-500/30 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Top gradient bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500" />

        <div className="p-6 space-y-5">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Star className="w-6 h-6 fill-amber-400" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-white">Dual-Sided Trust Rating</h3>
              <p className="text-xs text-zinc-400">Rate donors & recipients from both sides of the transaction</p>
            </div>
          </div>

          {/* Role Switcher */}
          <div className="flex bg-[#111711] p-1 rounded-xl border border-zinc-800 text-xs gap-1">
            <button
              type="button"
              onClick={() => setEvaluatorRole('NGO')}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                evaluatorRole === 'NGO'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>NGO Rates Donor</span>
            </button>
            <button
              type="button"
              onClick={() => setEvaluatorRole('RESTAURANT')}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                evaluatorRole === 'RESTAURANT'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Donor Rates Recipient</span>
            </button>
          </div>

          {/* Recipient Org Type Selector (only when restaurant rates) */}
          {!isNGORating && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">Recipient Organization Type</label>
              <div className="grid grid-cols-1 gap-1.5">
                {RECIPIENT_ORG_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setRecipientOrgType(type.value)}
                      className={`flex items-center space-x-3 p-3 rounded-xl border text-xs font-medium transition-all ${
                        recipientOrgType === type.value
                          ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-[#111711] border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                      }`}
                    >
                      <span className="text-lg">{type.emoji}</span>
                      <span>{type.label}</span>
                      {recipientOrgType === type.value && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {submitted ? (
            /* Success State */
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-center space-y-3 animate-fadeIn">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h4 className="font-display font-bold text-lg text-white">Rating Submitted!</h4>
              <p className="text-xs text-zinc-300">
                Your <span className="text-amber-400 font-bold">{renderStarDisplay(overallRating)}</span> rating for{' '}
                <strong className="text-white">{targetName}</strong> has been logged to the public Trust Ledger.
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
                  <div className="text-zinc-400 text-[10px]">Overall</div>
                  <div className="text-amber-400 font-bold">{overallRating}/5</div>
                </div>
                <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
                  <div className="text-zinc-400 text-[10px]">{isNGORating ? 'Hygiene' : 'Punctuality'}</div>
                  <div className="text-amber-400 font-bold">{criterion1Rating}/5</div>
                </div>
                <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
                  <div className="text-zinc-400 text-[10px]">Avg Score</div>
                  <div className="text-emerald-400 font-bold">{avgScore}</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="mt-3 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all"
              >
                View Trust Leaderboard →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Transaction Banner */}
              <div className="p-3.5 rounded-xl bg-[#111711] border border-zinc-800 text-xs flex justify-between items-start">
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${ratingConfig.directionTagClass}`}>
                    {ratingConfig.directionTag}
                  </span>
                  <div className="font-bold text-white text-sm mt-1.5">{targetName}</div>
                  <div className="text-emerald-400 font-mono text-[11px] mt-0.5">{listing.food_title}</div>
                  <div className="text-zinc-500 text-[10px] mt-0.5">{listing.quantity_servings} servings • {listing.pickup_address}</div>
                </div>
              </div>

              {/* Overall Star Rating */}
              <div className="space-y-2 text-center">
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">Overall Rating</label>
                <div className="flex justify-center">
                  <StarRating value={overallRating} onChange={setOverallRating} size="lg" />
                </div>
                <p className="text-xs text-zinc-500">
                  {overallRating === 5 ? '⭐ Exceptional!' : overallRating === 4 ? '👍 Good' : overallRating === 3 ? '👌 Average' : overallRating === 2 ? '👎 Below Standard' : '❌ Poor'}
                </p>
              </div>

              {/* Sub-criteria Ratings */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">Detailed Criteria Ratings</label>

                {[
                  { label: ratingConfig.c1Label, hint: ratingConfig.c1Hint, value: criterion1Rating, set: setCriterion1Rating },
                  { label: ratingConfig.c2Label, hint: ratingConfig.c2Hint, value: criterion2Rating, set: setCriterion2Rating },
                  { label: ratingConfig.c3Label, hint: ratingConfig.c3Hint, value: criterion3Rating, set: setCriterion3Rating },
                ].map((criterion, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#111711] border border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-zinc-200">{criterion.label}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{criterion.hint}</div>
                    </div>
                    <StarRating value={criterion.value} onChange={criterion.set} size="sm" />
                  </div>
                ))}
              </div>

              {/* Average Score Badge */}
              <div className="flex justify-between items-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <span className="text-zinc-300 font-medium">Composite Trust Score</span>
                <span className="text-amber-400 font-bold text-base">{avgScore} / 5.0</span>
              </div>

              {/* Written Review */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Comments (Optional)</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={isNGORating
                    ? 'Describe food hygiene, packaging quality, temperature holding, and donor communication...'
                    : 'Describe recipient punctuality, vehicle condition, staff professionalism...'}
                  rows={3}
                  className="w-full bg-[#111711] text-xs text-white border border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${ratingConfig.submitColor} text-black font-bold text-sm transition-all shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2`}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                    <span>Logging to Public Trust Ledger...</span>
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 fill-current" />
                    <span>{ratingConfig.submitText}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
