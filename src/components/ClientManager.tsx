/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Car, 
  MessageSquare, 
  Send, 
  History, 
  FileText, 
  X, 
  Search, 
  Edit,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Client, Invoice, Intervention, ReminderLog, AppSettings, StockItem, Quote } from '../types';
import { generateQuotePDF, generateInvoicePDF, generateDeliveryNotePDF } from '../utils/pdfGenerator';

interface ClientManagerProps {
  clients: Client[];
  invoices: Invoice[];
  interventions: Intervention[];
  reminderLogs: ReminderLog[];
  quotes: Quote[];
  stock: StockItem[];
  onAddClient: (client: Omit<Client, 'id'>) => void;
  onUpdateClient: (client: Client) => void;
  onSendReminder: (reminder: Omit<ReminderLog, 'id' | 'date' | 'status'>) => void;
  onAddQuote: (quote: Omit<Quote, 'id' | 'quoteNumber' | 'status'>) => Quote;
  onUpdateQuoteStatus: (quoteId: string, status: 'Pending' | 'Accepted' | 'Rejected') => void;
  onConvertQuoteToInvoice: (quoteId: string) => void;
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => Invoice;
  settings?: AppSettings;
}

export default function ClientManager({
  clients,
  invoices,
  interventions,
  reminderLogs,
  quotes,
  stock,
  onAddClient,
  onUpdateClient,
  onSendReminder,
  onAddQuote,
  onUpdateQuoteStatus,
  onConvertQuoteToInvoice,
  onAddInvoice,
  settings
}: ClientManagerProps) {
  const currency = settings?.currency || 'DH';

  // State
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

  // Quote / Invoice PDF Creator & document builders states
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [docExpiryDate, setDocExpiryDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [docDueDate, setDocDueDate] = useState(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  
  // Custom builder for document list items
  const [builderItems, setBuilderItems] = useState<any[]>([]);
  const [docDiscount, setDocDiscount] = useState<number>(0);
  const [docTaxRate, setDocTaxRate] = useState<number>(settings?.defaultTaxRate || 20);

  // Detailed vehicle information at document creation
  const [docVehicleBrand, setDocVehicleBrand] = useState('');
  const [docVehicleModel, setDocVehicleModel] = useState('');
  const [docVehicleRegistration, setDocVehicleRegistration] = useState('');
  const [docVehicleMileage, setDocVehicleMileage] = useState('');

  // Double notes system
  const [docPublicNotes, setDocPublicNotes] = useState('');
  const [docPrivateNotes, setDocPrivateNotes] = useState('');

  // Quick inputs for new item rows
  const [rowType, setRowType] = useState<'Service' | 'Part'>('Service');
  const [rowServiceName, setRowServiceName] = useState('');
  const [rowPartId, setRowPartId] = useState('');
  const [rowPrice, setRowPrice] = useState<number>(0);
  const [rowQty, setRowQty] = useState<number>(1);

  // Client Type selection
  const [clientType, setClientType] = useState<'Particulier' | 'Professionnel'>('Particulier');

  // Delivery Note option toggle
  const [generateBLOnQuoteCreation, setGenerateBLOnQuoteCreation] = useState<boolean>(true);
  const [generateBLOnInvoiceCreation, setGenerateBLOnInvoiceCreation] = useState<boolean>(true);

  const companyPhone = settings?.companyPhone || '+212 5 22 11 22 33';
  const companyName = settings?.companyName || "Atelier Mécanique Mobile";

  // New/Edit Client fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [plate, setPlate] = useState('');
  const [address, setAddress] = useState('');

  // Reminder fields
  const [reminderType, setReminderType] = useState<'SMS' | 'Email'>('SMS');
  const [reminderTemplate, setReminderTemplate] = useState<'RDV' | 'UNPAID' | 'WELCOME'>('RDV');
  const [customContent, setCustomContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');

  // Filter clients
  const filteredClients = clients.filter(c => 
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.vehicle || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.plate || '').toLowerCase().includes(search.toLowerCase())
  );

  // Get details for selected client
  const clientInvoices = invoices.filter(inv => inv.clientId === selectedClient?.id);
  const clientInterventions = interventions.filter(inter => inter.clientId === selectedClient?.id);
  const clientReminders = reminderLogs.filter(rem => rem.clientId === selectedClient?.id);

  // Load selected client into edit form
  const handleEditClick = (client: Client) => {
    setName(client.name);
    setPhone(client.phone);
    setEmail(client.email);
    setVehicle(client.vehicle);
    setPlate(client.plate);
    setAddress(client.address);
    setClientType(client.clientType || 'Particulier');
    setShowEditModal(true);
  };

  // Submit new client
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddClient({ name, phone, email, vehicle, plate, address, clientType });
    // Reset fields
    setName('');
    setPhone('');
    setEmail('');
    setVehicle('');
    setPlate('');
    setAddress('');
    setClientType('Particulier');
    setShowAddModal(false);
  };

  // Submit edit client
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    onUpdateClient({
      id: selectedClient.id,
      name, phone, email, vehicle, plate, address, clientType
    });
    // Update local selection
    setSelectedClient({ id: selectedClient.id, name, phone, email, vehicle, plate, address, clientType });
    setShowEditModal(false);
  };

  // Pre-fill reminder custom content based on templates
  const updateReminderTemplate = (templ: 'RDV' | 'UNPAID' | 'WELCOME', client: Client, type: 'SMS' | 'Email') => {
    setReminderTemplate(templ);
    if (!client) return;

    if (templ === 'RDV') {
      const nextInter = interventions.find(inter => inter.clientId === client.id && inter.status === 'Scheduled');
      const dateText = nextInter ? `le ${nextInter.date} à ${nextInter.time}` : 'très prochainement';
      const addressText = nextInter ? `à l'adresse suivante : ${nextInter.address}` : 'chez vous';
      const vehicleText = client.vehicle ? `votre véhicule (${client.vehicle})` : 'votre véhicule';
      const vehicleSMSText = client.vehicle ? ` pour votre ${client.vehicle}` : '';
      
      if (type === 'Email') {
        setEmailSubject(`Rappel d'intervention mécanique - ${companyName}`);
        setCustomContent(`Bonjour ${client.name},\n\nNous vous confirmons notre passage pour l'entretien de ${vehicleText} ${dateText} ${addressText}.\n\nNotre atelier mobile dispose de tout le matériel requis pour effectuer les travaux sur place. Merci de libérer un espace suffisant près du véhicule.\n\nCordialement,\n${companyName}\nTél : ${companyPhone}`);
      } else {
        setCustomContent(`Atelier Mécanique : Rappel pour votre rdv ${dateText}${vehicleSMSText}. Notre fourgon technique sera sur place à l'adresse fournie. En cas d'empêchement, merci de nous appeler au ${companyPhone}.`);
      }
    } else if (templ === 'UNPAID') {
      const unpaidBill = invoices.find(inv => inv.clientId === client.id && inv.status === 'Unpaid');
      const billNo = unpaidBill ? unpaidBill.invoiceNumber : 'FACT-2026-XXX';
      const amt = unpaidBill ? unpaidBill.total.toFixed(2) : '0.00';
      const vehicleText = client.vehicle ? ` concernant les réparations faites sur votre ${client.vehicle}` : '';
      const vehicleSMSText = client.vehicle ? ` sur votre véhicule ${client.vehicle}` : '';

      if (type === 'Email') {
        setEmailSubject(`Rappel de paiement impayé - Échéance dépassée`);
        setCustomContent(`Bonjour ${client.name},\n\nSauf erreur ou omission de notre part, notre facture n° ${billNo} d'un montant de ${amt} ${currency}${vehicleText} est toujours en attente de règlement.\n\nNous vous remercions de bien vouloir procéder à son paiement par chèque, carte bancaire, espèces ou virement bancaire sous les plus brefs délais.\n\nEn cas de questions techniques, n'hésitez pas à nous recontacter.\n\nCordialement,\n${companyName}`);
      } else {
        setCustomContent(`Atelier Mécanique : Rappel de paiement pour la facture ${billNo} d'un montant de ${amt} ${currency}${vehicleSMSText}. Merci de régulariser la facture. Tél : ${companyPhone}`);
      }
    } else if (templ === 'WELCOME') {
      const vehicleText = client.vehicle ? ` pour votre ${client.vehicle}` : '';
      const plateText = client.plate ? ` (Immatriculation : ${client.plate})` : '';

      if (type === 'Email') {
        setEmailSubject(`Bienvenue chez ${companyName} !`);
        setCustomContent(`Bonjour ${client.name},\n\nC'est un plaisir de vous compter parmi nos clients ! Votre fiche atelier${vehicleText}${plateText} a été officiellement enregistrée.\n\nGrâce à notre atelier équipé itinérant, nous intervenons directement chez vous ou sur votre lieu de travail pour toutes opérations d'entretien régulières et de diagnostics d'urgence.\n\nConservez nos coordonnées pour votre prochain entretien !\n\nCordialement,\nL'équipe de ${companyName}`);
      } else {
        setCustomContent(`Atelier Mobile Mécanique : Bienvenue ${client.name} ! Votre profil d'intervention a été bien configuré. Nous restons à votre écoute au ${companyPhone} pour vos prochains rdv d'entretien sur place.`);
      }
    }
  };

  // Open send reminder modal pre-filled
  const handleOpenReminder = (client: Client, type: 'SMS' | 'Email') => {
    setSelectedClient(client);
    setReminderType(type);
    setShowReminderModal(true);
    updateReminderTemplate('RDV', client, type);
  };

  // Dispatch reminder simulation
  const handleSendReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    onSendReminder({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      type: reminderType,
      recipient: reminderType === 'SMS' ? selectedClient.phone : selectedClient.email,
      subject: reminderType === 'Email' ? emailSubject : undefined,
      content: customContent
    });

    // Launch direct action triggers of browser if desired
    if (reminderType === 'Email') {
      const mailtoUrl = `mailto:${selectedClient.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(customContent)}`;
      window.open(mailtoUrl, '_blank');
    } else {
      // SMS deep link simulation
      const smsUrl = `sms:${selectedClient.phone}?body=${encodeURIComponent(customContent)}`;
      // Just test if we can run, else quiet
      try {
        window.open(smsUrl, '_blank');
      } catch (err) {
        console.warn('sms linking is restricted by browser preview context:', err);
      }
    }

    setShowReminderModal(false);
  };

  // Helper functions for dynamic Quote and Invoice builders
  const calculateBuilderTotalHT = () => {
    return builderItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
  };

  const calculateBuilderTotalTTC = () => {
    const ht = calculateBuilderTotalHT();
    const discountAmt = ht * (docDiscount / 100);
    const afterDiscount = ht - discountAmt;
    const taxAmt = afterDiscount * (docTaxRate / 100);
    return afterDiscount + taxAmt;
  };

  const handleBuilderPartSelect = (partId: string) => {
    setRowPartId(partId);
    if (!partId) {
      setRowPrice(0);
      setRowServiceName('');
      return;
    }
    const item = stock.find(p => p.id === partId);
    if (item) {
      setRowPrice(item.priceSell);
      setRowServiceName(item.name);
    }
  };

  const handleAddBuilderItem = () => {
    if (rowType === 'Service' && !rowServiceName.trim()) return;
    if (rowType === 'Part' && !rowPartId) return;

    const newItem = {
      id: 'it-' + Math.random().toString(36).substr(2, 9),
      name: rowServiceName,
      quantity: Number(rowQty),
      unitPrice: Number(rowPrice),
      type: rowType,
      partId: rowType === 'Part' ? rowPartId : undefined
    };

    setBuilderItems([...builderItems, newItem]);
    
    // Reset item inputs
    setRowServiceName('');
    setRowPartId('');
    setRowPrice(0);
    setRowQty(1);
  };

  const handleRemoveBuilderItem = (id: string) => {
    setBuilderItems(builderItems.filter(item => item.id !== id));
  };

  const handleAddQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    if (builderItems.length === 0) {
      alert("Veuillez ajouter au moins une prestation ou pièce détachée.");
      return;
    }

    const newQuote = {
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientEmail: selectedClient.email,
      clientPhone: selectedClient.phone,
      clientVehicle: selectedClient.vehicle,
      vehicleMileage: docVehicleMileage,
      vehicleBrand: docVehicleBrand,
      vehicleModel: docVehicleModel,
      vehicleRegistration: docVehicleRegistration,
      publicNotes: docPublicNotes,
      privateNotes: docPrivateNotes,
      date: docDate,
      validUntil: docExpiryDate,
      items: builderItems,
      discount: Number(docDiscount),
      taxRate: Number(docTaxRate),
      total: calculateBuilderTotalTTC()
    };

    const saved = onAddQuote(newQuote);
    // Print immediately
    generateQuotePDF(saved);

    if (generateBLOnQuoteCreation) {
      setTimeout(() => {
        generateDeliveryNotePDF(saved);
      }, 700);
    }

    setShowQuoteModal(false);
    setBuilderItems([]);
    setDocDiscount(0);
  };

  const handleAddInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    if (builderItems.length === 0) {
      alert("Veuillez ajouter au moins une prestation ou pièce détachée.");
      return;
    }

    const newInvoice = {
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientEmail: selectedClient.email,
      clientPhone: selectedClient.phone,
      clientVehicle: selectedClient.vehicle,
      vehicleMileage: docVehicleMileage,
      vehicleBrand: docVehicleBrand,
      vehicleModel: docVehicleModel,
      vehicleRegistration: docVehicleRegistration,
      publicNotes: docPublicNotes,
      privateNotes: docPrivateNotes,
      date: docDate,
      dueDate: docDueDate,
      items: builderItems,
      discount: Number(docDiscount),
      taxRate: Number(docTaxRate),
      total: calculateBuilderTotalTTC(),
      status: 'Unpaid' as const,
      paymentMethod: 'Pending' as const
    };

    const saved = onAddInvoice(newInvoice);

    // Print immediately
    generateInvoicePDF(saved);

    if (generateBLOnInvoiceCreation) {
      setTimeout(() => {
        generateDeliveryNotePDF(saved);
      }, 700);
    }

    setShowInvoiceModal(false);
    setBuilderItems([]);
    setDocDiscount(0);
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Add client */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Enregistrement & Relance Clients</h1>
          <p className="text-xs text-gray-600">Gérez vos clients mécaniques avec envoi de rappels SMS/Mail directs.</p>
        </div>

        <button
          onClick={() => {
            setName('');
            setPhone('');
            setEmail('');
            setVehicle('');
            setPlate('');
            setAddress('');
            setShowAddModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} />
          Nouveau Client
        </button>
      </div>

      {/* Main split dashboard view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Clients List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="space-y-2 border-b border-gray-50 pb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
              <Users size={16} className="text-gray-500" />
              Répertoire National ({clients.length})
            </h2>
            
            {/* Search Input bar */}
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nom, matricule, téléphone..."
                className="w-full bg-gray-55/35 border border-gray-200 rounded-lg text-xs pl-8 pr-3 py-1.8 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* List items */}
          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
            {filteredClients.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs">
                Aucun client trouvé dans le système.
              </div>
            ) : (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-center justify-between gap-3 ${
                    selectedClient?.id === client.id
                      ? 'border-blue-300 bg-blue-50/20 shadow-xxs'
                      : 'border-gray-105 hover:bg-gray-50 bg-gray-50/30'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-xs text-gray-950">{client.name}</h3>
                      <span className={`text-[8px] font-black uppercase px-1 rounded-sm border ${
                        client.clientType === 'Professionnel' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        {client.clientType || 'Particulier'}
                      </span>
                    </div>
                    <p className="text-xxs text-gray-500 flex items-center gap-1">
                      <Car size={10} /> {client.vehicle || 'Véhicule non configuré'}
                    </p>
                    <p className="text-xxs text-slate-400 font-mono italic">{client.plate || 'Sans immatriculation'}</p>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenReminder(client, 'SMS');
                      }}
                      className="p-1.5 bg-blue-50 hover:bg-blue-105 text-blue-700 rounded-lg border border-blue-100 cursor-pointer"
                      title="Relancer par SMS"
                    >
                      <MessageSquare size={13} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenReminder(client, 'Email');
                      }}
                      className="p-1.5 bg-indigo-50 hover:bg-indigo-105 text-indigo-700 rounded-lg border border-indigo-100 cursor-pointer"
                      title="Envoyer un Mail"
                    >
                      <Mail size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Detailed client record sheet */}
        <div className="lg:col-span-7">
          {selectedClient ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-6">
              
              {/* Profile Card Header */}
              <div className="flex items-start justify-between border-b border-gray-100 pb-5">
                <div className="space-y-1.5 text-left">
                  {selectedClient.plate && (
                    <div className="inline-flex items-center gap-1.5 bg-slate-900 text-white font-mono px-2 py-0.5 rounded text-xxs font-bold uppercase tracking-wider mb-1">
                      {selectedClient.plate}
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-black text-gray-950">{selectedClient.name}</h2>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                      selectedClient.clientType === 'Professionnel' 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : 'bg-green-50 text-green-700 border-green-200'
                    }`}>
                      {selectedClient.clientType || 'Particulier'}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 text-xxs mt-2">
                    <a 
                      href={`tel:${selectedClient.phone}`}
                      className="flex items-center gap-1 text-gray-650 bg-gray-100 hover:bg-gray-200 p-1.5 px-2.5 rounded-lg border border-gray-205 font-bold"
                    >
                      <Phone size={11} className="text-blue-550" /> {selectedClient.phone}
                    </a>
                    {selectedClient.email && (
                      <a 
                        href={`mailto:${selectedClient.email}`}
                        className="flex items-center gap-1 text-gray-650 bg-gray-100 hover:bg-gray-200 p-1.5 px-2.5 rounded-lg border border-gray-205 font-bold"
                      >
                        <Mail size={11} className="text-indigo-500" /> {selectedClient.email}
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEditClick(selectedClient)}
                    className="p-2 border border-gray-200 hover:border-gray-400 text-gray-650 bg-white rounded-xl transition cursor-pointer text-xs flex items-center gap-1 font-bold"
                  >
                    <Edit size={13} /> Mettre à jour
                  </button>
                </div>
              </div>

              {/* Vehicle & Address cards panel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2.5">
                  <Car className="text-blue-500 bg-blue-50 p-1 rounded-lg shrink-0" size={24} />
                  <div>
                    <span className="text-xxs text-gray-400 uppercase font-black tracking-wider block">Fiche Véhicule</span>
                    <span className="font-bold text-xs text-gray-900 mt-1 block">{selectedClient.vehicle || 'Non renseigné'}</span>
                    <span className="text-xxs text-gray-500">{selectedClient.plate ? `Matricule : ${selectedClient.plate}` : 'Sans immatriculation'}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2.5">
                  <MapPin className="text-red-500 bg-red-50 p-1 rounded-lg shrink-0" size={24} />
                  <div>
                    <span className="text-xxs text-gray-400 uppercase font-black tracking-wider block">Lieu d'Intervention</span>
                    <span className="text-xxs text-gray-900 font-bold leading-tight mt-1 block line-clamp-2">{selectedClient.address || 'Adresse non spécifiée'}</span>
                  </div>
                </div>
              </div>

              {/* Actions Rapides client */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-left">💼 GESTION DESIGN COMMERCIALE ({selectedClient.name})</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setBuilderItems([]);
                      setDocDiscount(0);
                      setDocDate(new Date().toISOString().split('T')[0]);
                      setDocExpiryDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                      setDocVehicleBrand('');
                      setDocVehicleModel('');
                      setDocVehicleRegistration(selectedClient.plate || '');
                      setDocVehicleMileage('');
                      setDocPublicNotes('');
                      setDocPrivateNotes('');
                      setShowQuoteModal(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer text-center"
                  >
                    <Plus size={14} /> Nouveau Devis (PDF)
                  </button>
                  <button
                    onClick={() => {
                      setBuilderItems([]);
                      setDocDiscount(0);
                      setDocDate(new Date().toISOString().split('T')[0]);
                      setDocDueDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                      setDocVehicleBrand('');
                      setDocVehicleModel('');
                      setDocVehicleRegistration(selectedClient.plate || '');
                      setDocVehicleMileage('');
                      setDocPublicNotes('');
                      setDocPrivateNotes('');
                      setShowInvoiceModal(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer text-center"
                  >
                    <Plus size={14} /> Nouvelle Facture (PDF)
                  </button>
                </div>
              </div>

              {/* Sub history split lists: Invoices & Interventions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                
                {/* Interventions */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-xs text-gray-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-50 pb-2">
                    <History size={13} />
                    Suivi Interventions ({clientInterventions.length})
                  </h3>

                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {clientInterventions.length === 0 ? (
                      <p className="text-xxs text-gray-400">Aucun rendez-vous historique.</p>
                    ) : (
                      clientInterventions.map(inter => (
                        <div key={inter.id} className="p-2.5 bg-gray-50/75 rounded-lg border border-gray-150 relative text-xxs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-gray-900 uppercase">{inter.type}</span>
                            <span className={`px-1.5 py-0.2 rounded font-bold uppercase shrink-0 text-scale scale-90 ${
                              inter.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {inter.status === 'Completed' ? 'Terminé' : 'En attente'}
                            </span>
                          </div>
                          <p className="text-gray-550 leading-normal line-clamp-2 mt-0.5 font-sans">"{inter.description}"</p>
                          <div className="text-xxs font-mono text-gray-400 mt-1 flex justify-between">
                            <span>Le {inter.date} à {inter.time}</span>
                            <span className="font-extrabold text-slate-800">{inter.priceEstimated} {currency}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Invoices */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-xs text-gray-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-50 pb-2">
                    <FileText size={13} />
                    Suivi Paiements ({clientInvoices.length})
                  </h3>

                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {clientInvoices.length === 0 ? (
                      <p className="text-xxs text-gray-400">Aucune facture enregistrée.</p>
                    ) : (
                      clientInvoices.map(inv => (
                        <div key={inv.id} className="p-2.5 bg-gray-50/75 rounded-lg border border-gray-150 text-xxs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-mono font-bold text-gray-900">{inv.invoiceNumber}</span>
                            <span className={`px-1.5 py-0.2 rounded font-bold uppercase shrink-0 text-scale scale-95 ${
                              inv.status === 'Paid' ? 'bg-green-105 text-green-900 bg-green-100' : 'bg-red-105 text-red-955 bg-red-100'
                            }`}>
                              {inv.status === 'Paid' ? 'Payée' : 'Impayée'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xxs font-sans text-gray-500 mt-1.5">
                            <span>Émis : {inv.date}</span>
                            <span className="font-bold text-gray-900 font-mono text-xs">{inv.total.toFixed(2)} {currency}</span>
                          </div>
                          
                          {(inv.vehicleBrand || inv.vehicleModel || inv.vehicleRegistration || inv.vehicleMileage) && (
                            <div className="mt-1.5 text-[9px] text-gray-650 bg-white border border-gray-150 px-1.5 py-0.5 rounded inline-flex gap-1.5 flex-wrap font-sans">
                              🚘 <span className="font-bold text-gray-805">Véhicule :</span> 
                              {inv.vehicleBrand && <span>{inv.vehicleBrand}</span>}
                              {inv.vehicleModel && <span>{inv.vehicleModel}</span>}
                              {inv.vehicleRegistration && <span className="font-mono bg-gray-100 px-1 rounded text-slate-700">{inv.vehicleRegistration}</span>}
                              {inv.vehicleMileage && <span>({inv.vehicleMileage} km)</span>}
                            </div>
                          )}

                          {inv.publicNotes && (
                            <p className="text-[9px] text-blue-650 italic bg-blue-50/50 p-1 px-1.5 rounded-md mt-1 border border-blue-50">
                              <span className="font-extrabold not-italic">📝 Note publique:</span> {inv.publicNotes}
                            </p>
                          )}
                          {inv.privateNotes && (
                            <p className="text-[9px] text-rose-650 italic bg-rose-50/50 p-1 px-1.5 rounded-md mt-1 border border-rose-100">
                              <span className="font-extrabold not-italic">🔒 Note privée app:</span> {inv.privateNotes}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Devis list section */}
              <div className="border-t border-gray-150 pt-5 space-y-3 text-left">
                <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center justify-between border-b border-gray-50 pb-2">
                  <span className="flex items-center gap-1.5 font-bold">
                    <FileText size={13} className="text-amber-500" />
                    Proposition de Devis client ({quotes.filter(q => q.clientId === selectedClient.id).length})
                  </span>
                </h3>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {quotes.filter(q => q.clientId === selectedClient.id).length === 0 ? (
                    <p className="text-xxs text-gray-400 font-sans">Aucun devis adressé à ce client.</p>
                  ) : (
                    quotes.filter(q => q.clientId === selectedClient.id).map(quote => (
                      <div key={quote.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-gray-900">{quote.quoteNumber}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              quote.status === 'Accepted'
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : quote.status === 'Rejected'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : 'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}>
                              {quote.status === 'Accepted' ? 'Accordé' : quote.status === 'Rejected' ? 'Refusé' : 'En attente'}
                            </span>
                            {quote.invoiceId && (
                              <span className="bg-slate-900 border border-slate-900 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded">
                                Facturé ({invoices.find(i => i.id === quote.invoiceId)?.invoiceNumber || 'FACT-2026'})
                              </span>
                            )}
                          </div>
                          <p className="font-sans text-xxs text-gray-550 block">
                            Créé le {quote.date} • Valide jusqu'au {quote.validUntil}
                          </p>
                          <div className="text-xxs text-slate-700">
                            {quote.items.length} positions • Total HT: {quote.items.reduce((acc, c) => acc + (c.quantity*c.unitPrice), 0).toFixed(2)} {currency} • <span className="font-bold text-slate-900 leading-normal">Total TTC: {quote.total.toFixed(2)} {currency}</span>
                          </div>
                          
                          {(quote.vehicleBrand || quote.vehicleModel || quote.vehicleRegistration || quote.vehicleMileage) && (
                            <div className="mt-1 text-[10px] text-gray-650 bg-white border border-gray-150 px-2 py-1 rounded inline-flex gap-2 flex-wrap font-sans">
                              🚘 <span className="font-bold text-gray-800">Véhicule :</span> 
                              {quote.vehicleBrand && <span>{quote.vehicleBrand}</span>}
                              {quote.vehicleModel && <span>{quote.vehicleModel}</span>}
                              {quote.vehicleRegistration && <span className="font-mono bg-gray-100 px-1 rounded text-slate-700">{quote.vehicleRegistration}</span>}
                              {quote.vehicleMileage && <span>({quote.vehicleMileage} km)</span>}
                            </div>
                          )}

                          {quote.publicNotes && (
                            <p className="text-[10px] text-blue-600 italic bg-blue-50/50 p-1 px-2 rounded-md mt-1 border border-blue-50">
                              <span className="font-extrabold not-italic">📝 Note publique:</span> {quote.publicNotes}
                            </p>
                          )}
                          {quote.privateNotes && (
                            <p className="text-[10px] text-rose-600 italic bg-rose-50/50 p-1 px-2 rounded-md mt-1 border border-rose-100">
                              <span className="font-extrabold not-italic">🔒 Note privée app:</span> {quote.privateNotes}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => generateQuotePDF(quote)}
                            className="bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 font-bold text-xxs py-1.5 px-2.5 rounded-lg cursor-pointer flex items-center gap-1.5 font-sans"
                            title="Imprimer le PDF Devis"
                          >
                            <FileText size={11} /> Devis
                          </button>

                          <button
                            type="button"
                            onClick={() => generateDeliveryNotePDF(quote)}
                            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xxs py-1.5 px-2.5 rounded-lg cursor-pointer flex items-center gap-1.5 font-sans"
                            title="Imprimer le Bon de Livraison (BL)"
                          >
                            <FileText size={11} /> BL
                          </button>

                          {quote.status === 'Pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateQuoteStatus(quote.id, 'Accepted');
                                  onConvertQuoteToInvoice(quote.id);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xxs py-1.5 px-3 rounded-lg shadow-xxs cursor-pointer font-sans"
                              >
                                Accepter & Facturer
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateQuoteStatus(quote.id, 'Rejected')}
                                className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 font-bold text-xxs py-1.5 px-3 rounded-lg cursor-pointer font-sans"
                              >
                                Refuser
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Communication Logs */}
              <div className="border-t border-gray-100 pt-5 space-y-3">
                <h3 className="font-extrabold text-xs text-gray-950 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare size={13} />
                  Journal des Moqueries & Relances ({clientReminders.length})
                </h3>

                <div className="space-y-2.5 max-h-[120px] overflow-y-auto pr-1">
                  {clientReminders.length === 0 ? (
                    <p className="text-xxs text-gray-400">Aucune relance directe effectuée.</p>
                  ) : (
                    clientReminders.map(log => (
                      <div key={log.id} className="text-xxs flex items-start gap-2 bg-slate-50 border border-slate-100 p-2 rounded-lg">
                        <span className={`p-1 rounded font-extrabold text-white text-scale scale-90 mt-0.5 ${
                          log.type === 'SMS' ? 'bg-blue-600' : 'bg-indigo-650 bg-indigo-650'
                        }`}>
                          {log.type}
                        </span>
                        
                        <div className="flex-1 space-y-0.5">
                          <div className="flex justify-between text-gray-400">
                            <span>Pour : {log.recipient}</span>
                            <span>{log.date}</span>
                          </div>
                          {log.subject && <div className="font-bold text-gray-800">Sujet : {log.subject}</div>}
                          <p className="text-gray-600 line-clamp-1 italic">"{log.content}"</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl text-gray-400">
              Sélectionnez un client dans le carnet d'adresses.
            </div>
          )}
        </div>

      </div>

      {/* MODAL A: Add client form */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 border border-gray-100 shadow-2xl relative space-y-4">
            <button onClick={() => setShowAddModal(false)} className="absolute right-4 top-4 text-gray-400"><X size={18} /></button>
            <h3 className="font-extrabold text-gray-950 text-base">Enregistrer un Nouveau Client</h3>
            
            <form onSubmit={handleAddSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Nom Complet du Client *</label>
                  <input
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Jean Paul Dupont"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Immatriculation Véhicule (Optionnelle)</label>
                  <input
                    type="text" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    placeholder="Ex: FH-384-DF"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Numéro de Téléphone *</label>
                  <input
                    type="text" required value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: +33 6 12 34 56 78"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Adresse Email (Optionnelle)</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: dupont@gmail.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Marque & Modèle du Véhicule (Optionnel)</label>
                <input
                  type="text" value={vehicle} onChange={(e) => setVehicle(e.target.value)}
                  placeholder="Ex: Renault scenic II 1.9 dCi"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Adresse d'intervention récurrente (Optionnelle)</label>
                <input
                  type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: 14 Rue des Lilas, 94100 Saint-Maur"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2 outline-none"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="block text-xs font-bold text-gray-700">Type de Client *</label>
                <select
                  value={clientType}
                  onChange={(e) => setClientType(e.target.value as 'Particulier' | 'Professionnel')}
                  className="w-full bg-gray-55/75 bg-slate-50 border border-gray-200 rounded-lg text-xs p-2 outline-none font-sans"
                >
                  <option value="Particulier">Particulier (Individuel)</option>
                  <option value="Professionnel">Professionnel (Société / Flotte)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Créer la Fiche Client
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL B: Edit client form */}
      {showEditModal && selectedClient && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 border border-gray-100 shadow-2xl relative space-y-4">
            <button onClick={() => setShowEditModal(false)} className="absolute right-4 top-4 text-gray-400"><X size={18} /></button>
            <h3 className="font-extrabold text-gray-950 text-base">Modifier la fiche client</h3>
            
            <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Nom Complet *</label>
                  <input
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Immatriculation</label>
                  <input
                    type="text" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Numéro de Téléphone *</label>
                  <input
                    type="text" required value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Adresse Email</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-55/75 bg-slate-50 border border-gray-200 rounded-lg text-xs p-2"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Véhicule (Optionnel)</label>
                <input
                  type="text" value={vehicle} onChange={(e) => setVehicle(e.target.value)}
                  className="w-full bg-gray-55/75 bg-slate-50 border border-gray-200 rounded-lg text-xs p-2"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Adresse d'intervention (Optionnelle)</label>
                <input
                  type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-gray-55/75 bg-slate-50 border border-gray-200 rounded-lg text-xs p-2"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="block text-xs font-bold text-gray-700">Type de Client *</label>
                <select
                  value={clientType}
                  onChange={(e) => setClientType(e.target.value as 'Particulier' | 'Professionnel')}
                  className="w-full bg-gray-55/75 bg-slate-50 border border-gray-200 rounded-lg text-xs p-2 outline-none font-sans"
                >
                  <option value="Particulier">Particulier (Individuel)</option>
                  <option value="Professionnel">Professionnel (Société / Flotte)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Enregistrer les Modifications
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL C: SEND REMINDER (SMS or EMAIL) with customized fields */}
      {showReminderModal && selectedClient && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 border border-gray-100 shadow-2xl relative space-y-4">
            <button onClick={() => setShowReminderModal(false)} className="absolute right-4 top-4 text-gray-400"><X size={18} /></button>
            
            <div className="space-y-1 border-b border-gray-50 pb-3">
              <h3 className="font-extrabold text-gray-950 text-base flex items-center gap-2">
                <Send size={16} className="text-blue-600" />
                Envoyer un Rappel Atelier Itinérant
              </h3>
              <p className="text-xxs text-gray-500">Pour : {selectedClient.name} ({reminderType === 'SMS' ? selectedClient.phone : selectedClient.email})</p>
            </div>

            <form onSubmit={handleSendReminderSubmit} className="space-y-4 text-left">
              
              {/* Type toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReminderType('SMS');
                    updateReminderTemplate(reminderTemplate, selectedClient, 'SMS');
                  }}
                  className={`flex-1 py-1.8 rounded-lg text-xs font-bold text-center border cursor-pointer ${
                    reminderType === 'SMS' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 text-gray-550 border-gray-150'
                  }`}
                >
                  Message SMS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReminderType('Email');
                    updateReminderTemplate(reminderTemplate, selectedClient, 'Email');
                  }}
                  className={`flex-1 py-1.8 rounded-lg text-xs font-bold text-center border cursor-pointer ${
                    reminderType === 'Email' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 text-gray-550 border-gray-150'
                  }`}
                >
                  Courrier Électronique (Email)
                </button>
              </div>

              {/* Template selector */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Choisir un modèle de message rapide</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => updateReminderTemplate('RDV', selectedClient, reminderType)}
                    className={`py-1.5 px-1 bg-gray-50 hover:bg-gray-100 rounded-lg border text-xxs font-bold text-center cursor-pointer ${
                      reminderTemplate === 'RDV' ? 'border-blue-500 text-blue-700 bg-blue-50/20' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    📅 Rappel Intervention
                  </button>
                  <button
                    type="button"
                    onClick={() => updateReminderTemplate('UNPAID', selectedClient, reminderType)}
                    className={`py-1.5 px-1 bg-gray-50 hover:bg-gray-100 rounded-lg border text-xxs font-bold text-center cursor-pointer ${
                      reminderTemplate === 'UNPAID' ? 'border-red-500 text-red-700 bg-red-50/20' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    💳 Facture Impayée
                  </button>
                  <button
                    type="button"
                    onClick={() => updateReminderTemplate('WELCOME', selectedClient, reminderType)}
                    className={`py-1.5 px-1 bg-gray-50 hover:bg-gray-100 rounded-lg border text-xxs font-bold text-center cursor-pointer ${
                      reminderTemplate === 'WELCOME' ? 'border-green-500 text-green-700 bg-green-50/20' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    👋 Fiche Atelier Créée
                  </button>
                </div>
              </div>

              {/* Email subject if Email */}
              {reminderType === 'Email' && (
                <div className="space-y-1 animate-fade-in">
                  <label className="block text-xs font-bold text-gray-700">Objet de l'Email</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg text-xs p-2 outline-none font-medium"
                  />
                </div>
              )}

              {/* Main composition text area */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Contenu du message (modifiable)</label>
                <textarea
                  rows={6}
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-3 focus:ring-1 focus:ring-blue-500 outline-none font-sans leading-relaxed text-gray-800"
                />
              </div>

              {/* Dispatch Action status footer */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send size={13} />
                  Envoyer & Documenter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL C: Create Quote (Nouveau Devis) */}
      {showQuoteModal && selectedClient && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 border border-gray-100 shadow-2xl relative space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <button 
              type="button" 
              onClick={() => {
                setShowQuoteModal(false);
                setBuilderItems([]);
              }} 
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-650 cursor-pointer"
            >
              <X size={18} />
            </button>
            
            <div className="text-left border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-gray-950 text-base">Éditer une Proposition de Devis commercial</h3>
              <p className="text-xxs text-gray-500 mt-0.5">Destinataire : <span className="font-bold text-gray-800">{selectedClient.name}</span> {selectedClient.vehicle ? `(${selectedClient.vehicle})` : ''}</p>
            </div>

            <form onSubmit={handleAddQuoteSubmit} className="space-y-4 text-left">
              
              {/* Document configurations */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-150">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400">Date d'émission</label>
                  <input
                    type="date"
                    required
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400">Date de validité</label>
                  <input
                    type="date"
                    required
                    value={docExpiryDate}
                    onChange={(e) => setDocExpiryDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400">Taux de TVA (%)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={docTaxRate}
                    onChange={(e) => setDocTaxRate(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400">Remise globale (%)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={docDiscount}
                    onChange={(e) => setDocDiscount(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Vehicle detailed info at document creation */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">🚗 INFORMATIONS SPÉCIFIQUES DU VÉHICULE (SUR CE DEVIS)</span>
                
                {selectedClient.vehicle && (
                  <p className="text-[10px] text-gray-500 italic mt-[-4px]">
                    Note : Le véhicule principal renseigné sur la fiche client est : <span className="font-bold text-slate-700">{selectedClient.vehicle}</span>
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1 text-left">
                    <label className="block text-[10px] font-black text-gray-400 uppercase">Marque</label>
                    <input
                      type="text"
                      placeholder="Ex: Peugeot"
                      value={docVehicleBrand}
                      onChange={(e) => setDocVehicleBrand(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-sans"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="block text-[10px] font-black text-gray-400 uppercase">Modèle</label>
                    <input
                      type="text"
                      placeholder="Ex: 208"
                      value={docVehicleModel}
                      onChange={(e) => setDocVehicleModel(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-sans"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="block text-[10px] font-black text-gray-400 uppercase">Immatriculation</label>
                    <input
                      type="text"
                      placeholder="Ex: 12345-A-6"
                      value={docVehicleRegistration}
                      onChange={(e) => setDocVehicleRegistration(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-sans"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="block text-[10px] font-black text-gray-400 uppercase">Kilométrage</label>
                    <input
                      type="text"
                      placeholder="Ex: 142000"
                      value={docVehicleMileage}
                      onChange={(e) => setDocVehicleMileage(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Double Notes: Public & Private Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/50 p-3.5 border border-slate-100 rounded-xl text-left">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">📝 NOTE PUBLIQUE (S'affiche sur le PDF Devis)</span>
                  <textarea
                    rows={2.5}
                    placeholder="Ex: Garantie de 6 mois sur les pièces installées..."
                    value={docPublicNotes}
                    onChange={(e) => setDocPublicNotes(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-sans resize-none"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block font-sans">🔒 NOTE PRIVÉE (Visible uniquement sur l'app)</span>
                  <textarea
                    rows={2.5}
                    placeholder="Ex: Client très pointilleux, a demandé de faire attention aux jantes..."
                    value={docPrivateNotes}
                    onChange={(e) => setDocPrivateNotes(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-sans resize-none"
                  />
                </div>
              </div>

              {/* Rows entry builder */}
              <div className="border border-gray-150 rounded-xl p-3.5 space-y-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">🛠️ AJOUTER UNE LIGNE AU DEVIS</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-amber-50/10 p-3 rounded-lg border border-amber-100">
                  
                  {/* Service Or Part selector */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="block text-xxs font-bold text-gray-600">Catégorie</label>
                    <div className="flex bg-white p-0.5 rounded-lg border border-gray-205">
                      <button
                        type="button"
                        onClick={() => {
                          setRowType('Service');
                          setRowServiceName('');
                          setRowPartId('');
                          setRowPrice(0);
                        }}
                        className={`flex-1 py-1 rounded-md text-xxs font-black transition cursor-pointer text-center ${
                          rowType === 'Service' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-500'
                        }`}
                      >
                        Service
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRowType('Part');
                          setRowServiceName('');
                          setRowPartId('');
                          setRowPrice(0);
                        }}
                        className={`flex-1 py-1 rounded-md text-xxs font-black transition cursor-pointer text-center ${
                          rowType === 'Part' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-500'
                        }`}
                      >
                        Pièce stock
                      </button>
                    </div>
                  </div>

                  {/* Description input or dropdown selection */}
                  <div className="sm:col-span-4 space-y-1">
                    {rowType === 'Service' ? (
                      <>
                        <label className="block text-xxs font-bold text-gray-600">Prestation / Main d'œuvre</label>
                        <input
                          type="text"
                          value={rowServiceName}
                          onChange={(e) => setRowServiceName(e.target.value)}
                          placeholder="Ex: Forfait vidange + filtres"
                          className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-sans"
                        />
                      </>
                    ) : (
                      <>
                        <label className="block text-xxs font-bold text-gray-600">Sélectionner Pièce</label>
                        <select
                          value={rowPartId}
                          onChange={(e) => handleBuilderPartSelect(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-sans"
                        >
                          <option value="">-- Choisir --</option>
                          {stock.map(item => (
                            <option key={item.id} value={item.id}>{item.name} ({item.quantity} dispo)</option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xxs font-bold text-gray-600">Qté</label>
                    <input
                      type="number"
                      min={1}
                      value={rowQty}
                      onChange={(e) => setRowQty(Number(e.target.value))}
                      className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-mono"
                    />
                  </div>

                  {/* Price */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xxs font-bold text-gray-600">Prix public ({currency})</label>
                    <input
                      type="number"
                      min={0}
                      value={rowPrice}
                      onChange={(e) => setRowPrice(Number(e.target.value))}
                      className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-mono"
                    />
                  </div>

                  {/* Button to add row list */}
                  <div className="sm:col-span-1">
                    <button
                      type="button"
                      onClick={handleAddBuilderItem}
                      className="w-full p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center justify-center cursor-pointer transition font-bold text-xs"
                      title="Ajouter au devis"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                </div>
              </div>

              {/* Items loaded in basket */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">📋 DÉTAIL DES RECOLTES ET PRESTATIONS ({builderItems.length})</span>
                
                {builderItems.length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-dashed border-gray-200 rounded-xl text-center text-xxs text-gray-400 font-sans">
                    Aucune prestation ajoutée. Remplissez le formulaire ci-dessus pour composer votre devis.
                  </div>
                ) : (
                  <div className="border border-gray-150 rounded-xl divide-y divide-gray-150 overflow-hidden bg-white max-h-[160px] overflow-y-auto">
                    {builderItems.map((item, idx) => (
                      <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-xxs font-sans">
                        <div className="text-left">
                          <p className="font-bold text-gray-900 leading-normal">{item.name}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{item.type === 'Service' ? 'Main d\'œuvre' : 'Pièce d\'inventaire'}</p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 font-mono">
                          <span className="text-gray-550">{item.quantity} x {item.unitPrice.toFixed(2)} {currency}</span>
                          <span className="font-extrabold text-gray-900 text-xs text-right min-w-[70px]">{(item.quantity * item.unitPrice).toFixed(2)} {currency}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBuilderItem(item.id)}
                            className="text-red-500 hover:text-red-700 p-1 bg-red-50 hover:bg-red-100 rounded cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subtotal parameters cards */}
              <div className="bg-slate-50 border border-gray-150 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-left space-y-0.5 text-xxs text-gray-550">
                  <p>Sous-total HT : <span className="font-mono font-bold text-gray-800">{calculateBuilderTotalHT().toFixed(2)} {currency}</span></p>
                  {docDiscount > 0 && <p>Remise ({docDiscount}%) : <span className="font-mono font-bold text-red-600">-{ (calculateBuilderTotalHT() * (docDiscount / 100)).toFixed(2) } {currency}</span></p>}
                  <p>Montant TVA ({docTaxRate}%) : <span className="font-mono font-bold text-gray-800">{ ( (calculateBuilderTotalHT() * (1 - docDiscount/100)) * (docTaxRate / 100) ).toFixed(2) } {currency}</span></p>
                </div>

                <div className="text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-200">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Net d'imposition à Payer</p>
                  <p className="text-xl font-mono font-black text-amber-600 mt-1">{calculateBuilderTotalTTC().toFixed(2)} {currency}</p>
                </div>
              </div>

              {/* Toggle option for Bon de Livraison */}
              <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50/40 border border-emerald-100/80 rounded-xl text-left">
                <input
                  type="checkbox"
                  id="generateBLOnQuoteCreation"
                  checked={generateBLOnQuoteCreation}
                  onChange={(e) => setGenerateBLOnQuoteCreation(e.target.checked)}
                  className="h-4.5 w-4.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
                <label htmlFor="generateBLOnQuoteCreation" className="text-xxs font-bold text-slate-700 cursor-pointer select-none">
                  Générer et télécharger également le <span className="text-emerald-600 font-black">Bon de livraison (BL) physique</span> associé
                </label>
              </div>

              {/* Primary action controls */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuoteModal(false);
                    setBuilderItems([]);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <FileText size={14} /> Enregistrer & Imprimer PDF devis
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL D: Create Invoice (Nouvelle Facture) */}
      {showInvoiceModal && selectedClient && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 border border-gray-100 shadow-2xl relative space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <button 
              type="button" 
              onClick={() => {
                setShowInvoiceModal(false);
                setBuilderItems([]);
              }} 
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-650 cursor-pointer"
            >
              <X size={18} />
            </button>
            
            <div className="text-left border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-gray-950 text-base">Émettre une Facture de règlement</h3>
              <p className="text-xxs text-gray-500 mt-0.5">Destinataire : <span className="font-bold text-gray-800">{selectedClient.name}</span> {selectedClient.vehicle ? `(${selectedClient.vehicle})` : ''}</p>
            </div>

            <form onSubmit={handleAddInvoiceSubmit} className="space-y-4 text-left">
              
              {/* Document configurations */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-150">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400">Date d'émission</label>
                  <input
                    type="date"
                    required
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400">Échéance de paiement</label>
                  <input
                    type="date"
                    required
                    value={docDueDate}
                    onChange={(e) => setDocDueDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400">Taux de TVA (%)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={docTaxRate}
                    onChange={(e) => setDocTaxRate(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400">Remise globale (%)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={docDiscount}
                    onChange={(e) => setDocDiscount(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Vehicle detailed info at document creation */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">🚗 INFORMATIONS SPÉCIFIQUES DU VÉHICULE (SUR CETTE FACTURE)</span>
                
                {selectedClient.vehicle && (
                  <p className="text-[10px] text-gray-500 italic mt-[-4px]">
                    Note : Le véhicule principal renseigné sur la fiche client est : <span className="font-bold text-slate-700">{selectedClient.vehicle}</span>
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1 text-left">
                    <label className="block text-[10px] font-black text-gray-400 uppercase">Marque</label>
                    <input
                      type="text"
                      placeholder="Ex: Peugeot"
                      value={docVehicleBrand}
                      onChange={(e) => setDocVehicleBrand(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-sans"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="block text-[10px] font-black text-gray-400 uppercase">Modèle</label>
                    <input
                      type="text"
                      placeholder="Ex: 208"
                      value={docVehicleModel}
                      onChange={(e) => setDocVehicleModel(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-sans"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="block text-[10px] font-black text-gray-400 uppercase">Immatriculation</label>
                    <input
                      type="text"
                      placeholder="Ex: 12345-A-6"
                      value={docVehicleRegistration}
                      onChange={(e) => setDocVehicleRegistration(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-sans"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="block text-[10px] font-black text-gray-400 uppercase">Kilométrage</label>
                    <input
                      type="text"
                      placeholder="Ex: 142000"
                      value={docVehicleMileage}
                      onChange={(e) => setDocVehicleMileage(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Double Notes: Public & Private Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/50 p-3.5 border border-slate-100 rounded-xl text-left">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">📝 NOTE PUBLIQUE (S'affiche sur le PDF Facture)</span>
                  <textarea
                    rows={2.5}
                    placeholder="Ex: Garantie de 6 mois sur les pièces installées..."
                    value={docPublicNotes}
                    onChange={(e) => setDocPublicNotes(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-sans resize-none"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block font-sans">🔒 NOTE PRIVÉE (Visible uniquement sur l'app)</span>
                  <textarea
                    rows={2.5}
                    placeholder="Ex: Client très pointilleux, a demandé de faire attention aux jantes..."
                    value={docPrivateNotes}
                    onChange={(e) => setDocPrivateNotes(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-sans resize-none"
                  />
                </div>
              </div>

              {/* Rows entry builder */}
              <div className="border border-gray-150 rounded-xl p-3.5 space-y-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">🛠️ AJOUTER UNE LIGNE À LA FACTURE</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-emerald-50/10 p-3 rounded-lg border border-emerald-100">
                  
                  {/* Service Or Part selector */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="block text-xxs font-bold text-gray-600">Catégorie</label>
                    <div className="flex bg-white p-0.5 rounded-lg border border-gray-205">
                      <button
                        type="button"
                        onClick={() => {
                          setRowType('Service');
                          setRowServiceName('');
                          setRowPartId('');
                          setRowPrice(0);
                        }}
                        className={`flex-1 py-1 rounded-md text-xxs font-black transition cursor-pointer text-center ${
                          rowType === 'Service' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500'
                        }`}
                      >
                        Service
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRowType('Part');
                          setRowServiceName('');
                          setRowPartId('');
                          setRowPrice(0);
                        }}
                        className={`flex-1 py-1 rounded-md text-xxs font-black transition cursor-pointer text-center ${
                          rowType === 'Part' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500'
                        }`}
                      >
                        Pièce stock
                      </button>
                    </div>
                  </div>

                  {/* Description input or dropdown selection */}
                  <div className="sm:col-span-4 space-y-1">
                    {rowType === 'Service' ? (
                      <>
                        <label className="block text-xxs font-bold text-gray-600">Prestation / Main d'œuvre</label>
                        <input
                          type="text"
                          value={rowServiceName}
                          onChange={(e) => setRowServiceName(e.target.value)}
                          placeholder="Ex: Forfait vidange + filtres"
                          className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-sans"
                        />
                      </>
                    ) : (
                      <>
                        <label className="block text-xxs font-bold text-gray-600">Sélectionner Pièce</label>
                        <select
                          value={rowPartId}
                          onChange={(e) => handleBuilderPartSelect(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-sans"
                        >
                          <option value="">-- Choisir --</option>
                          {stock.map(item => (
                            <option key={item.id} value={item.id}>{item.name} ({item.quantity} dispo)</option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xxs font-bold text-gray-600">Qté</label>
                    <input
                      type="number"
                      min={1}
                      value={rowQty}
                      onChange={(e) => setRowQty(Number(e.target.value))}
                      className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-mono"
                    />
                  </div>

                  {/* Price */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xxs font-bold text-gray-600">Prix public ({currency})</label>
                    <input
                      type="number"
                      min={0}
                      value={rowPrice}
                      onChange={(e) => setRowPrice(Number(e.target.value))}
                      className="w-full bg-white border border-gray-200 rounded-lg text-xs p-1.8 outline-none font-mono"
                    />
                  </div>

                  {/* Button to add row list */}
                  <div className="sm:col-span-1">
                    <button
                      type="button"
                      onClick={handleAddBuilderItem}
                      className="w-full p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center cursor-pointer transition font-bold text-xs"
                      title="Ajouter au devis"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                </div>
              </div>

              {/* Items loaded in basket */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">📋 DÉTAIL DES RECOLTES ET PRESTATIONS ({builderItems.length})</span>
                
                {builderItems.length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-dashed border-gray-200 rounded-xl text-center text-xxs text-gray-400 font-sans">
                    Aucune prestation ajoutée. Remplissez le formulaire ci-dessus pour composer votre facture.
                  </div>
                ) : (
                  <div className="border border-gray-150 rounded-xl divide-y divide-gray-150 overflow-hidden bg-white max-h-[160px] overflow-y-auto">
                    {builderItems.map((item, idx) => (
                      <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-xxs font-sans">
                        <div className="text-left">
                          <p className="font-bold text-gray-900 leading-normal">{item.name}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{item.type === 'Service' ? 'Main d\'œuvre' : 'Pièce d\'inventaire'}</p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 font-mono">
                          <span className="text-gray-550">{item.quantity} x {item.unitPrice.toFixed(2)} {currency}</span>
                          <span className="font-extrabold text-gray-900 text-xs text-right min-w-[70px]">{(item.quantity * item.unitPrice).toFixed(2)} {currency}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBuilderItem(item.id)}
                            className="text-red-500 hover:text-red-700 p-1 bg-red-50 hover:bg-red-100 rounded cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subtotal parameters cards */}
              <div className="bg-slate-50 border border-gray-150 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-left space-y-0.5 text-xxs text-gray-550">
                  <p>Sous-total HT : <span className="font-mono font-bold text-gray-800">{calculateBuilderTotalHT().toFixed(2)} {currency}</span></p>
                  {docDiscount > 0 && <p>Remise ({docDiscount}%) : <span className="font-mono font-bold text-red-600">-{ (calculateBuilderTotalHT() * (docDiscount / 100)).toFixed(2) } {currency}</span></p>}
                  <p>Montant TVA ({docTaxRate}%) : <span className="font-mono font-bold text-gray-800">{ ( (calculateBuilderTotalHT() * (1 - docDiscount/100)) * (docTaxRate / 100) ).toFixed(2) } {currency}</span></p>
                </div>

                <div className="text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-200">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Net d'imposition à Payer</p>
                  <p className="text-xl font-mono font-black text-emerald-600 mt-1">{calculateBuilderTotalTTC().toFixed(2)} {currency}</p>
                </div>
              </div>

              {/* Toggle option for Bon de Livraison */}
              <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50/40 border border-emerald-100/80 rounded-xl text-left">
                <input
                  type="checkbox"
                  id="generateBLOnInvoiceCreation"
                  checked={generateBLOnInvoiceCreation}
                  onChange={(e) => setGenerateBLOnInvoiceCreation(e.target.checked)}
                  className="h-4.5 w-4.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
                <label htmlFor="generateBLOnInvoiceCreation" className="text-xxs font-bold text-slate-700 cursor-pointer select-none">
                  Générer et télécharger également le <span className="text-emerald-600 font-black">Bon de livraison (BL) physique</span> associé
                </label>
              </div>

              {/* Primary action controls */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => {
                    setShowInvoiceModal(false);
                    setBuilderItems([]);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <FileText size={14} /> Émettre, valider & Imprimer
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
