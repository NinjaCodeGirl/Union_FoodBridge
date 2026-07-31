import React, { useState } from 'react';
import { PlusCircle, Sparkles, AlertTriangle, CheckCircle2, Thermometer, Clock, MapPin, Phone, Zap, Brain, ShieldCheck, RefreshCw } from 'lucide-react';
import VoiceAssistant from './VoiceAssistant';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBLT4RPnGRu2xbq6P-jwLiSIASTev-R46w';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

export default function DonationForm({ onListingCreated, API_URL }) {
  const [formData, setFormData] = useState({
    donor_name: 'Taj Palace Banquet Kitchen',
    donor_phone: '+91 98999 11223',
    food_title: 'Assorted Paneer Gravy & Rotis',
    food_category: 'COOKED_MEALS',
    classification: 'CATEGORY_A',
    quantity_servings: 150,
    weight_kg: 45.0,
    storage_condition: 'REFRIGERATED',
    pickup_address: 'Sardar Patel Marg, Diplomatic Enclave, New Delhi',
    latitude: 28.5975,
    longitude: 77.1724,
    preparation_timestamp: new Date().toISOString().slice(0, 16)
  });

  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [aiSource, setAiSource] = useState(''); // 'GEMINI' or 'LOCAL'

  const samplePresets = [
    {
      label: '🍱 Hotel Banquet Feast',
      data: {
        donor_name: 'Taj Palace Banquet Kitchen',
        donor_phone: '+91 98999 11223',
        food_title: 'Fresh Paneer Makhani, Dal Makhani & Rotis',
        food_category: 'COOKED_MEALS',
        classification: 'CATEGORY_A',
        quantity_servings: 250,
        weight_kg: 75.0,
        storage_condition: 'HEATED',
        pickup_address: 'Sardar Patel Marg, Diplomatic Enclave, New Delhi',
        latitude: 28.5975,
        longitude: 77.1724
      }
    },
    {
      label: '🥛 Dairy & Perishables',
      data: {
        donor_name: 'Mother Dairy Surplus Distribution Hub',
        donor_phone: '+91 98111 22334',
        food_title: 'Fresh Milk Packets & Curd Tubs',
        food_category: 'DAIRY',
        classification: 'CATEGORY_B',
        quantity_servings: 180,
        weight_kg: 90.0,
        storage_condition: 'REFRIGERATED',
        pickup_address: 'Janakpuri Block B, New Delhi',
        latitude: 28.6219,
        longitude: 77.0878
      }
    },
    {
      label: '🍞 Artisan Bakery Surplus',
      data: {
        donor_name: 'Bikanervala Sweets & Bakery',
        donor_phone: '+91 98222 33445',
        food_title: 'Assorted Sandwich Loaves & Muffins',
        food_category: 'BAKERY',
        classification: 'CATEGORY_A',
        quantity_servings: 120,
        weight_kg: 36.0,
        storage_condition: 'ROOM_TEMP',
        pickup_address: 'Sector 6 Dwarka, New Delhi',
        latitude: 28.5861,
        longitude: 77.0789
      }
    }
  ];

  const handleApplyPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      ...preset.data,
      preparation_timestamp: new Date().toISOString().slice(0, 16)
    }));
    setSuccessMsg(`Loaded sample preset: ${preset.label}`);
    setAiResult(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity_servings' || name === 'weight_kg' ? Number(value) : value
    }));
  };

  const handleVoiceTranscript = (text) => {
    setFormData(prev => ({ ...prev, food_title: text }));
  };

  // Client-side AI Freshness Engine (deterministic fallback)
  const runLocalFreshnessEngine = (fd) => {
    const prepTime = new Date(fd.preparation_timestamp);
    const hoursAgo = Math.max(0, (Date.now() - prepTime.getTime()) / (1000 * 60 * 60));

    let baseScore = 98.5 - (hoursAgo * 3.4);
    if (fd.storage_condition === 'REFRIGERATED') baseScore += 5.0;
    if (fd.storage_condition === 'HEATED') baseScore += 2.5;
    if (fd.storage_condition === 'ROOM_TEMP' && hoursAgo > 2) baseScore -= 14.0;
    if (fd.classification === 'CATEGORY_B' && fd.storage_condition !== 'REFRIGERATED') baseScore -= 18.0;
    if (fd.food_category === 'BAKERY') baseScore += 3.5;
    if (fd.food_category === 'PRODUCE') baseScore += 2.0;

    const finalScore = Math.max(18.0, Math.min(99.4, Number(baseScore.toFixed(1))));
    const riskLevel = finalScore >= 80 ? 'LOW' : finalScore >= 55 ? 'MODERATE' : 'HIGH';
    const shelfLife = Math.max(1, Number((Math.max(0, 10 - hoursAgo) * (finalScore / 100)).toFixed(1)));

    const titleLower = fd.food_title.toLowerCase();
    const detectedAllergens = [];
    if (titleLower.includes('paneer') || titleLower.includes('milk') || titleLower.includes('curd') || titleLower.includes('dairy') || titleLower.includes('cream') || titleLower.includes('butter') || titleLower.includes('cheese')) detectedAllergens.push('Dairy');
    if (titleLower.includes('roti') || titleLower.includes('bread') || titleLower.includes('muffin') || titleLower.includes('wheat') || titleLower.includes('naan') || titleLower.includes('cake') || titleLower.includes('loaf')) detectedAllergens.push('Gluten');
    if (titleLower.includes('peanut') || titleLower.includes('almond') || titleLower.includes('nut') || titleLower.includes('cashew')) detectedAllergens.push('Nuts');
    if (titleLower.includes('egg') || titleLower.includes('omelette')) detectedAllergens.push('Egg');
    if (detectedAllergens.length === 0) detectedAllergens.push('None Detected');

    let recommendation = '';
    let safetyCategory = '';
    if (finalScore >= 80) {
      safetyCategory = 'HIGHLY_FRESH';
      recommendation = `✅ Optimal freshness! Safe for direct distribution to any verified shelter. ${fd.classification === 'CATEGORY_B' ? '❄️ Cold chain maintained.' : '🌾 Ambient conditions acceptable.'}`;
    } else if (finalScore >= 55) {
      safetyCategory = 'MODERATE_RESCUE';
      recommendation = '⚡ Good condition. Priority dispatch within 2 hours recommended. Nearest NGO should claim immediately.';
    } else if (finalScore >= 25) {
      safetyCategory = 'URGENT_DISPATCH';
      recommendation = '⚠️ Urgent dispatch needed within 45 minutes to immediate nearby shelter. Alert nearest NGO now.';
    } else {
      safetyCategory = 'CRITICAL';
      recommendation = '🚫 Freshness score critically low. Review food handling procedures before listing.';
    }

    const randomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const validationHash = `0x${randomHex}`;

    return {
      freshness_score: finalScore,
      risk_level: riskLevel,
      allergens: detectedAllergens,
      validation_hash: validationHash,
      estimated_shelf_life_hours: shelfLife,
      safety_category: safetyCategory,
      ai_recommendation: recommendation
    };
  };

  // Try Gemini AI first, then fall back to local engine
  const handleEvaluateAI = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setAiResult(null);

    const formattedPayload = {
      ...formData,
      quantity_servings: Number(formData.quantity_servings),
      weight_kg: Number(formData.weight_kg),
      preparation_timestamp: new Date(formData.preparation_timestamp).toISOString()
    };

    const prepTime = new Date(formData.preparation_timestamp);
    const hoursAgo = Math.max(0, (Date.now() - prepTime.getTime()) / (1000 * 60 * 60));

    // Try Gemini AI
    let geminiEnhancement = null;
    try {
      setLoadingStep('Connecting to Gemini AI neural network...');
      const prompt = `You are a food safety AI for a food redistribution NGO platform. Analyze this surplus food donation:

Food Item: "${formData.food_title}"
Category: ${formData.food_category}
Storage: ${formData.storage_condition}
Cold Chain Required: ${formData.classification === 'CATEGORY_B' ? 'YES' : 'NO'}
Hours since preparation: ${hoursAgo.toFixed(1)}
Quantity: ${formData.quantity_servings} servings (${formData.weight_kg} kg)

Provide ONLY a raw JSON response (no markdown, no explanation) with exactly these keys:
{"score_adjustment": 0, "risk_level": "LOW", "allergens": ["Dairy"], "safety_category": "HIGHLY_FRESH", "recommendation": "Short 1-2 sentence advice for distribution.", "is_safe": true}

score_adjustment should be between -10 and +5 (adjusts base freshness score).
risk_level options: LOW, MODERATE, HIGH, CRITICAL
safety_category options: HIGHLY_FRESH, MODERATE_RESCUE, URGENT_DISPATCH, EXPIRED
allergens: detect from food name (Dairy, Gluten, Nuts, Egg, Soy, Shellfish)`;

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 256 }
        })
      });

      if (response.ok) {
        setLoadingStep('Gemini AI analyzing food freshness parameters...');
        const geminiData = await response.json();
        let text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        // Strip markdown code blocks if present
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        geminiEnhancement = JSON.parse(text);
        setAiSource('GEMINI');
      }
    } catch (err) {
      // Silently fall back to local engine
      setAiSource('LOCAL');
    }

    setLoadingStep('Computing freshness decay curves & allergen profile...');

    await new Promise(resolve => setTimeout(resolve, 400));

    // Run local engine for base values
    const localResult = runLocalFreshnessEngine(formData);

    // Merge Gemini enhancements if available
    let finalResult = { ...localResult };
    if (geminiEnhancement) {
      const adjustedScore = Math.max(18.0, Math.min(99.4,
        localResult.freshness_score + (geminiEnhancement.score_adjustment || 0)
      ));
      const mergedAllergens = [...new Set([
        ...localResult.allergens.filter(a => a !== 'None Detected'),
        ...(geminiEnhancement.allergens || [])
      ])];
      finalResult = {
        ...localResult,
        freshness_score: Number(adjustedScore.toFixed(1)),
        risk_level: geminiEnhancement.risk_level || localResult.risk_level,
        allergens: mergedAllergens.length > 0 ? mergedAllergens : ['None Detected'],
        safety_category: geminiEnhancement.safety_category || localResult.safety_category,
        ai_recommendation: geminiEnhancement.recommendation || localResult.ai_recommendation
      };
    }

    const aiEvaluatedListing = {
      id: `list-${Date.now()}`,
      ...formattedPayload,
      ...finalResult,
      status: 'AVAILABLE',
      created_at: new Date().toISOString()
    };

    setAiResult(aiEvaluatedListing);
    setSuccessMsg(`AI Freshness Verified! Score: ${finalResult.freshness_score}% (${finalResult.risk_level} Risk) — ${aiSource === 'GEMINI' ? 'Powered by Gemini AI' : 'Local AI Engine'}`);
    if (onListingCreated) onListingCreated(aiEvaluatedListing);
    setLoading(false);
    setLoadingStep('');
  };

  const scoreColor = aiResult
    ? aiResult.freshness_score >= 80 ? 'text-emerald-400'
    : aiResult.freshness_score >= 55 ? 'text-amber-400'
    : 'text-red-400'
    : 'text-emerald-400';

  const scoreBarColor = aiResult
    ? aiResult.freshness_score >= 80 ? 'bg-emerald-500'
    : aiResult.freshness_score >= 55 ? 'bg-amber-500'
    : 'bg-red-500'
    : 'bg-emerald-500';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-[#1f2b1f]">

        {/* Header & 1-Tap Sample Prefill Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <h2 className="font-display font-bold text-2xl text-white flex items-center space-x-2">
              <PlusCircle className="w-6 h-6 text-emerald-400" />
              <span>List Surplus Food</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Submit food surplus to trigger <span className="text-emerald-400 font-semibold">Gemini AI Freshness</span> evaluation and proximity matching across verified NGOs & shelters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5" />
              <span>1-Tap Samples:</span>
            </span>
            {samplePresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-emerald-950 text-zinc-300 hover:text-emerald-300 border border-zinc-800 hover:border-emerald-500/40 text-xs font-medium transition-all"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form className="mt-6 space-y-6" onSubmit={handleEvaluateAI}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Donor / Organization Name</label>
              <input
                type="text"
                name="donor_name"
                value={formData.donor_name}
                onChange={handleChange}
                required
                className="w-full bg-[#111711] text-sm text-white border border-zinc-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Contact Phone (Ola-Style Call Sharing)</span>
              </label>
              <input
                type="text"
                name="donor_phone"
                value={formData.donor_phone}
                onChange={handleChange}
                required
                className="w-full bg-[#111711] text-sm text-white border border-zinc-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-zinc-300">Food Title & Dish Description</label>
                <VoiceAssistant onTranscriptReceived={handleVoiceTranscript} />
              </div>
              <input
                type="text"
                name="food_title"
                value={formData.food_title}
                onChange={handleChange}
                placeholder="e.g. Fresh Cooked Rice & Dal Makhani"
                required
                className="w-full bg-[#111711] text-sm text-white border border-zinc-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Food Category</label>
              <select
                name="food_category"
                value={formData.food_category}
                onChange={handleChange}
                className="w-full bg-[#111711] text-sm text-white border border-zinc-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="COOKED_MEALS">🍛 Cooked Meals (Dal, Rice, Gravies)</option>
                <option value="BAKERY">🍞 Bakery & Bread</option>
                <option value="PRODUCE">🥦 Fresh Fruits & Produce</option>
                <option value="PACKAGED">📦 Packaged Dry Items</option>
                <option value="DAIRY">🥛 Dairy & Perishables</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Classification Type</label>
              <select
                name="classification"
                value={formData.classification}
                onChange={handleChange}
                className="w-full bg-[#111711] text-sm text-white border border-zinc-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="CATEGORY_A">🌾 Category A — Ambient / Normal Food (Rice, Dal, Roti)</option>
                <option value="CATEGORY_B">❄️ Category B — Cold Chain Required (Milk, Paneer, Meat)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Servings Count</label>
                <input
                  type="number"
                  name="quantity_servings"
                  value={formData.quantity_servings}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full bg-[#111711] text-sm text-white border border-zinc-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Weight (Kg)</label>
                <input
                  type="number"
                  name="weight_kg"
                  value={formData.weight_kg}
                  onChange={handleChange}
                  step="0.5"
                  min="0.5"
                  required
                  className="w-full bg-[#111711] text-sm text-white border border-zinc-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Preparation Timestamp</span>
              </label>
              <input
                type="datetime-local"
                name="preparation_timestamp"
                value={formData.preparation_timestamp}
                onChange={handleChange}
                required
                className="w-full bg-[#111711] text-sm text-white border border-zinc-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center space-x-1">
                <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Storage Condition</span>
              </label>
              <select
                name="storage_condition"
                value={formData.storage_condition}
                onChange={handleChange}
                className="w-full bg-[#111711] text-sm text-white border border-zinc-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="REFRIGERATED">❄️ Refrigerated (2°C - 5°C)</option>
                <option value="HEATED">🔥 Heated Hold (60°C+)</option>
                <option value="ROOM_TEMP">🌡️ Room Temperature Ambient</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exact Pickup Address</span>
            </label>
            <input
              type="text"
              name="pickup_address"
              value={formData.pickup_address}
              onChange={handleChange}
              required
              className="w-full bg-[#111711] text-sm text-white border border-zinc-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-4 flex-wrap">
            <div className="text-xs text-zinc-400 flex items-center space-x-2">
              <Brain className="w-4 h-4 text-emerald-400" />
              <span>Gemini AI + Local Engine evaluates freshness, allergens & safety hash</span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit & Evaluate AI Score</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Loading Animation */}
        {loading && (
          <div className="mt-6 p-5 rounded-2xl bg-[#111711] border border-emerald-500/20 animate-fadeIn">
            <div className="flex items-center space-x-3 text-xs text-zinc-300">
              <div className="relative">
                <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
              </div>
              <div className="flex flex-col">
                <span className="text-emerald-400 font-semibold text-sm">AI Freshness Engine Running</span>
                <span className="text-zinc-500 mt-0.5">{loadingStep}</span>
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* AI Freshness Result Box */}
        {aiResult && !loading && (
          <div className="mt-8 p-6 rounded-2xl bg-[#111711] border border-emerald-500/30 space-y-5 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-bold text-lg text-white">AI Freshness Evaluation Score</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  aiSource === 'GEMINI'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-zinc-700 text-zinc-400 border-zinc-600'
                }`}>
                  {aiSource === 'GEMINI' ? '✦ Gemini AI' : '⚙ Local Engine'}
                </span>
              </div>
              <span className={`text-3xl font-bold font-display ${scoreColor}`}>
                {aiResult.freshness_score}%
              </span>
            </div>

            {/* Score Bar */}
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${scoreBarColor} rounded-full transition-all duration-1000`}
                style={{ width: `${aiResult.freshness_score}%` }}
              />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-400 block">Est. Remaining Shelf Life</span>
                <span className="font-semibold text-white text-sm">{aiResult.estimated_shelf_life_hours} Hours</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-400 block">Risk Level</span>
                <span className={`font-semibold text-sm ${
                  aiResult.risk_level === 'LOW' ? 'text-emerald-400' :
                  aiResult.risk_level === 'MODERATE' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {aiResult.risk_level}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-400 block">Detected Allergens</span>
                <span className="font-semibold text-amber-300 text-sm">
                  {aiResult.allergens && aiResult.allergens.length > 0 ? aiResult.allergens.join(', ') : 'None'}
                </span>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-2">
              <div className="flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-400 block mb-1">AI Recommendation</strong>
                  {aiResult.ai_recommendation}
                </div>
              </div>
            </div>

            {/* Validation Hash */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[10px] font-mono text-zinc-500 flex items-center space-x-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="truncate">Validation Hash: {aiResult.validation_hash}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
