import React, { useState } from 'react';
import { Lock, User, Key, AlertCircle, Wrench, Sparkles } from 'lucide-react';
import { AppUser } from '../types';

interface LoginProps {
  users: AppUser[];
  onLoginSuccess: (user: AppUser) => void;
  companyName: string;
  companyTagline: string;
  companyLogo?: string;
}

export default function Login({ 
  users, 
  onLoginSuccess, 
  companyName, 
  companyTagline, 
  companyLogo 
}: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const lowercaseUser = username.trim().toLowerCase();
    const matchedUser = users.find(u => u.username.toLowerCase() === lowercaseUser);

    if (!matchedUser) {
      setError("Le nom d'utilisateur n'existe pas.");
      return;
    }

    if (matchedUser.password !== password) {
      setError("Le mot de passe saisi est incorrect.");
      return;
    }

    // Success!
    onLoginSuccess(matchedUser);
  };

  const handleQuickLogin = (role: 'admin' | 'coadmin' | 'staff') => {
    const target = users.find(u => u.role === role);
    if (target) {
      setUsername(target.username);
      setPassword(target.password || '');
      onLoginSuccess(target);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 antialiased selection:bg-blue-105 selection:text-blue-900">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
        {/* Header Branding section */}
        <div className="bg-slate-900 px-8 py-8 text-white relative overflow-hidden text-center">
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl -ml-6 -mb-6"></div>

          <div className="relative flex flex-col items-center">
            {companyLogo ? (
              <img 
                src={companyLogo} 
                alt="Logo Société" 
                className="max-h-16 max-w-[200px] object-contain rounded-lg bg-white p-1.5 shadow-sm mb-3.5"
              />
            ) : (
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-3.5 text-blue-400">
                <Wrench className="w-6 h-6" />
              </div>
            )}
            
            <h1 className="text-xl font-display font-black tracking-tight">{companyName}</h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">{companyTagline}</p>
          </div>
        </div>

        {/* Login Form body */}
        <div className="p-8 space-y-6">
          <div className="space-y-1.5 text-center">
            <h2 className="text-lg font-extrabold text-slate-800">Espace Connexion</h2>
            <p className="text-xs text-slate-500">Saisissez vos identifiants pour accéder à l'atelier mobile</p>
          </div>

          {error && (
            <div id="login-error-alert" className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-650 p-3 rounded-2xl text-xs font-bold animate-pulse">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold text-slate-700" htmlFor="login-username">Nom d'utilisateur</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={15} />
                </div>
                <input
                  id="login-username"
                  type="text"
                  required
                  placeholder="Ex: admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition shadow-xxs"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold text-slate-700" htmlFor="login-password">Mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={15} />
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition shadow-xxs"
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold py-3 px-4 rounded-2xl text-xs transition duration-150 shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Key size={14} /> Se connecter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
