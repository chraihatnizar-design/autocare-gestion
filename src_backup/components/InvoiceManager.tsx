/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  X, 
  Search, 
  User, 
  Car, 
  PlusCircle, 
  Trash2, 
  FileCheck, 
  CreditCard, 
  Percent, 
  Barcode 
} from 'lucide-react';
import { Invoice, InvoiceItem, Client, StockItem, PaymentMethod, InvoiceStatus, AppSettings } from '../types';
import { generateInvoicePDF } from '../utils/pdfGenerator';

interface InvoiceManagerProps {
  invoices: Invoice[];
  clients: Client[];
  stock: StockItem[];
  selectedInterventionForInvoice: any;
  setSelectedInterventionForInvoice: (val: any) => void;
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => void;
  onUpdateInvoiceStatus: (id: string, status: InvoiceStatus, method: PaymentMethod) => void;
  settings?: AppSettings;
}

export default function InvoiceManager({
  invoices,
  clients,
  stock,
  selectedInterventionForInvoice,
  setSelectedInterventionForInvoice,
  onAddInvoice,
  onUpdateInvoiceStatus,
  settings
}: InvoiceManagerProps) {
  const currency = settings?.currency || 'DH';
  
  // State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tous' | 'Paid' | 'Unpaid'>('Tous');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(invoices[0] || null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Invoice form states
  const [selectedClientId, setSelectedClientId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('2026-06-06');
  const [dueDate, setDueDate] = useState('2026-06-13');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(20);
  const [paymentStatus, setPaymentStatus] = useState<InvoiceStatus>('Unpaid');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pending');

  // Synchronize default tax rate from user parameters
  useEffect(() => {
    if (settings && settings.defaultTaxRate !== undefined) {
      setTaxRate(settings.defaultTaxRate);
    }
  }, [settings, showCreateModal]);

  // Helpers for line items builder
  const [itemType, setItemType] = useState<'Service' | 'Part'>('Service');
  const [selectedPartId, setSelectedPartId] = useState('');
  const [customServiceName, setCustomServiceName] = useState('');
  const [itemPrice, setItemPrice] = useState<number>(0);
  const [itemQty, setItemQty] = useState<number>(1);

  // Auto detect if there was a redirected request to invoice an intervention from Dashboard/Calendar
  useEffect(() => {
    if (selectedInterventionForInvoice) {
      // Find client
      const cl = clients.find(c => c.id === selectedInterventionForInvoice.clientId);
      if (cl) {
        setSelectedClientId(cl.id);
      } else {
        setSelectedClientId('new-temp'); // Flag to indicate new client from scratch
      }
      
      // Seed prefilled values
      setInvoiceDate('2026-06-06');
      setDueDate('2026-06-13');
      
      // Add intervention as service item
      const newServiceItem: InvoiceItem = {
        id: 'init-service-' + Math.random().toString(36).substr(2, 9),
        name: `${selectedInterventionForInvoice.type} : ${selectedInterventionForInvoice.description || 'Prestation mécanique'}`,
        quantity: 1,
        unitPrice: selectedInterventionForInvoice.priceEstimated || 55.00,
        type: 'Service'
      };
      
      setInvoiceItems([newServiceItem]);
      setShowCreateModal(true);
    }
  }, [selectedInterventionForInvoice]);

  // Handle selected part change in form
  const handlePartSelection = (partId: string) => {
    setSelectedPartId(partId);
    if (!partId) return;
    const part = stock.find(p => p.id === partId);
    if (part) {
      setCustomServiceName(part.name);
      setItemPrice(part.priceSell);
    }
  };

  // Add line item to list in builder
  const handleAddLineItem = () => {
    if (itemType === 'Service' && !customServiceName.trim()) return;
    if (itemType === 'Part' && !selectedPartId) return;

    let partRef = stock.find(p => p.id === selectedPartId);
    
    // Check if quantity requested is greater than stock quantity (warn if part)
    if (itemType === 'Part' && partRef && itemQty > partRef.quantity) {
      alert(`⚠️ Attention: Vous ajoutez ${itemQty} x "${partRef.name}" mais seulement ${partRef.quantity} sont disponibles en stock actuellement dans l'atelier mobile.`);
    }

    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: itemType === 'Part' && partRef ? partRef.name : customServiceName,
      quantity: itemQty,
      unitPrice: itemPrice,
      type: itemType,
      partId: itemType === 'Part' ? selectedPartId : undefined
    };

    setInvoiceItems([...invoiceItems, newItem]);
    
    // Reset inputs
    setCustomServiceName('');
    setSelectedPartId('');
    setItemPrice(0);
    setItemQty(1);
  };

  // Remove line item
  const handleRemoveLineItem = (itemId: string) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== itemId));
  };

  // Calculate Running Totals for Builder
  const calcSubtotalHT = () => {
    return invoiceItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calcDiscountAmt = () => {
    return calcSubtotalHT() * (discount / 100);
  };

  const calcTTC = () => {
    const afterDiscount = calcSubtotalHT() - calcDiscountAmt();
    return afterDiscount * (1 + (taxRate / 100));
  };

  // Submit invoice registration
  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert('Veuillez sélectionner un client.');
      return;
    }
    if (invoiceItems.length === 0) {
      alert('Veuillez ajouter au moins une prestation ou une pièce.');
      return;
    }

    const client = clients.find(c => c.id === selectedClientId) || {
      id: 'client-on-site-temp',
      name: 'Client de passage',
      email: 'client-passage@meca-mobile.fr',
      phone: '+33 6 00 00 00 00',
      vehicle: 'Véhicule de passage',
      plate: 'AA-000-AA',
      address: 'Intervention sur place'
    };

    const finalTotal = calcTTC();

    // Fire callback
    onAddInvoice({
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone,
      clientVehicle: client.vehicle,
      date: invoiceDate,
      dueDate: dueDate,
      items: invoiceItems,
      discount: discount,
      taxRate: taxRate,
      total: parseFloat(finalTotal.toFixed(2)),
      status: paymentStatus,
      paymentMethod: paymentMethod,
      paymentDate: paymentStatus === 'Paid' ? invoiceDate : undefined,
      interventionId: selectedInterventionForInvoice ? selectedInterventionForInvoice.id : undefined
    });

    // Reset All State
    setInvoiceItems([]);
    setDiscount(0);
    setSelectedClientId('');
    setSelectedInterventionForInvoice(null);
    setShowCreateModal(false);
    
    // Auto select newest invoice if possible
    alert(`🎉 Facture créée avec succès ! Le stock itinérant a été mis à jour automatiquement.`);
  };

  // Filter List Invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || 
                          inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
                          inv.clientVehicle.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = statusFilter === 'Tous' || inv.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Suivi & Facturation Rapide</h1>
          <p className="text-xs text-gray-600">Générez des factures numérotées régulées et téléchargez-les au format PDF.</p>
        </div>

        <button
          onClick={() => {
            setSelectedClientId('');
            setInvoiceItems([]);
            setSelectedInterventionForInvoice(null);
            setShowCreateModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} />
          Facturer sur place (Créer)
        </button>
      </div>

      {/* Main interactive grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Filter & Invoices list */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="space-y-2 border-b border-gray-50 pb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
              <FileCheck size={16} className="text-gray-500" />
              Journal de Facturation ({invoices.length})
            </h2>

            {/* Quick search & Filter Tabs */}
            <div className="space-y-2">
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="N° Facture, client, voiture..."
                  className="w-full bg-gray-55/35 border border-gray-200 rounded-lg text-xs pl-8 pr-3 py-1.8 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-150 gap-1">
                <button
                  type="button"
                  onClick={() => setStatusFilter('Tous')}
                  className={`flex-1 py-1 px-2 rounded-md text-xxs font-bold cursor-pointer transition ${
                    statusFilter === 'Tous' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
                  }`}
                >
                  Tous
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('Paid')}
                  className={`flex-1 py-1 px-2 rounded-md text-xxs font-bold cursor-pointer transition ${
                    statusFilter === 'Paid' ? 'bg-green-100 text-green-800 shadow-xs' : 'text-gray-500'
                  }`}
                >
                  Payées
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('Unpaid')}
                  className={`flex-1 py-1 px-2 rounded-md text-xxs font-bold cursor-pointer transition ${
                    statusFilter === 'Unpaid' ? 'bg-red-100 text-red-800 shadow-xs' : 'text-gray-500'
                  }`}
                >
                  À payer
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs">
                Aucune facture correspondante.
              </div>
            ) : (
              filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex items-center justify-between gap-3 ${
                    selectedInvoice?.id === inv.id
                      ? 'border-blue-300 bg-blue-50/20 shadow-xxs'
                      : 'border-gray-105 hover:bg-gray-50 bg-gray-50/20'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-black text-gray-950">{inv.invoiceNumber}</span>
                      {inv.status === 'Paid' ? (
                        <span className="px-1.5 py-0.2 bg-green-100 text-green-800 text-scale scale-90 font-bold rounded">Payée</span>
                      ) : (
                        <span className="px-1.5 py-0.2 bg-red-100 text-red-800 text-scale scale-90 font-bold rounded">À payer</span>
                      )}
                    </div>
                    <p className="text-xxs font-extrabold text-gray-700">{inv.clientName}</p>
                    <p className="text-xxs text-gray-400 font-mono italic">🚘 {inv.clientVehicle}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-950 font-mono block mb-1">
                      {inv.total.toFixed(2)} {currency}
                    </span>
                    <span className="text-xxs text-gray-400 font-mono">Date: {inv.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Active invoice detail and download PDF */}
        <div className="lg:col-span-7">
          {selectedInvoice ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-6">
              
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-gray-100 pb-5">
                <div className="space-y-1.5 text-left">
                  <span className="text-xxs font-mono font-bold text-gray-400">FACTURE ENREGISTRÉE</span>
                  <h2 className="text-lg font-black text-gray-950 flex items-center gap-2">
                    <FileText size={20} className="text-blue-550 shrink-0" />
                    {selectedInvoice.invoiceNumber}
                  </h2>
                  <p className="text-xxs text-gray-500">Mise à jour : {selectedInvoice.date}</p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Download PDF action */}
                  <button
                    onClick={() => generateInvoicePDF(selectedInvoice)}
                    className="p-2 border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700 bg-white rounded-xl transition cursor-pointer text-xs font-extrabold flex items-center gap-1 shadow-xxs"
                  >
                    <Download size={14} /> Télécharger PDF
                  </button>

                  {/* Payment adjustment toggling if unpaid */}
                  {selectedInvoice.status === 'Unpaid' && (
                    <button
                      onClick={() => {
                        const method = window.prompt("Saisir le moyen de paiement (Espèces, Carte, Virement, Chèque, Effet) :", "Carte");
                        if (method) {
                          const translatedMethod = 
                            method.toLowerCase().includes('esp') ? 'Cash' :
                            method.toLowerCase().includes('car') ? 'Card' :
                            method.toLowerCase().includes('vir') ? 'Transfer' : 
                            method.toLowerCase().includes('ch') ? 'Check' : 
                            method.toLowerCase().includes('eff') ? 'Bill' : 'Card';
                          onUpdateInvoiceStatus(selectedInvoice.id, 'Paid', translatedMethod);
                          setSelectedInvoice({
                            ...selectedInvoice,
                            status: 'Paid',
                            paymentMethod: translatedMethod,
                            paymentDate: '2026-06-06'
                          });
                        }
                      }}
                      className="p-2 border border-green-200 hover:border-green-400 bg-green-50 text-green-800 rounded-xl transition cursor-pointer text-xs font-black flex items-center gap-1 shadow-xxs"
                    >
                      <CheckCircle size={14} /> Passer en PAYÉE
                    </button>
                  )}
                </div>
              </div>

              {/* --- MOCK INVOICE PAPER SHEET VIEW --- */}
              <div className="border border-gray-250/60 p-6 md:p-8 rounded-2xl bg-slate-50/15 shadow-xxs space-y-8 text-left relative">
                
                {/* Visual Header with Company info and logo */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-gray-150">
                  <div className="space-y-1 text-xs">
                    <p className="font-black text-slate-900 text-sm tracking-tight uppercase">
                      {settings?.companyName || 'Atelier Mécanique Mobile'}
                    </p>
                    <p className="text-slate-500 italic font-medium">{settings?.companyTagline || 'Prestations de réparation, entretien & diagnostic mobile'}</p>
                    <div className="pt-2 space-y-0.5 text-gray-600 font-mono text-[10px]">
                      <p>Tél : {settings?.companyPhone || '+33 6 99 88 77 66'}</p>
                      <p>Email : {settings?.companyEmail || 'contact@meca-mobile.fr'}</p>
                      <p>Adresse : {settings?.companyAddress || 'Rue Thiers, Valenciennes'} ({settings?.companyCity || 'Valenciennes'})</p>
                    </div>
                  </div>

                  {/* Logo block */}
                  <div className="shrink-0 sm:self-center">
                    {settings?.companyLogo ? (
                      <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-xxs">
                        <img 
                          src={settings.companyLogo} 
                          alt="Logo Entreprise" 
                          referrerPolicy="no-referrer" 
                          className="max-h-14 max-w-[150px] object-contain rounded-md"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 bg-slate-900 text-white p-3 px-4 rounded-xl border border-slate-800 shadow-xs">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4.5 h-4.5 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.67 2.67 0 1113.43 17.18l-5.83-5.83M11.42 15.17l2.42-2.42M11.42 15.17L7.15 19.44a2.67 2.67 0 11-3.78-3.78l4.28-4.28M13.84 12.75l5.83-5.83a2.67 2.67 0 113.78 3.78l-5.83 5.83m-3.78-3.78l-.3-.3m-3.15 3.15l.3-.3" />
                          </svg>
                        </div>
                        <div className="text-left leading-none">
                          <span className="text-[10px] uppercase font-black tracking-widest text-blue-400 block">ATELIER</span>
                          <span className="text-xs font-black tracking-tight text-white block mt-0.5">MÉCANIQUE</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Billing Info Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50/60 p-4 rounded-xl border border-gray-150/60">
                  <div className="space-y-1.5 text-xs">
                    <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Identifiants légaux</span>
                    <div className="space-y-0.5 text-gray-700">
                      <p className="font-bold text-gray-900">{settings?.companyCity || 'Valenciennes'}, France</p>
                      <p className="text-xxs font-mono text-gray-500">ICE / Sirc : {settings?.companyIce || '001548239000182'}</p>
                      <p className="text-xxs font-mono text-gray-500">Capital : {settings?.companyCapital || '50 000 DH'}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs border-t sm:border-t-0 sm:border-l border-gray-150 pt-3 sm:pt-0 sm:pl-6">
                    <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Client Destinataire</span>
                    <div className="space-y-0.5 text-gray-800">
                      <p className="font-extrabold text-blue-955">{selectedInvoice.clientName}</p>
                      <p>{selectedInvoice.clientEmail}</p>
                      <p>Tél : {selectedInvoice.clientPhone}</p>
                      <p className="text-xxs font-mono text-gray-600 bg-white border border-gray-150 px-1.5 py-0.5 rounded inline-block mt-1 shadow-xxs">
                        🚘 {selectedInvoice.clientVehicle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Invoiced items list table layout */}
                <div className="space-y-3 pt-2">
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Détail des prestations & fournitures</h3>
                  <div className="border border-gray-150 rounded-xl overflow-hidden bg-white shadow-xxs">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-gray-150 font-bold text-gray-700">
                        <tr>
                          <th className="p-3">Désignation</th>
                          <th className="p-3" style={{ width: '110px' }}>Type</th>
                          <th className="p-3 text-center" style={{ width: '60px' }}>Qté</th>
                          <th className="p-3 text-right" style={{ width: '110px' }}>P.U. HT</th>
                          <th className="p-3 text-right" style={{ width: '120px' }}>Total HT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedInvoice.items.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-gray-900 leading-normal">{item.name}</td>
                            <td className="p-3 text-slate-500 whitespace-nowrap">{item.type === 'Part' ? '⚙️ Pièce' : '👨‍🔧 M.O.'}</td>
                            <td className="p-3 text-center font-mono font-bold text-slate-800 bg-slate-50/20">{item.quantity}</td>
                            <td className="p-3 text-right font-mono">{item.unitPrice.toFixed(2)} {currency}</td>
                            <td className="p-3 text-right font-mono font-bold text-gray-950">{(item.quantity * item.unitPrice).toFixed(2)} {currency}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Box Totals spaced out on the bottom-right */}
                <div className="flex justify-end pt-4">
                  <div className="w-full sm:w-72 space-y-2.5 text-xs text-left bg-gray-50/50 p-4.5 rounded-xl border border-gray-200">
                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-1">Règlement Facture</span>
                    
                    {/* Calculate exact values to display */}
                    {(() => {
                      const subtotalHT = selectedInvoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
                      const discountAmount = subtotalHT * (selectedInvoice.discount / 100);
                      const totalHTAfterDiscount = subtotalHT - discountAmount;
                      const taxAmount = totalHTAfterDiscount * (selectedInvoice.taxRate / 100);
                      const totalTTC = totalHTAfterDiscount + taxAmount;

                      return (
                        <>
                          <div className="flex justify-between items-center pb-1.5 border-b border-dashed border-gray-200">
                            <span className="text-gray-500 font-semibold">Sous-total HT :</span>
                            <span className="font-mono font-bold text-slate-850">
                              {subtotalHT.toFixed(2)} {currency}
                            </span>
                          </div>

                          {selectedInvoice.discount > 0 && (
                            <div className="flex justify-between items-center pb-1.5 border-b border-dashed border-gray-200 italic text-emerald-700">
                              <span className="font-semibold">Remise ({selectedInvoice.discount}%) :</span>
                              <span className="font-mono font-extrabold">
                                -{discountAmount.toFixed(2)} {currency}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200">
                            <span className="text-gray-500 font-semibold">TVA ({selectedInvoice.taxRate}%) :</span>
                            <span className="font-mono font-bold text-slate-850">
                              {taxAmount.toFixed(2)} {currency}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-sm font-black text-white bg-slate-900 p-3 rounded-lg shadow-xxs">
                            <span className="font-sans uppercase tracking-wide text-xs">Total TTC :</span>
                            <span className="font-mono text-sm">{totalTTC.toFixed(2)} {currency}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl text-gray-400">
              Sélectionnez une facture dans le registre.
            </div>
          )}
        </div>

      </div>

      {/* QUICK INVOICE CREATOR FORM (MODAL FRAME) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl my-8 p-6 border border-gray-100 shadow-2xl relative flex flex-col gap-5 max-h-[90vh]">
            <button 
              onClick={() => {
                setShowCreateModal(false);
                setSelectedInterventionForInvoice(null);
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-650 transition cursor-pointer p-1"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="font-extrabold text-gray-950 text-base">Facturation Rapide sur Place - Atelier Itinérant</h3>
              <p className="text-xs text-gray-500 mt-0.5">Associez des pièces d'inventaire aux prestations réalisées.</p>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
              
              {/* Step 1: Client Selection & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-gray-50 p-4 rounded-xl border border-gray-100 text-left">
                
                {/* Select Client dropdown */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Client Facturé *</label>
                  <select
                    required
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Choisir un client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.vehicle ? `(${c.vehicle.split(' - ')[0]})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dates */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Date d'Émission</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-xs p-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Échéance de Règlement</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-xs p-2"
                  />
                </div>
              </div>

              {/* Step 2: Live Invoicing Line Items Builder */}
              <div className="border border-gray-150 rounded-xl p-4 space-y-4">
                <span className="text-xxs font-black text-gray-400 uppercase tracking-widest block">🔧 AJOUTER DES PRESTATIONS OU PIÈCES DÉTTACHÉES</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end bg-blue-50/20 p-3 rounded-lg border border-blue-50 text-left">
                  
                  {/* Select Type toggle */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="block text-xs font-bold text-gray-700">Catégorie</label>
                    <div className="flex bg-white p-0.5 rounded-lg border border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setItemType('Service');
                          setCustomServiceName('');
                          setSelectedPartId('');
                          setItemPrice(0);
                        }}
                        className={`flex-1 py-1.5 rounded-md text-xxs font-black cursor-pointer ${
                          itemType === 'Service' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500'
                        }`}
                      >
                        Main d'œuvre
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setItemType('Part');
                          setCustomServiceName('');
                          setSelectedPartId('');
                          setItemPrice(0);
                        }}
                        className={`flex-1 py-1.5 rounded-md text-xxs font-black cursor-pointer ${
                          itemType === 'Part' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500'
                        }`}
                      >
                        Pièce
                      </button>
                    </div>
                  </div>

                  {/* Input description OR part selected dynamic */}
                  <div className="sm:col-span-4 space-y-1">
                    {itemType === 'Service' ? (
                      <>
                        <label className="block text-xs font-bold text-gray-700">Désignation du service</label>
                        <input
                          type="text"
                          value={customServiceName}
                          onChange={(e) => setCustomServiceName(e.target.value)}
                          placeholder="Ex: Main d'œuvre freinage"
                          className="w-full bg-white border border-gray-200 rounded-lg text-xs p-2.2 outline-none"
                        />
                      </>
                    ) : (
                      <>
                        <label className="block text-xs font-bold text-gray-700">Choisir Pièce du stock mobile</label>
                        <select
                          value={selectedPartId}
                          onChange={(e) => handlePartSelection(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg text-xs p-2.2 focus:ring-1 focus:ring-blue-500 outline-none font-sans"
                        >
                          <option value="">-- Sélectionner --</option>
                          {stock.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (Dispo : {p.quantity})</option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>

                  {/* Inputs price & unit */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-gray-700">P.U. HT ({currency})</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-gray-200 rounded-lg text-xs p-2.2 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-1 space-y-1">
                    <label className="block text-xs font-bold text-gray-700">Qté</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-white border border-gray-200 rounded-lg text-xs p-2.2 text-center"
                    />
                  </div>

                  {/* Submit Line */}
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="w-full py-2.2 bg-blue-105 hover:bg-blue-150 text-blue-700 font-extrabold text-xs rounded-lg border border-blue-200 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <PlusCircle size={14} /> Ajouter
                    </button>
                  </div>

                </div>

                {/* Sub table list of already drafted invoice parts */}
                <div className="border border-gray-100 rounded-lg overflow-hidden max-h-[160px] overflow-y-auto">
                  <table className="w-full text-xxs text-left divide-y divide-gray-100">
                    <thead className="bg-gray-50/70 font-bold text-gray-500">
                      <tr>
                        <th className="p-2">Intitulé</th>
                        <th className="p-2">Type</th>
                        <th className="p-2 text-center">Qté</th>
                        <th className="p-2 text-right">P.U. HT</th>
                        <th className="p-2 text-right">Total HT</th>
                        <th className="p-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-55/60">
                      {invoiceItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-gray-400">Aucun élément ajouté à cette facture d'intervention.</td>
                        </tr>
                      ) : (
                        invoiceItems.map((item, index) => (
                          <tr key={item.id || index} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-bold text-gray-800">{item.name}</td>
                            <td className="p-2.5">{item.type === 'Part' ? '🧩 Pièce' : '👨‍🔧 Service'}</td>
                            <td className="p-2.5 text-center font-bold font-mono">{item.quantity}</td>
                            <td className="p-2.5 text-right font-mono">{item.unitPrice.toFixed(2)} {currency}</td>
                            <td className="p-2.5 text-right font-mono font-bold">{(item.quantity * item.unitPrice).toFixed(2)} {currency}</td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(item.id)}
                                className="p-1 hover:bg-red-50 text-red-650 rounded cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Step 3: Global settings Discounts, TVA, status, payment */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 bg-gray-50 p-4 rounded-xl border border-gray-150 text-left">
                
                {/* Remise */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Remise Commerciale (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full bg-white border border-gray-200 rounded-lg text-xs p-2 font-mono"
                  />
                </div>

                {/* TVA */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">TVA (%)</label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseInt(e.target.value) || 20)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-xs p-2.5"
                  >
                    <option value="20">20% (Standard)</option>
                    <option value="10">10% (Taux réduit)</option>
                    <option value="5.5">5.5% (Taux réduit II)</option>
                    <option value="0">0% (Franchise TVA)</option>
                  </select>
                </div>

                {/* Paiement initial */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">État initial</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => {
                      const stat = e.target.value as InvoiceStatus;
                      setPaymentStatus(stat);
                      if (stat === 'Paid') {
                        setPaymentMethod('Card');
                      } else {
                        setPaymentMethod('Pending');
                      }
                    }}
                    className="w-full bg-white border border-gray-200 rounded-lg text-xs p-2.5"
                  >
                    <option value="Unpaid">À Payer (En attente)</option>
                    <option value="Paid">Déjà Payée sur place</option>
                  </select>
                </div>

                {/* Méthode */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Mode Règlement</label>
                  <select
                    value={paymentMethod}
                    disabled={paymentStatus === 'Unpaid'}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-xs p-2.5 disabled:opacity-50"
                  >
                    <option value="Pending">En cours...</option>
                    <option value="Card">Carte Bancaire</option>
                    <option value="Cash">Espèces</option>
                    <option value="Transfer">Virement</option>
                    <option value="Check">Chèque</option>
                    <option value="Bill">Effet de commerce</option>
                  </select>
                </div>

              </div>

              {/* Running Total display banner */}
              <div className="flex justify-between items-center bg-gray-900 text-white p-4 rounded-xl shadow-inner text-left font-mono">
                <div>
                  <span className="text-xxs text-gray-400 font-extrabold uppercase tracking-widest">Calcul synthétique HT</span>
                  <div className="text-xs text-gray-300">HT : {calcSubtotalHT().toFixed(2)} {currency} | Remise : -{calcDiscountAmt().toFixed(2)} {currency}</div>
                </div>
                
                <div className="text-right">
                  <span className="text-xxs text-gray-400 font-extrabold uppercase tracking-widest">Total Net de l'intervention (TTC)</span>
                  <div className="text-xl font-black text-rose-450 text-amber-300">{calcTTC().toFixed(2)} {currency}</div>
                </div>
              </div>

              {/* Actions submit */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedInterventionForInvoice(null);
                  }}
                  className="flex-1 py-2.5 bg-gray-150 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Fermer
                </button>
                
                <button
                  type="submit"
                  className="flex-1 py-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileCheck size={14} /> Enregistrer & Facturer
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
