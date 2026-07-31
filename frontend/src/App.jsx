import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import DonationForm from './components/DonationForm';
import SurplusFeed from './components/SurplusFeed';
import LiveMap from './components/LiveMap';
import Leaderboard from './components/Leaderboard';
import ContactSharingModal from './components/ContactSharingModal';
import QRModal from './components/QRModal';
import RatingModal from './components/RatingModal';
import OnboardingModal from './components/OnboardingModal';
import { Split, X, Sparkles, CheckCircle2, Send, MapPin, Clock, PhoneCall } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const INITIAL_LISTINGS = [
  {
    id: 'list-001',
    donor_name: 'NSUT Campus Dining Hall',
    donor_phone: '+91 98765 43210',
    food_title: 'Fresh Cooked Dal Makhani & Rice',
    food_category: 'COOKED_MEALS',
    classification: 'CATEGORY_A',
    quantity_servings: 180,
    weight_kg: 54.0,
    freshness_score: 94.5,
    risk_level: 'LOW',
    allergens: ['Dairy', 'Gluten'],
    validation_hash: 'e3b0c44298fc1c149afbf4c8996fb924',
    estimated_shelf_life_hours: 5.2,
    status: 'AVAILABLE',
    pickup_address: 'NSUT Main Campus, Sector 3, Dwarka, New Delhi',
    latitude: 28.6100,
    longitude: 77.0380,
    created_at: new Date().toISOString()
  },
  {
    id: 'list-002',
    donor_name: 'Taj Palace Banquet Kitchen',
    donor_phone: '+91 98999 11223',
    food_title: 'Assorted Paneer Gravy & Rotis',
    food_category: 'COOKED_MEALS',
    classification: 'CATEGORY_B',
    quantity_servings: 350,
    weight_kg: 105.0,
    freshness_score: 88.0,
    risk_level: 'LOW',
    allergens: ['Dairy', 'Gluten'],
    validation_hash: '8f434346648f6b96df89dda901c5176b',
    estimated_shelf_life_hours: 4.5,
    status: 'AVAILABLE',
    pickup_address: 'Sardar Patel Marg, Diplomatic Enclave, New Delhi',
    latitude: 28.5975,
    longitude: 77.1724,
    created_at: new Date().toISOString()
  },
  {
    id: 'list-003',
    donor_name: 'Bikanervala Sweets Dwarka',
    donor_phone: '+91 98222 33445',
    food_title: 'Assorted Bread Loaves & Vegetable Cutlets',
    food_category: 'BAKERY',
    classification: 'CATEGORY_A',
    quantity_servings: 120,
    weight_kg: 36.0,
    freshness_score: 96.0,
    risk_level: 'LOW',
    allergens: ['Gluten'],
    validation_hash: '3f211c4b7890aef481239c01289fe421',
    estimated_shelf_life_hours: 8.0,
    status: 'AVAILABLE',
    pickup_address: 'Sector 6 Dwarka, New Delhi',
    latitude: 28.5861,
    longitude: 77.0789,
    created_at: new Date().toISOString()
  }
];

const INITIAL_METRICS = {
  total_meals_rescued: 15420,
  total_co2_avoided_kg: 38550.0,
  total_food_saved_tonnes: 4.62,
  active_ngo_partners: 54,
  verified_pickups_count: 3210,
  average_match_time_mins: 12.4
};

