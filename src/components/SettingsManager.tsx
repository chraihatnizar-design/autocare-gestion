/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  User, 
  Save, 
  RotateCcw, 
  Check, 
  Coins, 
  Info, 
  Eye, 
  MapPin, 
  Phone, 
  Mail, 
  Percent,
  Upload,
  Trash2,
  Image,
  Lock,
  UserPlus,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { AppSettings, AppUser } from '../types';

interface SettingsManagerProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetSettings: () => void;
  currentUser: AppUser | null;
  users: AppUser[];
  onAddUser: (user: Omit<AppUser, 'id'>) => { success: boolean; error?: string };
  onDeleteUser: (id: string) => void;
  onLogout: () => void;
}

export default function SettingsManager({ 
  settings, 
  onUpdateSettings, 
  onResetSettings,
  currentUser,
  users,
  onAddUser,
  onDeleteUser,
  onLogout
}: SettingsManagerProps) {
  // Local state for forms
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  // User Administration form states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'coadmin' | 'staff'>('staff');
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);
    setUserSuccess(null);

    const cleanUsername = newUsername.trim().toLowerCase();
    const cleanFullName = newFullName.trim();

    if (!cleanUsername || !newPassword || !cleanFullName) {
      setUserError("Veuillez remplir tous les champs requis.");
      return;
    }

    if (cleanUsername.length < 3) {
      setUserError("Le nom d'utilisateur doit contenir au moins 3 caractères.");
      return;
    }

    const result = onAddUser({
      username: cleanUsername,
      password: newPassword,
      fullName: cleanFullName,
      role: newUserRole
    });

    if (result.success) {
      setUserSuccess(`L'utilisateur "${cleanUsername}" a été créé avec succès !`);
      setNewUsername('');
      setNewPassword('');
      setNewFullName('');
      setNewUserRole('staff');
      setTimeout(() => setUserSuccess(null), 4000);
    } else {
      setUserError(result.error || "Une erreur est survenue lors de la création.");
    }
  };

  const handleLogoLoad = (file: File) => {
    setLogoError(null);
    if (!file.type.startsWith('image/')) {
      setLogoError("Le fichier sélectionné n'est pas une image.");
      return;
    }
    // Limit to 800 KB to avoid local storage overflow
    if (file.size > 800 * 1024) {
      setLogoError("L'image est trop lourde. Veuillez choisir une image de moins de 800 Ko.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setFormData(prev => ({
          ...prev,
          companyLogo: result
        }));
      }
    };
    reader.onerror = () => {
      setLogoError("Erreur lors de la lecture du fichier.");
    };
    reader.readAsDataURL(file);
  };

  // Sync state if prop changes
  React.useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'defaultTaxRate' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    // if (window.confirm("Êtes-vous sûr de vouloir réinitialiser les paramètres aux valeurs d'origine ?")) {
      onResetSettings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    // }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-display font-black tracking-tight text-slate-800 flex items-center gap-2">
            <span className="p-2 bg-slate-100 rounded-xl text-slate-800 inline-block">
              <Settings size={20} className="animate-spin-slow" />
            </span>
            Configuration Générale
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Modifiez l'identité de l'entreprise, le mécanicien connecté et les variables de facturation.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleReset}
            type="button"
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} /> Réinitialiser par Défaut
          </button>
          
          <button
            onClick={onLogout}
            type="button"
            className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-red-650 hover:bg-red-700 bg-red-600 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <LogOut size={14} /> Se Déconnecter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form panel column (7 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-6">
          
          {/* Card Section 1: Connected User / Meccanic */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <User size={16} />
              </span>
              <h2 className="text-sm font-bold text-slate-800">Profil de l'Utilisateur Connecté</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Nom et Prénom</label>
                <input
                  type="text"
                  name="userName"
                  value={formData.userName}
                  onChange={handleChange}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 bg-slate-50 focus:bg-white transition"
                  placeholder="Ex: Julien Durand"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Rôle / Métier</label>
                <input
                  type="text"
                  name="userRole"
                  value={formData.userRole}
                  onChange={handleChange}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 bg-slate-50 focus:bg-white transition"
                  placeholder="Ex: Mécanicien Itinérant"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700">Téléphone Direct</label>
                <input
                  type="text"
                  name="userPhone"
                  value={formData.userPhone}
                  onChange={handleChange}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 bg-slate-50 focus:bg-white transition"
                  placeholder="Ex: +212 6 99 88 77 66"
                />
              </div>
            </div>
          </div>

          {/* Card Section 2: Company settings */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Building2 size={16} />
              </span>
              <h2 className="text-sm font-bold text-slate-800">Identité & Infos Légales de la Société</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Nom de la Société</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 bg-slate-50 focus:bg-white transition"
                  placeholder="Ex: AUTOCARE gestion"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Slogan / Sous-titre</label>
                <input
                  type="text"
                  name="companyTagline"
                  value={formData.companyTagline}
                  onChange={handleChange}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 bg-slate-50 focus:bg-white transition"
                  placeholder="Ex: Service d'Atelier Mobile"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Adresse Administrative</label>
                <input
                  type="text"
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleChange}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 bg-slate-50 focus:bg-white transition"
                  placeholder="Ex: Boulevard d'Anfa, Résidence Al Yassamine"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Ville administrative</label>
                <input
                  type="text"
                  name="companyCity"
                  value={formData.companyCity}
                  onChange={handleChange}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 bg-slate-50 focus:bg-white transition"
                  placeholder="Ex: Casablanca"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Capital Social</label>
                <input
                  type="text"
                  name="companyCapital"
                  value={formData.companyCapital}
                  onChange={handleChange}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 bg-slate-50 focus:bg-white transition"
                  placeholder="Ex: 50 000 DH"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">ICE (Identifiant Commun de l'Entreprise) / Registre</label>
                <input
                  type="text"
                  name="companyIce"
                  value={formData.companyIce}
                  onChange={handleChange}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 bg-slate-50 focus:bg-white transition"
                  placeholder="Ex: 001548239000182"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Email de Contact Pro</label>
                <input
                  type="email"
                  name="companyEmail"
                  value={formData.companyEmail}
                  onChange={handleChange}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 bg-slate-50 focus:bg-white transition"
                  placeholder="Ex: contact@autocare.ma"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Téléphone Fixe / Bureau / Support</label>
                <input
                  type="text"
                  name="companyPhone"
                  value={formData.companyPhone}
                  onChange={handleChange}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 bg-slate-50 focus:bg-white transition"
                  placeholder="Ex: +212 5 22 11 22 33"
                />
              </div>
            </div>
          </div>

          {/* Card Section 2b: Logo de l'Entreprise */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <Image size={16} />
              </span>
              <h2 className="text-sm font-bold text-slate-800">Logo de la Société</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-normal">
              {/* Actual Logo Preview and Actions */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center min-h-[140px] group relative">
                {formData.companyLogo ? (
                  <div className="space-y-3 w-full flex flex-col items-center justify-center">
                    <img 
                      src={formData.companyLogo} 
                      alt="Logo Aperçu" 
                      className="max-h-24 max-w-full object-contain rounded-lg shadow-xs bg-white p-2"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, companyLogo: '' }))}
                      className="text-xxs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 bg-white hover:bg-rose-50 px-2 py-1.5 rounded-lg border border-slate-205 shadow-xxs transition cursor-pointer"
                    >
                      <Trash2 size={12} /> Supprimer le logo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-slate-400">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                      <Image size={24} />
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold block">Aucun logo défini</span>
                  </div>
                )}
              </div>

              {/* Upload Zone & Guide */}
              <div className="md:col-span-8 flex flex-col justify-between space-y-3">
                <div 
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      handleLogoLoad(file);
                    }
                  }}
                  className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-50 transition relative group flex-1 flex flex-col items-center justify-center min-h-[110px]"
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoLoad(file);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="logo-upload"
                  />
                  <div className="space-y-1.5">
                    <Upload size={20} className="text-slate-400 mx-auto group-hover:scale-110 transition duration-150" />
                    <p className="text-xs font-bold text-slate-700">Glissez-déposez le logo ici ou cliquez pour choisir</p>
                    <p className="text-[10px] text-slate-400">Formats : PNG, JPG, WEBP ou SVG (Max. 800 Ko)</p>
                  </div>
                </div>

                {logoError && (
                  <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1.5 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl">
                    ⚠️ {logoError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Card Section 3: Currencies & Taxes */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <Coins size={16} />
              </span>
              <h2 className="text-sm font-bold text-slate-800">Devises, Taxes & Paramètres Financiers</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Symbole de Devise</label>
                <input
                  type="text"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 bg-slate-50 focus:bg-white transition font-mono font-bold"
                  placeholder="Ex: DH, €, $"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Taux de TVA par Défaut (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    name="defaultTaxRate"
                    value={formData.defaultTaxRate}
                    onChange={handleChange}
                    required
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-0 bg-slate-50 focus:bg-white transition pr-8"
                    placeholder="Ex: 20"
                  />
                  <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold"><Percent size={14} /></span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons bar */}
          <div className="flex items-center justify-between">
            {saveSuccess ? (
              <p className="text-xs text-green-600 font-bold bg-green-50 px-3.5 py-2 rounded-xl border border-green-100 animate-fade-in flex items-center gap-1.5">
                <Check size={14} className="text-green-500" /> Paramètres enregistrés avec succès !
              </p>
            ) : (
              <span />
            )}

            <button
              type="submit"
              className="px-6 py-3 text-xs font-extrabold rounded-xl bg-slate-900 text-white hover:bg-slate-850 shadow-md transition-all flex items-center gap-2 cursor-pointer self-end shrink-0 ml-auto"
            >
              <Save size={14} /> Enregistrer
            </button>
          </div>

        </form>

        {/* SECTION: Gestion des Comptes & Sessions de l'Atelier */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 justify-between">
              <div className="flex items-center gap-2 text-left">
                <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg inline-block">
                  <Lock size={16} />
                </span>
                <h2 className="text-sm font-bold text-slate-800 inline-block align-middle">Gestion des Comptes d'Accès (Sessions)</h2>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                currentUser?.role === 'admin' 
                  ? 'bg-blue-105 text-blue-800 border border-blue-200' 
                  : 'bg-slate-150 text-slate-650'
              }`}>
                {currentUser?.role === 'admin' ? "Mode Admin Master" : "Collaborateur Restreint"}
              </span>
            </div>

            {currentUser?.role === 'admin' ? (
              <div className="space-y-6">
                <p className="text-xs text-slate-500 font-medium leading-relaxed text-left">
                  En tant qu'<strong>Admin Master</strong>, vous êtes le seul autorisé à créer des identifiants et des mots de passe sécurisés pour les autres mécaniciens ou collaborateurs utilisant cette application.
                </p>

                {/* Form to create user */}
                <form onSubmit={handleCreateUser} className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3.5 text-left">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <UserPlus size={14} className="text-slate-600" /> Créer un nouvel identifiant d'accès
                  </h3>

                  {userError && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-100 text-[11px] text-red-650 font-bold flex items-center gap-1.5">
                      ⚠️ {userError}
                    </div>
                  )}

                  {userSuccess && (
                    <div className="p-2.5 rounded-xl bg-green-50 border border-green-100 text-[11px] text-green-700 font-bold flex items-center gap-1.5 animate-pulse">
                      ✓ {userSuccess}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-extrabold text-slate-655 text-slate-705">Nom d'utilisateur (Login)</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: nicolas"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-220 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900/10 focus:border-slate-800 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-extrabold text-slate-705">Mot de passe</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: meca456"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-220 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900/10 focus:border-slate-800 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-extrabold text-slate-705">Nom Complet du Collaborateur</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Nicolas Martin"
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-220 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900/10 focus:border-slate-800 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-extrabold text-slate-705">Rôle de Session</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'coadmin' | 'staff')}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-220 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900/10 focus:border-slate-800 transition text-slate-800 font-medium"
                      >
                        <option value="staff">Collaborateur / Mécanicien standard</option>
                        <option value="coadmin">Co-Administrateur de l'Atelier (Limite : 2)</option>
                        <option value="admin">Admin Master (Accès complet d'origine)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs cursor-pointer transition shadow-xxs flex items-center gap-1.5"
                    >
                      <UserPlus size={13} /> Enregistrer le Compte
                    </button>
                  </div>
                </form>

                {/* Users List table */}
                <div className="space-y-2.5 text-left">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Liste des Comptes Enregistrés
                  </h3>

                  <div className="overflow-x-auto border border-slate-150 rounded-2xl bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-150 text-slate-450 font-extrabold text-[10px] uppercase">
                          <th className="p-3">Utilisateur</th>
                          <th className="p-3">Login</th>
                          <th className="p-3">Mot de passe</th>
                          <th className="p-3">Rôle / Accès</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-55/60 transition duration-75">
                            <td className="p-3 font-semibold text-slate-800">{user.fullName}</td>
                            <td className="p-3 text-slate-500 font-mono text-[11px]">{user.username}</td>
                            <td className="p-3 text-slate-400 font-mono text-[11px]">
                              {currentUser?.username === 'admin' ? (
                                <>
                                  {user.password ? '•'.repeat(user.password.length) : 'N/A'}{' '}
                                  <span className="text-[9px] text-slate-400 font-medium font-sans">({user.password})</span>
                                </>
                              ) : (
                                <span>••••••••</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                user.role === 'admin' 
                                  ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                  : user.role === 'coadmin'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 animate-pulse'
                                  : 'bg-slate-100 text-slate-600 border border-slate-150'
                              }`}>
                                {user.role === 'admin' ? "Admin Master" : user.role === 'coadmin' ? "Co-Admin" : "Collaborateur"}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {user.username === 'admin' ? (
                                <span className="text-[9px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded border border-slate-150 select-none">
                                  Compte d'origine
                                </span>
                              ) : user.id === currentUser?.id ? (
                                <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded border border-amber-100 select-none">
                                  Session active
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    // if (window.confirm(`Supprimer le compte de "${user.username}" ?`)) {
                                      onDeleteUser(user.id);
                                    // }
                                  }}
                                  className="text-rose-600 hover:text-rose-750 p-1.5 hover:bg-rose-50 rounded-lg transition inline-flex items-center justify-center cursor-pointer"
                                  title="Supprimer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl flex flex-col items-center text-center py-8 space-y-4">
                <div className="w-12 h-12 bg-amber-50 border border-amber-150 text-amber-600 rounded-full flex items-center justify-center">
                  <ShieldAlert size={24} />
                </div>
                
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-xs font-bold text-slate-800">Zone Réservée à l'Admin Master</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                    Votre session est configurée sous le compte collaborateur restreint de <strong>{currentUser?.fullName}</strong>.
                  </p>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Seul le compte d'origine <strong>admin</strong> dispose des droits de création, de modification ou de suppression d'autres comptes de l'atelier de réparation mobile.
                  </p>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="px-4 py-2.5 text-xs font-bold rounded-xl text-white bg-slate-900 hover:bg-slate-850 transition flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <LogOut size={13} /> Permuter de Session (Se Déconnecter)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Visual previews column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-100 rounded-3xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Eye size={12} /> Aperçu en Temps Réel
            </h3>
            
            {/* Header Brand preview Box */}
            <div className="bg-white p-4 rounded-xl border border-slate-250 shadow-xxs">
              <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">En-tête de l'application</span>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {formData.companyLogo ? (
                  <img
                    src={formData.companyLogo}
                    alt="Logo"
                    className="w-8 h-8 rounded object-contain bg-white border border-slate-250 p-0.5 shadow-xxs"
                  />
                ) : (
                  <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center text-white text-xs font-bold">
                    W
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-display font-black text-slate-800 leading-none">
                    {formData.companyName || 'AUTOCARE'}{' '}
                    <span className="text-slate-400 font-normal">gestion</span>
                  </h4>
                  <span className="text-[8px] uppercase font-bold tracking-widest text-slate-400 mt-1 block leading-none">
                    {formData.companyTagline || "Gestion d'Atelier"}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile widget Preview */}
            <div className="bg-white p-4 rounded-xl border border-slate-250 shadow-xxs">
              <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Widget utilisateur</span>
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-black text-xs">
                  {formData.userName ? formData.userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'JD'}
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-800 block line-clamp-1 leading-none">
                    {formData.userName || "Julien Durand"}
                  </span>
                  <span className="text-[9px] text-slate-400 block leading-none mt-1">
                    {formData.userRole || "Mécanicien"}
                  </span>
                </div>
              </div>
            </div>

            {/* Invoice footer text preview */}
            <div className="bg-white p-4 rounded-xl border border-slate-250 shadow-xxs space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Aperçu Pied-de-page PDF</span>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5 font-mono text-[8px] text-slate-500 leading-normal">
                <p className="font-bold text-slate-700">{formData.companyName?.toUpperCase()}</p>
                <p className="flex items-center gap-1"><MapPin size={8} /> {formData.companyAddress}, {formData.companyCity}</p>
                <p className="flex items-center gap-1"><Mail size={8} /> {formData.companyEmail}</p>
                <p className="flex items-center gap-1"><Phone size={8} /> {formData.companyPhone}</p>
                <div className="border-t border-slate-200 pt-1.5 mt-1.5 text-[7px] text-slate-400">
                  SARL au capital de {formData.companyCapital} - ICE : {formData.companyIce}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-2.5">
              <Info size={14} className="text-slate-500 mt-0.5 shrink-0" />
              <p className="text-[10px] text-slate-500 leading-snug">
                Les modifications apportées ci-dessus affectent instantanément les en-têtes visuels, les badges connectés, le calcul des taxes sur les nouvelles factures, ainsi que la génération de documents PDF d'intervention.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
