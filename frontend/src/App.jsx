import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Upload, 
  Trash2, 
  ShieldAlert, 
  Info, 
  ChevronRight, 
  Loader2, 
  History, 
  PieChart as PieChartIcon,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  Sun,
  Moon
} from 'lucide-react';

const CATEGORIES = {
  "Disposable Waste": { color: "#22D3EE", icon: CheckCircle2, border: "border-[#22D3EE]/50", bg: "bg-[#22D3EE]/10" },
  "Pathological/Medicinal Waste": { color: "#FBBF24", icon: AlertTriangle, border: "border-[#FBBF24]/50", bg: "bg-[#FBBF24]/10" },
  "Sharps/Glass": { color: "#FB7185", icon: Flame, border: "border-[#FB7185]/50", bg: "bg-[#FB7185]/10" },
  "Radioactive Waste": { color: "#818CF8", icon: Zap, border: "border-[#818CF8]/50", bg: "bg-[#818CF8]/10" }
};

const I18N = {
  en: {
    title: "Bio Medical Waste",
    subtitle: "AI-Powered Hazardous Classification System",
    safetyStatus: "Safety Status",
    liveAudit: "Live Audit Active",
    sourceInput: "Source Input",
    selectWaste: "Select Medical Waste",
    formats: "JPG, PNG or WEBP accepted",
    sensitivity: "Sensitivity",
    analyze: "Analyze Object",
    specs: "Classification Specs",
    sessionLog: "Session Log",
    logEmpty: "Logs will appear after analysis",
    systemAlert: "System Alert",
    wasteUnits: "WASTE UNITS FOUND",
    confidence: "AI Confidence",
    identified: "IDENTIFIED",
    unit: "Unit(s)",
    protocol: "Official Disposal Protocol",
    awaiting: "Awaiting Input",
    awaitingText: "Initiate hazardous waste classification by uploading a document or image for automated safety auditing.",
    historyItems: "items",
    toggleTheme: "Toggle Theme"
  },
  hi: {
    title: "बायो मेडिकल कचरा",
    subtitle: "एआई-संचालित खतरनाक वर्गीकरण प्रणाली",
    safetyStatus: "सुरक्षा स्थिति",
    liveAudit: "लाइव ऑडिट सक्रिय",
    sourceInput: "सोर्स इनपुट",
    selectWaste: "मेडिकल कचरा चुनें",
    formats: "JPG, PNG या WEBP स्वीकार्य हैं",
    sensitivity: "संवेदनशीलता",
    analyze: "वस्तु का विश्लेषण करें",
    specs: "वर्गीकरण विवरण",
    sessionLog: "सत्र लॉग",
    logEmpty: "विश्लेषण के बाद लॉग दिखाई देंगे",
    systemAlert: "सिस्टम अलर्ट",
    wasteUnits: "कचरा इकाइयाँ मिलीं",
    confidence: "एआई विश्वास",
    identified: "पहचाना गया",
    unit: "इकाई(इकाइयाँ)",
    protocol: "आधिकारिक निपटान प्रोटोकॉल",
    awaiting: "इनपुट की प्रतीक्षा है",
    awaitingText: "स्वचालित सुरक्षा ऑडिटिंग के लिए दस्तावेज़ या छवि अपलोड करके खतरनाक कचरे का वर्गीकरण शुरू करें।",
    historyItems: "वस्तुएं",
    toggleTheme: "थीम बदलें"
  },
  mr: {
    title: "बायो मेडिकल कचरा",
    subtitle: "एआय-चालित घातक वर्गीकरण प्रणाली",
    safetyStatus: "सुरक्षा स्थिती",
    liveAudit: "लाइव्ह ऑडिट सक्रिय",
    sourceInput: "स्रोत इनपुट",
    selectWaste: "वैद्यकीय कचरा निवडा",
    formats: "JPG, PNG किंवा WEBP स्वीकारले जातात",
    sensitivity: "संवेदनशीलता",
    analyze: "वस्तूचे विश्लेषण करा",
    specs: "वर्गीकरण तपशील",
    sessionLog: "सत्र लॉग",
    logEmpty: "विश्लेषणानंतर लॉग दिसतील",
    systemAlert: "सिस्टम अलर्ट",
    wasteUnits: "कचरा युनिट्स सापडले",
    confidence: "एआय विश्वास",
    identified: "ओळखले गेले",
    unit: "घटक (Unit)",
    protocol: "अधिकृत विल्हेवाट नियम",
    awaiting: "इनपुटची प्रतीक्षा आहे",
    awaitingText: "स्वयंचलित सुरक्षा ऑडिटिंगसाठी दस्तऐवज किंवा प्रतिमा अपलोड करून घातक कचरा वर्गीकरण सुरू करा।",
    historyItems: "वस्तू",
    toggleTheme: "थीम बदला"
  }
};

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confThreshold, setConfThreshold] = useState(0.55);
  const [history, setHistory] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [lang, setLang] = useState('en');
  
  const fileInputRef = useRef(null);

  // Theme Sync
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('conf', confThreshold);
    formData.append('lang', lang);

    try {
      const response = await axios.post('/api/detect', formData);
      setResult(response.data);
      
      const detCount = response.data.detections ? response.data.detections.length : 0;
      const newHistoryItem = {
        id: Date.now(),
        name: selectedFile.name,
        time: new Date().toLocaleTimeString(),
        detections: detCount
      };
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
    } catch (error) {
      console.error("Detection error:", error);
      alert("System Connection Error: Model or Server unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 max-w-7xl mx-auto transition-colors duration-300 dark:bg-brandDark bg-slate-50`}>
      {/* Header */}
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="cursor-default">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-indigo-500 bg-clip-text text-transparent mb-2">
            {I18N[lang].title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight truncate">{I18N[lang].subtitle}</p>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          {/* Language Selector */}
          <div className="flex glass p-1 rounded-xl">
            {['en', 'hi', 'mr'].map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${lang === l ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-400'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-3 rounded-xl glass hover:scale-105 active:scale-95 transition-all text-slate-600 dark:text-slate-300"
            title={I18N[lang].toggleTheme}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="hidden lg:flex gap-4 cursor-default">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">{I18N[lang].safetyStatus}</p>
              <p className="text-sm font-bold text-rose-500 dark:text-rose-400">{I18N[lang].liveAudit}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl glass flex items-center justify-center border-rose-500/20">
              <ShieldAlert size={22} className="text-rose-500" />
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload & Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card">
            <h2 className="flex items-center gap-2 text-lg font-bold mb-6 cursor-default">
              <Upload size={18} className="text-indigo-400" />
              {I18N[lang].sourceInput}
            </h2>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl transition-all duration-500 cursor-pointer h-72 flex flex-col items-center justify-center gap-4 group
                ${selectedFile ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
            >
              {previewUrl ? (
                <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-50 dark:opacity-40 grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500" alt="Preview" />
              ) : null}
              
              <div className="z-10 text-center px-4">
                <div className="mx-auto w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                  <Upload className="text-indigo-500" />
                </div>
                <p className="font-bold text-slate-700 dark:text-slate-200">{I18N[lang].selectWaste}</p>
                <p className="text-sm text-slate-500">{I18N[lang].formats}</p>
              </div>
              
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                onChange={handleFileChange}
                accept="image/*"
              />
            </div>

            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-black uppercase tracking-widest text-slate-500">{I18N[lang].sensitivity}</label>
                <span className="text-sm font-black text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full">{Math.round(confThreshold * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="0.95" 
                step="0.05" 
                value={confThreshold} 
                onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={!selectedFile || loading}
              className={`w-full mt-8 py-5 rounded-2xl font-black uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-3 active:scale-95
                ${loading ? 'bg-slate-200 dark:bg-slate-800 cursor-wait text-slate-400' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-500/30'}`}
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Zap size={20} fill="currentColor" />
                  {I18N[lang].analyze}
                </>
              )}
            </button>
          </div>

          {/* Detections Legend */}
          <div className="glass-card">
            <h2 className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase mb-8 tracking-[0.3em] cursor-default">{I18N[lang].specs}</h2>
            <div className="space-y-6">
              {Object.entries(CATEGORIES).map(([name, data]) => {
                // If lang is not en, we should translate the category names in the legend too
                // For simplicity, we search for the key or keep it English if not found
                // Mapping index would be better but CATEGORIES uses names as keys
                // Let's use the lang_info from backend as a proxy or just hardcode the mapping
                const translatedName = {
                  en: name,
                  hi: name === "Disposable Waste" ? "डिस्पोजेबल कचरा" : name === "Pathological/Medicinal Waste" ? "औषधीय कचरा" : name === "Sharps/Glass" ? "नुकीला कचरा" : "रेडियोधर्मी कचरा",
                  mr: name === "Disposable Waste" ? "डिस्पोजेबल कचरा" : name === "Pathological/Medicinal Waste" ? "औषधी कचरा" : name === "Sharps/Glass" ? "अणकुचीदार कचरा" : "किरणोत्सर्गी कचरा"
                }[lang];

                return (
                  <div key={name} className="flex items-center gap-4 group cursor-default">
                    <div className="w-4 h-4 rounded-lg transition-transform group-hover:scale-125" style={{ backgroundColor: data.color, boxShadow: `0 4px 12px ${data.color}33` }}></div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{translatedName}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* History Snippet */}
          <div className="glass-card">
            <h2 className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 cursor-default">
              <History size={14} />
              {I18N[lang].sessionLog}
            </h2>
            <div className="space-y-4">
              {history.length > 0 ? history.map(item => (
                <div key={item.id} className="flex items-center justify-between text-[11px] p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all cursor-default font-bold">
                    <div className="truncate max-w-[140px] text-slate-500">{item.name}</div>
                    <div className="text-indigo-500 font-black">{item.detections} {I18N[lang].historyItems}</div>
                </div>
              )) : (
                <p className="text-xs text-slate-400 text-center italic py-4">{I18N[lang].logEmpty}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8 space-y-8">
          {result?.error ? (
            <div className="glass-card border-l-4 border-rose-500 bg-rose-500/5 flex items-center gap-6 animate-pulse">
              <ShieldAlert size={32} className="text-rose-500" />
              <div>
                <p className="font-black uppercase tracking-widest text-rose-500 text-sm">{I18N[lang].systemAlert}</p>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{result.error}</p>
              </div>
            </div>
          ) : result?.image ? (
            <>
              {/* Detection Result Image */}
              <div className="glass-card !p-3 relative overflow-hidden group border-2 border-indigo-500/10">
                <img 
                  src={result.image} 
                  className="w-full rounded-xl transition-transform duration-1000 group-hover:scale-[1.02]" 
                  alt="Detection Results" 
                />
                <div className="absolute top-8 right-8 px-6 py-3 bg-slate-900/80 backdrop-blur-xl rounded-2xl flex items-center gap-3 border border-white/10 shadow-2xl">
                  <PieChartIcon size={18} className="text-emerald-400" />
                  <span className="text-sm font-black text-white">{(result.detections?.length || 0)} {I18N[lang].wasteUnits}</span>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(result.summary || {}).map(([category, info]) => {
                  const CatIcon = CATEGORIES[category]?.icon || Info;
                  return (
                    <div key={category} className={`glass-card border-l-8`} style={{ borderLeftColor: info.hex }}>
                      <div className="flex justify-between items-start mb-6">
                        <div className={`p-3 rounded-2xl bg-slate-100 dark:bg-white/5`}>
                          <CatIcon size={28} style={{ color: info.hex }} />
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{I18N[lang].confidence}</span>
                          <p className="text-2xl font-black mt-1" style={{ color: info.hex }}>{Math.round(info.avg_confidence * 100)}%</p>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-black mb-2 tracking-tight">{category}</h3>
                      <div className="flex items-center gap-3 mb-6">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-slate-100 dark:bg-white/10 text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-white/5">
                           {I18N[lang].identified}: {info.count} {I18N[lang].unit}
                        </span>
                        <span className="text-sm font-black italic" style={{ color: info.hex }}>
                           {info.risk}
                        </span>
                      </div>

                      <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase mb-4 flex items-center gap-2 tracking-[0.2em] cursor-default">
                          <CheckCircle2 size={12} className="text-emerald-500" />
                          {I18N[lang].protocol}
                        </h4>
                        <ul className="space-y-3">
                          {info.instructions.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed group cursor-default">
                              <ChevronRight size={14} className="text-indigo-400 mt-1 shrink-0 transition-transform group-hover:translate-x-1" />
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center glass-card border-dashed border-2 border-slate-200 dark:border-slate-800">
              <div className="text-center group cursor-default">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-200 dark:border-slate-800 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-inner">
                  <PieChartIcon size={48} className="text-slate-300 dark:text-slate-700" />
                </div>
                <h2 className="text-3xl font-black text-slate-400 dark:text-slate-600 mb-4 tracking-tighter">{I18N[lang].awaiting}</h2>
                <p className="text-slate-500 dark:text-slate-700 max-w-sm mx-auto font-medium leading-relaxed">
                   {I18N[lang].awaitingText}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <footer className="mt-20 pt-10 border-t border-slate-200 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-400 dark:text-slate-600 font-bold text-xs uppercase tracking-[0.2em] cursor-default">
        <p className="hover:text-slate-500 transition-colors">© 2026 Bio Medical Waste. Integrated Safety Labs.</p>
        <div className="flex gap-10">
          <span className="hover:text-indigo-500 transition-colors">Privacy</span>
          <span className="hover:text-indigo-500 transition-colors">Compliance</span>
          <span className="hover:text-indigo-500 transition-colors">Documentation</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
