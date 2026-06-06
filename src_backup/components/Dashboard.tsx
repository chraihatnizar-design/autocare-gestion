/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  Clock, 
  CreditCard, 
  AlertTriangle, 
  Calendar, 
  Users, 
  FileText, 
  Wrench, 
  MapPin, 
  CheckCircle2, 
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { StockItem, Client, Intervention, Invoice, AppSettings } from '../types';

interface DashboardProps {
  stock: StockItem[];
  clients: Client[];
  interventions: Intervention[];
  invoices: Invoice[];
  setActiveTab: (tab: string) => void;
  setSelectedInterventionForInvoice: (intervention: Intervention) => void;
  settings?: AppSettings;
}

export default function Dashboard({
  stock,
  clients,
  interventions,
  invoices,
  setActiveTab,
  setSelectedInterventionForInvoice,
  settings
}: DashboardProps) {
  const currency = settings?.currency || 'DH';
  const companyName = settings?.companyName || 'Atelier Mécanique Mobile';

  // Calculations
  const totalPaid = invoices
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalUnpaid = invoices
    .filter(inv => inv.status === 'Unpaid')
    .reduce((sum, inv) => sum + inv.total, 0);

  const lowStockAlerts = stock.filter(item => item.quantity <= item.minThreshold);
  
  // Date formats
  const todayStr = '2026-06-06'; // Fixed local simulated context
  const todayInterventions = interventions.filter(inter => inter.date === todayStr);
  const pendingInterventionsCount = interventions.filter(inter => inter.status === 'Scheduled').length;

  return (
    <div className="space-y-6">
      {/* Workshop Branding Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-12 pointer-events-none">
          <Wrench size={180} />
        </div>
        <div className="max-w-xl space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            🚛 ATELIER MOBILE ACTIF
          </div>
          <h1 className="text-2xl sm:text-3.5xl font-extrabold tracking-tight">{companyName}</h1>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
            Suivi des dépannages sur place, facturation simplifiée, gestion des pièces détachées et calendrier des interventions routières.
          </p>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 - Paid */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-350 transition-all duration-150">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Chiffre d'Affaires</span>
            <div className="text-2xl sm:text-3xl font-display font-black text-slate-800">{totalPaid.toFixed(2)} {currency}</div>
            <div className="flex items-center gap-1 text-xs text-green-600 font-bold">
              <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
              <span>Encaissé</span>
            </div>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
            <TrendingUp size={22} />
          </div>
        </div>

        {/* Card 2 - Unpaid */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-350 transition-all duration-150">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">En attente / Relances</span>
            <div className="text-2xl sm:text-3xl font-display font-black text-slate-800">{totalUnpaid.toFixed(2)} {currency}</div>
            <div className="flex items-center gap-1 text-xs text-amber-600 font-bold">
              <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
              <span>À récupérer</span>
            </div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <CreditCard size={22} />
          </div>
        </div>

        {/* Card 3 - Schedule */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-350 transition-all duration-150">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Interventions</span>
            <div className="text-2xl sm:text-3xl font-display font-black text-slate-800">{pendingInterventionsCount} actives</div>
            <div className="flex items-center gap-1 text-xs text-blue-600 font-bold">
              <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              <span>{todayInterventions.length} aujourd'hui</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Calendar size={22} />
          </div>
        </div>

        {/* Card 4 - Stock Alerts */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-350 transition-all duration-150">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Stock Bas</span>
            <div className="text-2xl sm:text-3xl font-display font-black text-red-650 text-red-600">{lowStockAlerts.length} pièces</div>
            <div className="flex items-center gap-1 text-xs text-red-500 font-bold">
              <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              <span>Alerte réappro</span>
            </div>
          </div>
          <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Scheduled Interventions for Today */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-50 pb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Aujourd'hui sur la Route</h2>
              <p className="text-xs text-gray-500">Plan d'intervention mobile du jour : 06 Juin 2026</p>
            </div>
            <button 
              onClick={() => setActiveTab('planning')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5"
            >
              Voir Calendrier <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {todayInterventions.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                Aucune intervention programmée aujourd'hui.
              </div>
            ) : (
              todayInterventions.map((inter) => {
                const client = clients.find(c => c.id === inter.clientId);
                return (
                  <div 
                    key={inter.id} 
                    className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-xs transition"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs font-extrabold bg-blue-100 text-blue-800 rounded-md">
                          {inter.time}
                        </span>
                        <span className="text-xs font-bold uppercase text-gray-500 bg-gray-200 px-2 py-0.5 rounded-md">
                          {inter.type}
                        </span>
                        {inter.status === 'Completed' ? (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-md font-medium">Réalisée</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-medium">Planifiée</span>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{inter.clientName}</h4>
                        <div className="text-xs font-medium text-gray-600 italic mt-0.5">
                          🚘 {inter.vehicle} - Matrix : <span className="p-0.5 text-gray-800 font-mono bg-white border border-gray-100 rounded">{client?.plate || 'A renseigner'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin size={13} className="text-primary-blue text-blue-500 shrink-0" />
                        <span className="line-clamp-1">{inter.address}</span>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-end gap-2 md:gap-1.5 shrink-0 justify-between md:justify-center border-t md:border-t-0 pt-2 md:pt-0 border-slate-200">
                      <span className="text-sm font-bold text-gray-900">{inter.priceEstimated} {currency}</span>
                      {inter.status !== 'Completed' ? (
                        <button
                          onClick={() => {
                            setSelectedInterventionForInvoice(inter);
                            setActiveTab('factures');
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-xs"
                        >
                          <FileText size={13} />
                          Facturer sur place
                        </button>
                      ) : (
                        <div className="text-xs text-green-700 font-semibold bg-green-50 border border-green-200 px-2 py-1 rounded-lg">
                          Facturée & Fermée
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Low Stock & Quick Scan Barcode recommendation */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Urgent Alerts stock */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 flex-1 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-display font-black text-slate-800 tracking-tight">Alertes Stock Critique</h2>
                <p className="text-xxs text-slate-400 font-medium">Seuil de sécurité minimum atteint</p>
              </div>
              <button 
                onClick={() => setActiveTab('inventaire')}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline"
              >
                Gérer Stock
              </button>
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {lowStockAlerts.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  ✓ Toutes les pièces sont bien approvisionnées.
                </div>
              ) : (
                lowStockAlerts.map(item => (
                  <div key={item.id} className="p-3 bg-red-50/40 rounded-2xl border border-red-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{item.name}</h4>
                      <p className="text-xxs text-slate-400 font-mono mt-0.5">Code : {item.barcode}</p>
                      <div className="text-xxs text-slate-500 mt-1">
                        Emplacement : <span className="font-bold text-slate-700">{item.location}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-xs text-red-650 bg-red-100 text-red-800 px-2 py-1 rounded-xl block mb-1">
                        Qté : {item.quantity} / {item.minThreshold}
                      </span>
                      <span className="text-xxs text-slate-400 font-semibold">Seuil alerte</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Stats shortcut */}
          <div className="bg-slate-100 border border-slate-200 rounded-3xl p-6 space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span className="p-1.5 bg-white text-slate-800 rounded-xl border border-slate-250"><Wrench size={14} /></span>
              Outils Mécanicien Mobile
            </h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Profitez du scanner de code-barre intégré dans l'onglet stock pour enregistrer des entrées de matériel de retour d'entrepôt, ou des sorties de pièces sur site.
            </p>
            <div className="flex gap-2 pt-1.5">
              <button
                onClick={() => setActiveTab('inventaire')} 
                className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl shadow-xxs text-center transition cursor-pointer"
              >
                Scan Code-Barres
              </button>
              <button
                onClick={() => {
                  setSelectedInterventionForInvoice({
                    id: 'quick-on-site',
                    clientId: '',
                    clientName: 'Nouveau Client',
                    vehicle: 'À renseigner',
                    date: todayStr,
                    time: '12:00',
                    type: 'Autre',
                    description: 'Intervention urgente sur site',
                    status: 'Scheduled',
                    priceEstimated: 0,
                    address: 'Sur place'
                  });
                  setActiveTab('factures');
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-sm text-center transition cursor-pointer animate-pulse"
              >
                + Facture Rapide
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