export default function App() {
  const [activeTab, setActiveTab] = useState('feed');
  const [activeRole, setActiveRole] = useState('RESTAURANT');

  const [listings, setListings] = useState(() => {
    try {
      const saved = localStorage.getItem('foodbridge_listings');
      return saved ? JSON.parse(saved) : INITIAL_LISTINGS;
    } catch (e) { return INITIAL_LISTINGS; }
  });

  const [liveMetrics, setLiveMetrics] = useState(() => {
    try {
      const saved = localStorage.getItem('foodbridge_metrics');
      return saved ? JSON.parse(saved) : INITIAL_METRICS;
    } catch (e) { return INITIAL_METRICS; }
  });

  // Modal States
  const [contactModalListing, setContactModalListing] = useState(null);
  const [qrModalListing, setQrModalListing] = useState(null);
  const [ratingModalConfig, setRatingModalConfig] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [splitModalListing, setSplitModalListing] = useState(null);
  const [splitResult, setSplitResult] = useState(null);
  const [splitLoading, setSplitLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' | 'info'

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Persist to localStorage
  useEffect(() => {
    try { localStorage.setItem('foodbridge_listings', JSON.stringify(listings)); } catch (e) {}
  }, [listings]);

  useEffect(() => {
    try { localStorage.setItem('foodbridge_metrics', JSON.stringify(liveMetrics)); } catch (e) {}
  }, [liveMetrics]);

  // Try fetching from backend on mount
  useEffect(() => {
    fetchActiveListings();
    fetchMetrics();
  }, []);

  const fetchActiveListings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/donations/active`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setListings(data);
      }
    } catch (e) { /* fallback to localStorage */ }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API_URL}/api/analytics/impact`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        setLiveMetrics(data);
      }
    } catch (e) { /* fallback */ }
  };

  const handleListingCreated = (newListing) => {
    setListings(prev => [newListing, ...prev]);
    setActiveTab('feed');
    showToast(`✅ Surplus listed! AI Freshness Score: ${newListing.freshness_score}%`);
    setLiveMetrics(prev => ({
      ...prev,
      active_ngo_partners: Math.min(prev.active_ngo_partners + 1, 60)
    }));
  };

  // Smart Auto-Split Matching Engine
  const handleTriggerSplit = async (listing) => {
    setSplitModalListing(listing);
    setSplitLoading(true);
    setSplitResult(null);

    // Try backend first
    try {
      const res = await fetch(`${API_URL}/api/matching/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listing.id, max_recipients: 4 }),
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const data = await res.json();
        setSplitResult(data);
        showToast(`🔀 Auto-split calculated across ${data.allocations?.length || 3} organizations!`);
        setSplitLoading(false);
        return;
      }
    } catch (e) { /* fall through */ }

    // Client-side smart split
    const totalServings = listing.quantity_servings;
    const totalWeight = listing.weight_kg;
    const category = listing.food_category;

    let allocations = [];

    if (category === 'COOKED_MEALS') {
      allocations = [
        { ngo_id: 'ngo-101', ngo_name: 'Akshaya Patra Foundation', category_type: 'NGO / Food Shelter', allocated_servings: Math.ceil(totalServings * 0.40), allocated_weight_kg: (totalWeight * 0.40).toFixed(1), distance_km: 2.1, estimated_transit_mins: 12, address: 'Dwarka Sector 10, New Delhi', phone: '+91 98101 23456' },
        { ngo_id: 'ngo-102', ngo_name: 'Sunrise Children Orphanage', category_type: 'Orphanage', allocated_servings: Math.ceil(totalServings * 0.35), allocated_weight_kg: (totalWeight * 0.35).toFixed(1), distance_km: 3.4, estimated_transit_mins: 16, address: 'Janakpuri Block B, New Delhi', phone: '+91 98234 56789' },
        { ngo_id: 'ngo-103', ngo_name: 'Hope Senior Old Age Home', category_type: 'Old Age Home', allocated_servings: Math.floor(totalServings * 0.25), allocated_weight_kg: (totalWeight * 0.25).toFixed(1), distance_km: 4.8, estimated_transit_mins: 20, address: 'Uttam Nagar East, New Delhi', phone: '+91 98345 67890' }
      ];
    } else if (category === 'PRODUCE') {
      allocations = [
        { ngo_id: 'ngo-104', ngo_name: 'Safe Haven Animal Rescue', category_type: '🐾 Animal Shelter', allocated_servings: Math.ceil(totalServings * 0.50), allocated_weight_kg: (totalWeight * 0.50).toFixed(1), distance_km: 3.7, estimated_transit_mins: 18, address: 'Najafgarh Road, New Delhi', phone: '+91 98456 78901' },
        { ngo_id: 'ngo-101', ngo_name: 'Akshaya Patra Foundation', category_type: 'NGO / Food Shelter', allocated_servings: Math.ceil(totalServings * 0.30), allocated_weight_kg: (totalWeight * 0.30).toFixed(1), distance_km: 2.1, estimated_transit_mins: 12, address: 'Dwarka Sector 10, New Delhi', phone: '+91 98101 23456' },
        { ngo_id: 'ngo-102', ngo_name: 'Sunrise Children Orphanage', category_type: 'Orphanage', allocated_servings: Math.floor(totalServings * 0.20), allocated_weight_kg: (totalWeight * 0.20).toFixed(1), distance_km: 3.4, estimated_transit_mins: 16, address: 'Janakpuri Block B, New Delhi', phone: '+91 98234 56789' }
      ];
    } else if (category === 'BAKERY' || category === 'PACKAGED') {
      allocations = [
        { ngo_id: 'ngo-102', ngo_name: 'Sunrise Children Orphanage', category_type: 'Orphanage', allocated_servings: Math.ceil(totalServings * 0.50), allocated_weight_kg: (totalWeight * 0.50).toFixed(1), distance_km: 3.4, estimated_transit_mins: 16, address: 'Janakpuri Block B, New Delhi', phone: '+91 98234 56789' },
        { ngo_id: 'ngo-103', ngo_name: 'Hope Senior Old Age Home', category_type: 'Old Age Home', allocated_servings: Math.floor(totalServings * 0.30), allocated_weight_kg: (totalWeight * 0.30).toFixed(1), distance_km: 4.8, estimated_transit_mins: 20, address: 'Uttam Nagar East, New Delhi', phone: '+91 98345 67890' },
        { ngo_id: 'ngo-101', ngo_name: 'Akshaya Patra Foundation', category_type: 'NGO / Food Shelter', allocated_servings: Math.floor(totalServings * 0.20), allocated_weight_kg: (totalWeight * 0.20).toFixed(1), distance_km: 2.1, estimated_transit_mins: 12, address: 'Dwarka Sector 10, New Delhi', phone: '+91 98101 23456' }
      ];
    } else { // DAIRY and others
      allocations = [
        { ngo_id: 'ngo-101', ngo_name: 'Akshaya Patra Foundation', category_type: 'NGO / Food Shelter', allocated_servings: Math.ceil(totalServings * 0.45), allocated_weight_kg: (totalWeight * 0.45).toFixed(1), distance_km: 2.1, estimated_transit_mins: 12, address: 'Dwarka Sector 10, New Delhi', phone: '+91 98101 23456' },
        { ngo_id: 'ngo-103', ngo_name: 'Hope Senior Old Age Home', category_type: 'Old Age Home', allocated_servings: Math.ceil(totalServings * 0.35), allocated_weight_kg: (totalWeight * 0.35).toFixed(1), distance_km: 4.8, estimated_transit_mins: 20, address: 'Uttam Nagar East, New Delhi', phone: '+91 98345 67890' },
        { ngo_id: 'ngo-102', ngo_name: 'Sunrise Children Orphanage', category_type: 'Orphanage', allocated_servings: Math.floor(totalServings * 0.20), allocated_weight_kg: (totalWeight * 0.20).toFixed(1), distance_km: 3.4, estimated_transit_mins: 16, address: 'Janakpuri Block B, New Delhi', phone: '+91 98234 56789' }
      ];
    }

    setSplitResult({
      listing_id: listing.id,
      total_servings: totalServings,
      matching_timestamp: new Date().toISOString(),
      allocations
    });
    setSplitLoading(false);
  };

  const handleApproveSplitDispatch = () => {
    if (!splitModalListing || !splitResult) return;

    setListings(prev => prev.map(item => {
      if (item.id === splitModalListing.id) {
        return { ...item, status: 'SPLIT_ALLOCATED', split_allocations: splitResult.allocations };
      }
      return item;
    }));

    // Update metrics
    setLiveMetrics(prev => ({
      ...prev,
      total_meals_rescued: prev.total_meals_rescued + Math.floor(splitModalListing.quantity_servings * 0.9),
      total_co2_avoided_kg: Number((prev.total_co2_avoided_kg + (splitModalListing.weight_kg || 10) * 2.5).toFixed(1)),
      verified_pickups_count: prev.verified_pickups_count + splitResult.allocations.length
    }));

    showToast(`🚀 Dispatch approved! Push notifications sent to ${splitResult.allocations.length} organizations!`);
    setSplitModalListing(null);
    setSplitResult(null);
  };

  const handleQRVerified = (verifiedListing) => {
    setListings(prev => prev.map(item => {
      if (item.id === verifiedListing.id) {
        return { ...item, status: 'VERIFIED_PICKUP' };
      }
      return item;
    }));

    setLiveMetrics(prev => ({
      ...prev,
      total_meals_rescued: prev.total_meals_rescued + (verifiedListing.quantity_servings || 50),
      total_co2_avoided_kg: Number((prev.total_co2_avoided_kg + (verifiedListing.weight_kg || 15) * 2.5).toFixed(1)),
      total_food_saved_tonnes: Number((prev.total_food_saved_tonnes + (verifiedListing.weight_kg || 15) / 1000).toFixed(2)),
      verified_pickups_count: prev.verified_pickups_count + 1
    }));

    showToast(`✅ QR Pickup verified for "${verifiedListing.food_title}"! Impact stats updated.`);
  };

  const handleRoleChange = (newRole) => {
    setActiveRole(newRole);
    if (newRole === 'NGO') {
      setActiveTab('feed');
      showToast('🏥 Switched to NGO Mode — Claim surplus food and generate QR handoffs.', 'info');
    } else if (newRole === 'RESTAURANT') {
      setActiveTab('donate');
      showToast('🍴 Switched to Donor Mode — List surplus food for AI evaluation.', 'info');
    } else if (newRole === 'ADMIN') {
      setActiveTab('analytics');
      showToast('📊 Switched to Admin Mode — Platform analytics & oversight.', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-[#e8f0e8] flex flex-col font-sans selection:bg-emerald-500 selection:text-white">

      {/* Toast Banner */}
      {toastMessage && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-xl ${
          toastType === 'info' ? 'bg-blue-600' : 'bg-emerald-600'
        } text-white font-semibold text-xs shadow-2xl flex items-center space-x-2 max-w-xs animate-bounce`}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeRole={activeRole}
        setActiveRole={handleRoleChange}
        liveMetrics={liveMetrics}
        onOpenOnboarding={() => setShowOnboarding(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {activeTab === 'analytics' && (
          <Dashboard metrics={liveMetrics} onExploreListings={() => setActiveTab('feed')} />
        )}

        {activeTab === 'donate' && (
          <DonationForm 
  onListingCreated={handleListingCreated} 
  API_URL={import.meta.env.VITE_API_URL || 'http://localhost:8000'} 
/>
        )}

        {activeTab === 'feed' && (
          <SurplusFeed
            listings={listings}
            onTriggerSplit={handleTriggerSplit}
            onOpenContactModal={(listing) => setContactModalListing(listing)}
            onOpenQRModal={(listing) => setQrModalListing(listing)}
            onOpenRatingModal={(listing, role) => setRatingModalConfig({ listing, role: role || activeRole })}
          />
        )}

        {activeTab === 'map' && (
          <LiveMap
            listings={listings}
            onOpenContactModal={(listing) => setContactModalListing(listing)}
            onTriggerSplit={handleTriggerSplit}
          />
        )}

        {activeTab === 'leaderboard' && (
          <Leaderboard />
        )}
      </main>

      {/* Contact Modal */}
      {contactModalListing && (
        <ContactSharingModal
          listing={contactModalListing}
          onClose={() => setContactModalListing(null)}
          API_URL={API_URL}
        />
      )}

      {/* QR Modal */}
      {qrModalListing && (
        <QRModal
          listing={qrModalListing}
          onClose={() => setQrModalListing(null)}
          API_URL={API_URL}
          onVerified={() => handleQRVerified(qrModalListing)}
          onOpenRating={(listing) => {
            setQrModalListing(null);
            setRatingModalConfig({ listing, role: 'NGO' });
          }}
        />
      )}

      {/* Dual-Sided Rating Modal */}
      {ratingModalConfig && (
        <RatingModal
          listing={ratingModalConfig.listing}
          initialRole={ratingModalConfig.role}
          onClose={() => setRatingModalConfig(null)}
          API_URL={API_URL}
          onRatingSubmitted={() => {
            showToast('⭐ Trust rating logged to Public Trust Ledger!');
            setRatingModalConfig(null);
          }}
        />
      )}

      {/* Onboarding */}
      {showOnboarding && (
        <OnboardingModal onClose={() => { setShowOnboarding(false); setActiveTab('feed'); }} />
      )}

      {/* Auto-Split Modal */}
      {splitModalListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-emerald-500/40 shadow-2xl relative space-y-5">
            {/* Close */}
            <button
              onClick={() => { setSplitModalListing(null); setSplitResult(null); }}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Split className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">Smart Auto-Split Allocation</h3>
                <p className="text-xs text-zinc-400">Multi-recipient distribution across NGOs, Orphanages & Animal Shelters</p>
              </div>
            </div>

            {/* Listing being split */}
            <div className="p-3 rounded-xl bg-[#111711] border border-zinc-800 text-xs">
              <div className="text-zinc-400 mb-1">Splitting:</div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-white">{splitModalListing.food_title}</span>
                <span className="text-emerald-400 font-bold">{splitModalListing.quantity_servings} servings · {splitModalListing.weight_kg} kg</span>
              </div>
              <div className="text-zinc-500 text-[10px] mt-0.5 flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>{splitModalListing.pickup_address}</span>
              </div>
            </div>

            {splitLoading ? (
              <div className="p-8 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <div className="text-xs text-zinc-400">Running Haversine proximity engine + capacity matching...</div>
                <div className="text-[10px] text-zinc-600">Evaluating NGOs, Orphanages, Animal Shelters & Old Age Homes</div>
              </div>
            ) : splitResult ? (
              <div className="space-y-4">
                {/* Summary Banner */}
                <div className="p-3 rounded-xl bg-[#111711] border border-zinc-800 text-xs flex justify-between items-center">
                  <span>Total Surplus: <strong className="text-white">{splitResult.total_servings} Servings</strong></span>
                  <span className="text-emerald-400 font-semibold">→ {splitResult.allocations?.length} Organizations</span>
                </div>

                {/* Allocations */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {splitResult.allocations?.map((alloc, idx) => {
                    const pct = Math.round((alloc.allocated_servings / splitResult.total_servings) * 100);
                    return (
                      <div key={idx} className="p-3.5 rounded-xl bg-[#111711] border border-emerald-500/20 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-white text-sm block">{alloc.ngo_name}</span>
                            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">{alloc.category_type}</span>
                          </div>
                          <div className="text-right">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/30 block">
                              {alloc.allocated_servings} Servings
                            </span>
                            <span className="text-[10px] text-zinc-500">{alloc.allocated_weight_kg} kg · {pct}%</span>
                          </div>
                        </div>
                        {/* Allocation bar */}
                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-2.5 h-2.5" />
                            <span>{alloc.address} ({alloc.distance_km} km)</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>ETA: {alloc.estimated_transit_mins} mins</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-[10px] text-zinc-500">
                          <PhoneCall className="w-2.5 h-2.5" />
                          <span>{alloc.phone}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Approve Button */}
                <button
                  onClick={handleApproveSplitDispatch}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Approve Split & Dispatch Push Notifications</span>
                </button>

                <div className="text-center text-[10px] text-emerald-400">
                  ⚡ Simultaneous push alerts will be triggered to all {splitResult.allocations?.length} recipient organizations
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="glass-panel border-t border-[#1f2b1f] py-6 text-center text-xs text-zinc-500">
        FoodBridge Connect © 2026 • Build With Bharat Hackathon • Team UNION, Netaji Subhas University of Technology
      </footer>
    </div>
  );
}
