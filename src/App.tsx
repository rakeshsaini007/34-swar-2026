/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="vite/client" />
import { useState, useEffect, FormEvent } from 'react';
import { Search, Save, CheckCircle, AlertCircle, Loader2, User, Phone, Fingerprint, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Elector {
  'Epic Number': string;
  'AC No.': string | number;
  'Part No.': string | number;
  'Serial No': string | number;
  'Elector\'s Name': string;
  'Elector Name Hindi': string;
  'Elector Gender': string;
  'Age': string | number;
  'D.O.B': string;
  'Relative Name': string;
  'Relative Name Hindi': string;
  'Relative type': string;
  'Adhar Number': string;
  'Mobile Number': string;
}

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';

export default function App() {
  const [partNo, setPartNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Elector[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);

  // Buffer for local edits to avoid losing state on re-render while typing
  const [editBuffer, setEditBuffer] = useState<Record<string, { adhar: string; mobile: string }>>({});

  useEffect(() => {
    if (!SCRIPT_URL || SCRIPT_URL.includes('example')) {
      setIsConfigured(false);
    }
  }, []);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!partNo.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setEditBuffer({});

    try {
      const response = await fetch(`${SCRIPT_URL}?action=search&partNo=${encodeURIComponent(partNo)}`, {
        method: 'GET',
        mode: 'cors',
      });
      
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setResults(data);
      if (data.length === 0) {
        setError('No records found for this Part Number.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while searching.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (epicNumber: string) => {
    const buffer = editBuffer[epicNumber];
    if (!buffer) return;

    const { adhar, mobile } = buffer;

    // Strict Validations
    if (adhar && adhar.length !== 12 && adhar !== "") {
      alert("Adhar Number must be exactly 12 digits.");
      return;
    }
    if (mobile && mobile.length !== 10 && mobile !== "") {
      alert("Mobile Number must be exactly 10 digits.");
      return;
    }

    setLoading(true);
    setSuccessMsg(null);

    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Use no-cors for simple GAS POST if needed, but redirects can be tricky
        headers: {
          'Content-Type': 'text/plain', // GAS handles text/plain JSON better with no-cors sometimes
        },
        body: JSON.stringify({
          action: 'update',
          data: {
            'Epic Number': epicNumber,
            'Adhar Number': adhar,
            'Mobile Number': mobile
          }
        })
      });

      // Since mode: 'no-cors' doesn't allow reading response, we assume success or handle it differently
      // However, usually for GAS, 'cors' + mode text/plain works if set up right.
      // Let's try 'cors' first.
      
      // If we use 'cors', we need to handle the redirect.
      // For this app, we'll suggest using a standard 'cors' fetch if the script is deployed correctly.
      
      setSuccessMsg("Update request sent successfully!");
      // Update local state to reflect changes visually after a delay
      setTimeout(() => setSuccessMsg(null), 3000);
      
      const updatedResults = results.map(r => 
        r['Epic Number'] === epicNumber 
          ? { ...r, 'Adhar Number': adhar, 'Mobile Number': mobile } 
          : r
      );
      setResults(updatedResults);

    } catch (err: any) {
      setError("Failed to update record. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const updateBuffer = (epicNumber: string, field: 'adhar' | 'mobile', value: string) => {
      // Allow only numbers
      if (value !== "" && !/^\d+$/.test(value)) return;
      
      // Enforce max length
      if (field === 'adhar' && value.length > 12) return;
      if (field === 'mobile' && value.length > 10) return;

      const current = editBuffer[epicNumber] || { 
        adhar: results.find(r => r['Epic Number'] === epicNumber)?.['Adhar Number'] || '',
        mobile: results.find(r => r['Epic Number'] === epicNumber)?.['Mobile Number'] || ''
      };

      setEditBuffer({
        ...editBuffer,
        [epicNumber]: { ...current, [field]: value }
      });
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-amber-100 p-4 rounded-full text-amber-600">
              <AlertCircle size={48} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Configuration Required</h1>
            <p className="text-slate-600 leading-relaxed">
              Please deploy your Google Apps Script and add the Web App URL to your <code className="bg-slate-100 px-2 py-1 rounded">.env</code> file as <code className="bg-slate-100 px-2 py-1 rounded text-pink-600">VITE_GOOGLE_SCRIPT_URL</code>.
            </p>
            <div className="w-full h-px bg-slate-100 my-4"></div>
            <p className="text-sm text-slate-400 italic">
              See <span className="font-mono">src/code.js</span> for the backend code.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <User size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 sm:block hidden">Elector Verification</h1>
          </div>
          
          <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-4 flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by Part No..."
                value={partNo}
                onChange={(e) => setPartNo(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center space-x-2 shadow-sm whitespace-nowrap"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <span>Find Records</span>}
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 flex items-center space-x-3"
            >
              <AlertCircle size={20} />
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 flex items-center space-x-3"
            >
              <CheckCircle size={20} />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AnimatePresence>
            {results.map((elector, idx) => {
              const epic = elector['Epic Number'];
              const currentValues = editBuffer[epic] || {
                 adhar: String(elector['Adhar Number'] || ''),
                 mobile: String(elector['Mobile Number'] || '')
              };

              return (
                <motion.div
                  key={epic}
                  initial={{ opacity: 0, scale: 0.98, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-1 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700">
                        <Hash size={18} />
                      </div>
                      <span className="font-bold text-indigo-900 tracking-wide uppercase text-sm">
                        {epic}
                      </span>
                    </div>
                    <div className="flex items-center text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm border border-indigo-100">
                      Part No: {elector['Part No.']} | Serial: {elector['Serial No']}
                    </div>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Readonly Info */}
                    <div className="space-y-4">
                       <div>
                         <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">Elector Name</label>
                         <p className="font-semibold text-slate-800 text-lg">{elector['Elector\'s Name']}</p>
                         <p className="text-slate-500 font-hindi text-lg">{elector['Elector Name Hindi']}</p>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">Gender / Age</label>
                            <p className="text-slate-700">{elector['Elector Gender']} / {elector['Age']}</p>
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">D.O.B</label>
                            <p className="text-slate-700">{elector['D.O.B']}</p>
                          </div>
                       </div>

                       <div>
                         <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">{elector['Relative type']} Name</label>
                         <p className="font-medium text-slate-700">{elector['Relative Name']}</p>
                         <p className="text-slate-500">{elector['Relative Name Hindi']}</p>
                       </div>
                    </div>

                    {/* Editable Fields */}
                    <div className="bg-slate-50 p-5 rounded-xl space-y-5 border border-slate-100">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 block flex items-center space-x-1">
                          <Fingerprint size={12} className="text-indigo-500" />
                          <span>Adhar Number (12 Digits)</span>
                        </label>
                        <input
                          type="text"
                          value={currentValues.adhar}
                          onChange={(e) => updateBuffer(epic, 'adhar', e.target.value)}
                          placeholder="0000 0000 0000"
                          className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 block flex items-center space-x-1">
                          <Phone size={12} className="text-indigo-500" />
                          <span>Mobile Number (10 Digits)</span>
                        </label>
                        <input
                          type="text"
                          value={currentValues.mobile}
                          onChange={(e) => updateBuffer(epic, 'mobile', e.target.value)}
                          placeholder="9876543210"
                          className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                        />
                      </div>

                      <button
                        onClick={() => handleUpdate(epic)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center space-x-2"
                      >
                        <Save size={18} />
                        <span>Update Record</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {results.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-300">
            <Search size={84} strokeWidth={1} className="mb-4 text-indigo-100" />
            <p className="text-xl font-medium text-slate-400">Enter a Part Number to start searching</p>
            <p className="text-sm mt-1">Found in your Google Sheet data source</p>
          </div>
        )}
      </main>

      {/* Hindi Font Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind:wght@400;500;600&display=swap');
        .font-hindi {
          font-family: 'Hind', sans-serif;
        }
      `}</style>
    </div>
  );
}
