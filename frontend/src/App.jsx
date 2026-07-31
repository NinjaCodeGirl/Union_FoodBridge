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
import { Split, X, Sparkles, CheckCircle2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const MOCK_LISTINGS = [
  {
    id: 'list-001',
    donor_name: 'NSUT Campus Dining Hall',
    donor_phone: '+91 98765 43210',
    food_title: 'Fresh Cooked Dal Makhani & Rice',
    food_category: 'COOKED_MEALS',
    classification: 'CATEGORY_A',
    quantity_servings: 180,
    weight_kg: 54.0,
    freshness_score: 94.50,
    risk_level: 'LOW',
    allergens: ['Dairy', 'Gluten'],
    validation_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
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
    freshness_score: 88.00,
    risk_level: 'LOW',
    allergens: ['Dairy', 'Gluten'],
    validation_hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    estimated_shelf_life_hours: 4.5,
    status: 'AVAILABLE',
    pickup_address: 'Sardar Patel Marg, Diplomatic Enclave, New Delhi',
    latitude: 28.5975,
    longitude: 77.1724,
    created_at: new Date().toISOString()
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('feed'); // feed, donate, map, analytics, leaderboard
  const [activeRole, setActiveRole] = useState('RESTAURANT'); // RESTAURANT, NGO, ADMIN
  const [listings, setListings] = useState(MOCK_LISTINGS);
  const [liveMetrics, setLiveMetrics] = useState({
    total_meals_rescued: 15420,
    total_co2_avoided_kg: 38550.0,
    total_food_saved_tonnes: 4.62,
    active_ngo_partners: 54,
    verified_pickups_count: 3210,
    average_match_time_mins: 12.4
  });

  // Modal States
  const [contactModalListing, setContactModalListing] = useState(null);
  const [qrModalListing, setQrModalListing] = useState(null);
  const [ratingModalListing, setRatingModalListing] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [splitModalListing, setSplitModalListing] = useState(null);
  const [splitResult, setSplitResult] = useState(null);
  const [splitLoading, setSplitLoading] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  useEffect(() => {
    fetchActiveListings();
    fetchMetrics();
  }, []);

  const fetchActiveListings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/donations/active`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setListings(data);
        }
      }
    } catch (e) {
      console.warn('Backend API connection offline, using fallback dataset:', e);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API_URL}/api/analytics/impact`);
      if (res.ok) {
        const data = await res.json();
        setLiveMetrics(data);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleListingCreated = (newListing) => {
    setListings(prev => [newListing, ...prev]);
    setActiveTab('feed');
    showToast(`Surplus food listed successfully! AI Score: ${newListing.freshness_score}%`);
    fetchMetrics();
  };

  const handleTriggerSplit = async (listing) => {
    setSplitModalListing(listing);
    setSplitLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/matching/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listing.id,
          max_recipients: 3
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSplitResult(data);
        showToast(`Auto-split match executed across ${data.allocations?.length || 3} nearby NGOs!`);
      } else {
        // Fallback split simulation
        setSplitResult({
          listing_id: listing.id,
          total_servings: listing.quantity_servings,
          matching_timestamp: new Date().toISOString(),
          allocations: [
            { ngo_id: 'ngo-101', ngo_name: 'Akshaya Patra Foundation Shelter', allocated_servings: Math.ceil(listing.quantity_servings * 0.45), allocated_weight_kg: (listing.weight_kg * 0.45).toFixed(1), distance_km: 2.4, estimated_transit_mins: 14, address: 'Dwarka Sector 10', phone: '+91 98101 23456' },
            { ngo_id: 'ngo-102', ngo_name: 'Robin Hood Army - Janakpuri', allocated_servings: Math.ceil(listing.quantity_servings * 0.35), allocated_weight_kg: (listing.weight_kg * 0.35).toFixed(1), distance_km: 4.1, estimated_transit_mins: 19, address: 'Janakpuri Block B', phone: '+91 98234 56789' },
            { ngo_id: 'ngo-103', ngo_name: 'Feeding India Shelter', allocated_servings: Math.floor(listing.quantity_servings * 0.20), allocated_weight_kg: (listing.weight_kg * 0.20).toFixed(1), distance_km: 5.8, estimated_transit_mins: 22, address: 'Uttam Nagar East', phone: '+91 98345 67890' }
          ]
        });
        showToast('Auto-split matching simulated across top 3 nearby shelters!');
      }
    } catch (e) {
      console.warn('Matching request fallback:', e);
    } finally {
      setSplitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-[#e8f0e8] flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-2xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        liveMetrics={liveMetrics}
        onOpenOnboarding={() => setShowOnboarding(true)}
      />

      {/* Main Content Area */}
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
            onOpenRatingModal={(listing) => setRatingModalListing(listing)}
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

      {/* Ola-style Contact Sharing & Call Logger Modal */}
      {contactModalListing && (
        <ContactSharingModal
          listing={contactModalListing}
          onClose={() => setContactModalListing(null)}
          API_URL={API_URL}
        />
      )}

      {/* Cryptographic QR Handoff Modal */}
      {qrModalListing && (
        <QRModal
          listing={qrModalListing}
          onClose={() => setQrModalListing(null)}
          API_URL={API_URL}
        />
      )}

      {/* Trust Rating & Review Modal */}
      {ratingModalListing && (
        <RatingModal
          listing={ratingModalListing}
          onClose={() => setRatingModalListing(null)}
          API_URL={API_URL}
          onRatingSubmitted={() => showToast('Rating submitted to public Trust Ledger!')}
        />
      )}

      {/* Interactive Onboarding Guide Modal */}
      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}

      {/* Auto-Split Batch Matching Modal */}
      {splitModalListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-emerald-500/40 shadow-2xl relative space-y-5">
            <button
              onClick={() => { setSplitModalListing(null); setSplitResult(null); }}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Split className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">Proximity Auto-Split Allocation</h3>
                <p className="text-xs text-zinc-400">Multi-recipient distribution algorithm</p>
              </div>
            </div>

            {splitLoading ? (
              <div className="p-8 text-center text-xs text-zinc-400 space-y-2">
                <Sparkles className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
                <span>Running proximity Haversine & capacity matching algorithm...</span>
              </div>
            ) : splitResult ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-[#111711] border border-zinc-800 text-xs flex justify-between items-center">
                  <span>Total Servings: <strong className="text-white">{splitResult.total_servings}</strong></span>
                  <span className="text-emerald-400 font-semibold">Allocated across {splitResult.allocations?.length || 3} NGOs</span>
                </div>

                <div className="space-y-2 text-xs">
                  {splitResult.allocations?.map((alloc, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#111711] border border-emerald-500/20 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">{alloc.ngo_name}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                          {alloc.allocated_servings} Servings ({alloc.allocated_weight_kg} kg)
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                        <span>📍 {alloc.address} ({alloc.distance_km} km)</span>
                        <span>⏱️ ETA: {alloc.estimated_transit_mins} mins</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 text-center text-xs text-emerald-300">
                  ⚡ Push notifications triggered simultaneously to all recipient shelters!
                </div>
              </div>
            ) : null}

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="glass-panel border-t border-[#1f2b1f] py-6 text-center text-xs text-zinc-500">
        FoodBridge Connect &copy; 2026 • Cognitive Chaos Hackathon • Netaji Subhas University of Technology
      </footer>

    </div>
  );
}
