/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Car, 
  Plus, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Grid, 
  List, 
  ChevronLeft, 
  ChevronRight, 
  Wrench, 
  FileText 
} from 'lucide-react';
import { Intervention, Client, InterventionType, InterventionStatus, AppSettings } from '../types';

interface CalendarManagerProps {
  interventions: Intervention[];
  clients: Client[];
  onAddIntervention: (intervention: Omit<Intervention, 'id'>) => void;
  onUpdateInterventionStatus: (id: string, status: InterventionStatus) => void;
  setSelectedInterventionForInvoice: (intervention: Intervention) => void;
  setActiveTab: (tab: string) => void;
  settings?: AppSettings;
}

export default function CalendarManager({
  interventions,
  clients,
  onAddIntervention,
  onUpdateInterventionStatus,
  setSelectedInterventionForInvoice,
  setActiveTab,
  settings
}: CalendarManagerProps) {
  const currency = settings?.currency || 'DH';
  
  // State
  const [viewMode, setViewMode] = useState<'List' | 'Calendar'>('Calendar');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2026-06-06'); // Focus date

  // Add form fields
  const [selectedClientId, setSelectedClientId] = useState('');
  const [intDate, setIntDate] = useState('2026-06-06');
  const [intTime, setIntTime] = useState('09:00');
  const [intType, setIntType] = useState<InterventionType>('Entretien');
  const [description, setDescription] = useState('');
  const [priceEstimated, setPriceEstimated] = useState(85);
  const [address, setAddress] = useState('');

  // Handle client selection to pre-fill elements
  const handleClientSelected = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setAddress(client.address);
      
      // Attempt to intelligently adjust estimated price based on common category
      if (intType === 'Diagnostic') setPriceEstimated(65);
      else if (intType === 'Freinage') setPriceEstimated(120);
      else if (intType === 'Pneumatique') setPriceEstimated(220);
      else setPriceEstimated(85);
    }
  };

  // Submit new intervention
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;

    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return;

    onAddIntervention({
      clientId: client.id,
      clientName: client.name,
      vehicle: client.vehicle,
      date: intDate,
      time: intTime,
      type: intType,
      description: description,
      status: 'Scheduled',
      priceEstimated: priceEstimated,
      address: address || client.address
    });

    // Reset
    setSelectedClientId('');
    setDescription('');
    setAddress('');
    setShowAddModal(false);
  };

  // Days of current demonstration week (Mon 01 June to Sun 07 June 2026)
  const weekDays = [
    { label: 'Lun', num: '01', dateStr: '2026-06-01' },
    { label: 'Mar', num: '02', dateStr: '2026-06-02' },
    { label: 'Mer', num: '03', dateStr: '2026-06-03' },
    { label: 'Jeu', num: '04', dateStr: '2026-06-04' },
    { label: 'Ven', num: '05', dateStr: '2026-06-05' },
    { label: 'Sam', num: '06', dateStr: '2026-06-06' }, // Today focus
    { label: 'Dim', num: '07', dateStr: '2026-06-07' }
  ];

  // Get list for selected focused date
  const selectedDateInterventions = interventions.filter(inter => inter.date === selectedDate);

  // Category Colors
  const typeStyles: Record<InterventionType, string> = {
    'Entretien': 'bg-teal-100 text-teal-800 border-teal-200',
    'Freinage': 'bg-amber-100 text-amber-800 border-amber-200',
    'Panne': 'bg-red-100 text-red-800 border-red-200',
    'Diagnostic': 'bg-blue-105 text-blue-900 border-blue-200 bg-blue-100',
    'Pneumatique': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Autre': 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <div className="space-y-6">
      
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-display font-black tracking-tight text-slate-800">Planning & Calendrier Itinérant</h1>
          <p className="text-xs text-slate-500 font-medium">Planifiez vos déplacements de dépannage et contrôlez vos activités facilement.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View Toggles */}
          <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-250 gap-0.5">
            <button
              onClick={() => setViewMode('Calendar')}
              className={`p-1.5 px-3 rounded-md text-xxs font-bold flex items-center gap-1 cursor-pointer transition ${
                viewMode === 'Calendar' ? 'bg-white text-gray-950 shadow-xs' : 'text-gray-500'
              }`}
            >
              <Grid size={12} /> Calendrier
            </button>
            <button
              onClick={() => setViewMode('List')}
              className={`p-1.5 px-3 rounded-md text-xxs font-bold flex items-center gap-1 cursor-pointer transition ${
                viewMode === 'List' ? 'bg-white text-gray-950 shadow-xs' : 'text-gray-500'
              }`}
            >
              <List size={12} /> Tout Lister
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedClientId('');
              setIntDate(selectedDate);
              setDescription('');
              setShowAddModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus size={14} /> Planifier Intervention
          </button>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Week/Calendar visual slots */}
        <div className="lg:col-span-8 space-y-6">
          
          {viewMode === 'Calendar' ? (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              
              {/* Month bar controller */}
              <div className="flex justify-between items-center bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                <span className="font-extrabold text-sm text-gray-955 flex items-center gap-1">
                  📅 Juin 2026 (Semaine Actuelle)
                </span>
                <div className="flex items-center gap-1.5 text-xxs text-gray-500">
                  <span className="w-2.5 h-2.5 bg-blue-650 rounded-full bg-blue-600 block"></span> Aujourd'hui : 6 Juin
                </div>
              </div>

              {/* Day column headers Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold border-b border-gray-50 pb-2">
                {weekDays.map(day => {
                  const isFocused = selectedDate === day.dateStr;
                  const isToday = day.dateStr === '2026-06-06';
                  const hasInterventionsCount = interventions.filter(i => i.date === day.dateStr).length;

                  return (
                    <button
                      key={day.dateStr}
                      onClick={() => setSelectedDate(day.dateStr)}
                      className={`p-1.5 sm:p-3 rounded-lg sm:rounded-2xl cursor-pointer transition duration-150 relative flex flex-col items-center gap-0.5 sm:gap-1 hover:bg-gray-50 ${
                        isFocused 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 font-black shadow-xs' 
                          : 'bg-slate-50 border border-gray-100'
                      }`}
                    >
                      <span className={`text-xxs font-medium ${isFocused ? 'text-blue-100' : 'text-gray-450 text-gray-400'}`}>
                        {day.label}
                      </span>
                      <span className="text-sm font-extrabold leading-none">{day.num}</span>
                      
                      {/* Interventions indicator dot counters */}
                      {hasInterventionsCount > 0 && (
                        <span className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${
                          isFocused ? 'bg-white' : 'bg-blue-500'
                        }`} />
                      )}

                      {/* Today indicator label */}
                      {isToday && !isFocused && (
                        <span className="absolute -top-1 px-1 bg-red-500 text-white rounded text-[8px] uppercase tracking-wide">
                          Auj
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Detailed Agenda Slots matching focused date */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest">
                    Agenda du : <span className="text-gray-900 font-extrabold">{selectedDate}</span>
                  </h3>
                  <span className="text-xxs text-gray-500 font-medium">
                    {selectedDateInterventions.length} intervention(s) planifiée(s)
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedDateInterventions.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs">
                      Aucune intervention programmée pour cette journée.
                    </div>
                  ) : (
                    selectedDateInterventions.map((inter) => (
                      <div 
                        key={inter.id} 
                        className="p-4 rounded-xl border border-gray-150 hover:border-gray-300 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/20"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-1.8">
                            <span className="px-2 py-0.5 font-mono text-xs font-bold bg-gray-950 text-white rounded tracking-wide">
                              {inter.time}
                            </span>
                            <span className={`px-2 py-0.5 rounded border text-scale scale-90 font-bold ${typeStyles[inter.type]}`}>
                              {inter.type}
                            </span>
                            {inter.status === 'Completed' ? (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-scale scale-90 font-bold rounded">✓ Clôturée</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-scale scale-90 font-bold rounded">● Auto-Planifiée</span>
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <h4 className="font-black text-sm text-gray-950">{inter.clientName}</h4>
                            <p className="text-xxs text-gray-500 flex items-center gap-1.5 italic font-sans font-medium">
                              🚘 {inter.vehicle} — Prix estimé : <span className="font-bold text-gray-800">{inter.priceEstimated} {currency}</span>
                            </p>
                          </div>

                          <div className="text-xxs text-gray-600 bg-white border border-gray-105 p-2 rounded-lg flex items-center gap-1.5 max-w-lg shadow-xxs">
                            <MapPin size={12} className="text-blue-500 shrink-0" />
                            <span className="line-clamp-1">{inter.address}</span>
                          </div>
                        </div>

                        {/* Interactive Status controllers inside appointment card */}
                        <div className="flex md:flex-col shrink-0 gap-2 items-end justify-between w-full md:w-auto border-t md:border-t-0 border-gray-150 pt-2 md:pt-0">
                          {inter.status === 'Scheduled' ? (
                            <div className="flex gap-1.5 w-full justify-end">
                              <button
                                onClick={() => onUpdateInterventionStatus(inter.id, 'Completed')}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xxs rounded-lg shadow-xs cursor-pointer transition flex items-center gap-1"
                              >
                                Clôturer Travaux
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedInterventionForInvoice(inter);
                                setActiveTab('factures');
                              }}
                              className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 font-extrabold text-xxs border border-blue-200 rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <FileText size={12} /> Facture Rapide
                            </button>
                          )}
                        </div>

                      </div>
                    ))
                  )}
                </div>

              </div>

            </div>
          ) : (
            // Full historical log view
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-gray-900 border-b border-gray-50 pb-2">Toutes les interventions programmées</h3>
              <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                {interventions.map((inter) => (
                  <div key={inter.id} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 relative text-xs flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-gray-200 text-gray-800 px-1.5 py-0.2 rounded font-extrabold text-xxs">{inter.date} @ {inter.time}</span>
                        <span className="text-xxs font-bold text-indigo-700 uppercase">{inter.type}</span>
                      </div>
                      <h4 className="font-bold text-gray-900">{inter.clientName}</h4>
                      <p className="text-xxs text-gray-500 truncate max-w-sm">"{inter.description}"</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-gray-900 block">{inter.priceEstimated} {currency}</span>
                      {inter.status === 'Completed' ? (
                        <span className="text-[10px] text-green-700 font-semibold bg-green-50 px-1.5 py-0.5 rounded-md">Réalisée</span>
                      ) : (
                        <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded-md">Planifiée</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Map instructions help panel */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="border-b border-gray-50 pb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
              <Wrench size={16} className="text-gray-500" />
              Rond-Point Technique
            </h2>
            <p className="text-xxs text-gray-500 mt-0.5">Indicateurs clés de votre activité mobile.</p>
          </div>

          <div className="space-y-4 text-xs leading-relaxed text-gray-600">
            <p>
              Pour votre activité d'**Atelier Mobile Mécanique**, l'organisation routière est fondamentale.
            </p>
            
            <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-105 text-xxs space-y-2">
              <div className="font-bold text-blue-900">⚡ CONCEIL PRATIQUE DU FOURGON :</div>
              <ul className="list-disc pl-4 space-y-1 text-gray-700 list-inside">
                <li>Prenez toujours 10 min le matin pour valider le chargement des pièces correspondantes aux rdv du jour.</li>
                <li>Faites signer le client avant travaux puis déclenchez la **facturation rapide sur place** depuis votre tablette.</li>
                <li>Le stock de pièces sera déduit en direct, évitant les erreurs de commande.</li>
              </ul>
            </div>

            <p className="text-xxs text-gray-400">
              Astuce : Cliquez sur n'importe quelle intervention pour voir sa description technique complète, puis cliquez sur "Clôturer Travaux" pour la fermer.
            </p>
          </div>
        </div>

      </div>

      {/* MODAL: ADD INTERVENTION PLANNER FORM */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 border border-gray-100 shadow-2xl relative space-y-4 text-left">
            <button onClick={() => setShowAddModal(false)} className="absolute right-4 top-4 text-gray-400"><X size={18} /></button>
            <h3 className="font-extrabold text-gray-950 text-base">Planifier une nouvelle intervention routière</h3>
            
            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Select Client dropdown */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Client Relatif *</label>
                  <select
                    required
                    value={selectedClientId}
                    onChange={(e) => handleClientSelected(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none font-medium text-gray-800"
                  >
                    <option value="">-- Sélectionner --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.vehicle ? `(${c.vehicle.split(' - ')[0]})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Type drop */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Type de service *</label>
                  <select
                    value={intType}
                    onChange={(e) => setIntType(e.target.value as InterventionType)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none"
                  >
                    <option value="Entretien">Entretien / Révision</option>
                    <option value="Freinage">Freinage</option>
                    <option value="Panne">Panne / Remorquage</option>
                    <option value="Diagnostic">Diagnostic électronique</option>
                    <option value="Pneumatique">Pneumatique</option>
                    <option value="Autre">Autre prestation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Date */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Date d'intervention</label>
                  <input
                    type="date"
                    required
                    value={intDate}
                    onChange={(e) => setIntDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none font-medium"
                  />
                </div>

                {/* Time */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Heure d'arrivée</label>
                  <input
                    type="time"
                    required
                    value={intTime}
                    onChange={(e) => setIntTime(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none font-medium"
                  />
                </div>

                {/* Price estimated */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Tarif estimé ({currency} HT)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={priceEstimated}
                    onChange={(e) => setPriceEstimated(parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Geographical address override input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Adresse d'intervention sur site (si différente de l'adresse par défaut)</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Laisser vide pour utiliser l'adresse enregistrée sur la fiche du client"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Descriptive details */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Notes techniques d'intervention</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex : Changer plaquettes de freins avant + disques éventuels..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 outline-none font-sans"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-xs"
                >
                  Confirmer & Enregistrer RDV
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
