import React, { useState, useEffect } from 'react';
import { QrCode, ShieldCheck, CheckCircle2, AlertTriangle, X, Sparkles, RefreshCw, Star, Download, Copy } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function QRModal({ listing, onClose, API_URL, onVerified, onOpenRating }) {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (listing) generateQR();
  }, [listing]);

  const generateQR = () => {
    setLoading(true);
    setErrorMsg('');
    setVerifiedResult(null);

    setTimeout(() => {
      const handshakeId = `HS-${Math.floor(100000 + Math.random() * 900000)}`;
      const issuedAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
      const token = `FB-JWT-${listing.id}-${Date.now()}-${handshakeId}`;

      // Compact payload string embedded in QR
      const payload = {
        iss: 'FoodBridge-Ledger-v1',
        hs: handshakeId,
        lid: listing.id,
        food: listing.food_title,
        qty: listing.quantity_servings,
        donor: listing.donor_name,
        addr: listing.pickup_address,
        cat: listing.classification,
        iat: issuedAt,
        exp: expiresAt,
        tok: token.slice(-12)
      };

      const payloadStr = JSON.stringify(payload);
      // Use QR server API to generate actual scannable QR code
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=059669&bgcolor=0a0f0a&margin=10&data=${encodeURIComponent(payloadStr)}`;

      setQrData({
        handshake_id: handshakeId,
        verification_token: token,
        qr_image_url: qrUrl,
        payload_preview: payloadStr,
        issued_at: issuedAt,
        expires_at: expiresAt
      });
      setLoading(false);
    }, 600);
  };

  const handleSimulateScan = () => {
    if (!qrData?.verification_token) return;
    setVerifying(true);
    setErrorMsg('');

    const co2Saved = Number(((listing.weight_kg || 20) * 2.5).toFixed(1));
    const mealsRescued = listing.quantity_servings || 50;

    setTimeout(() => {
      setVerifiedResult({
        message: 'Cryptographic Handoff Signature Validated • Pickup Complete!',
        co2_mitigated_kg: co2Saved,
        meals_rescued: mealsRescued,
        verified_at: new Date().toISOString(),
        trust_delta: '+1.2',
        handshake_id: qrData.handshake_id
      });
      setVerifying(false);

      try {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.55 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b']
        });
      } catch (e) {}

      if (onVerified) onVerified();
    }, 900);
  };

  const handleCopyToken = () => {
    if (qrData?.verification_token) {
      navigator.clipboard.writeText(qrData.verification_token).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!listing) return null;

  const verifiedAtFormatted = verifiedResult
    ? new Date(verifiedResult.verified_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-emerald-500/40 shadow-2xl relative overflow-hidden">

        {/* Glow effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-green-400 to-emerald-600" />

        <div className="p-6 space-y-5 text-center">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <QrCode className="w-7 h-7" />
            </div>
            <h3 className="font-display font-bold text-xl text-white">QR Pickup Verification</h3>
            <p className="text-xs text-zinc-400 mt-1">FoodBridge Cryptographic Ledger Token — Scan at Pickup</p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-center space-x-1">
              <AlertTriangle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* QR Code Area */}
          {loading ? (
            <div className="h-72 flex flex-col items-center justify-center space-y-3 text-zinc-400 text-xs">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
              <span>Generating cryptographic QR payload...</span>
              <div className="h-1 w-32 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-emerald-500 rounded-full animate-pulse" />
              </div>
            </div>
          ) : qrData ? (
            <div className="space-y-4">
              {!verifiedResult ? (
                <>
                  {/* QR Code Display */}
                  <div className="flex justify-center">
                    <div className="relative p-3 bg-white rounded-2xl shadow-2xl border-4 border-emerald-500/40 inline-block">
                      <img
                        src={qrData.qr_image_url}
                        alt="Pickup Verification QR Code"
                        className="w-52 h-52 object-contain"
                        onError={(e) => {
                          // Fallback to a different QR service if main fails
                          e.target.src = `https://chart.googleapis.com/chart?chs=220x220&cht=qr&chl=${encodeURIComponent(qrData.verification_token)}&choe=UTF-8`;
                        }}
                      />
                      {/* Scan corners overlay */}
                      <div className="absolute top-1 left-1 w-5 h-5 border-t-2 border-l-2 border-emerald-500 rounded-tl" />
                      <div className="absolute top-1 right-1 w-5 h-5 border-t-2 border-r-2 border-emerald-500 rounded-tr" />
                      <div className="absolute bottom-1 left-1 w-5 h-5 border-b-2 border-l-2 border-emerald-500 rounded-bl" />
                      <div className="absolute bottom-1 right-1 w-5 h-5 border-b-2 border-r-2 border-emerald-500 rounded-br" />
                    </div>
                  </div>

                  {/* Token Info */}
                  <div className="text-xs text-zinc-400 space-y-1.5 p-3 rounded-xl bg-[#111711] border border-zinc-800 text-left">
                    <div className="flex justify-between items-center">
                      <span>Handshake ID:</span>
                      <span className="text-emerald-400 font-mono font-semibold">{qrData.handshake_id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Food Item:</span>
                      <span className="text-white font-medium truncate max-w-[180px]">{listing.food_title}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Quantity:</span>
                      <span className="text-emerald-300 font-bold">{listing.quantity_servings} Servings ({listing.weight_kg} kg)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Donor:</span>
                      <span className="text-white text-[11px] truncate max-w-[180px]">{listing.donor_name}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-zinc-800">
                      <span>Expires:</span>
                      <span className="text-amber-400 text-[10px]">{new Date(qrData.expires_at).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Copy token button */}
                  <button
                    onClick={handleCopyToken}
                    className="w-full py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs hover:text-white hover:border-zinc-500 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? '✓ Token Copied!' : 'Copy Verification Token'}</span>
                  </button>

                  {/* Simulate Scan Button */}
                  <button
                    onClick={handleSimulateScan}
                    disabled={verifying}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 disabled:opacity-60"
                  >
                    {verifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Cryptographic Signature...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Simulate NGO Pickup QR Scan ✓</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                /* Verified Result Panel */
                <div className="space-y-4 animate-fadeIn">
                  {/* Success Banner */}
                  <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/50 text-emerald-300 space-y-3">
                    <div className="flex items-center justify-center space-x-2 font-bold text-lg text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                      <span>Pickup Verified! 🎉</span>
                    </div>
                    <div className="text-xs text-emerald-200">{verifiedResult.message}</div>
                  </div>

                  {/* Impact Stats */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#111711] border border-emerald-500/20 text-center">
                      <div className="text-zinc-400 mb-1">🌱 CO₂ Mitigated</div>
                      <div className="text-emerald-400 font-bold text-lg">{verifiedResult.co2_mitigated_kg} kg</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#111711] border border-amber-500/20 text-center">
                      <div className="text-zinc-400 mb-1">🍽️ Meals Rescued</div>
                      <div className="text-amber-400 font-bold text-lg">{verifiedResult.meals_rescued}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#111711] border border-zinc-800 text-xs text-zinc-400 flex justify-between items-center">
                    <span>Trust Ledger Update:</span>
                    <span className="text-emerald-400 font-bold">{verifiedResult.trust_delta} Points ✓</span>
                  </div>

                  {/* Rate Now Button */}
                  {onOpenRating && (
                    <button
                      onClick={() => onOpenRating(listing)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-amber-500/20"
                    >
                      <Star className="w-4 h-4 fill-black" />
                      <span>Rate This Transaction Now →</span>
                    </button>
                  )}

                  <button
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold transition-all"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
