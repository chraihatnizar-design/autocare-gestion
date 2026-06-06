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
import { Client, Invoice, Intervention, ReminderLog, AppSettings } from '../types';

interface ClientManagerProps {
  clients: Client[];
  invoices: Invoice[];
  interventions: Intervention[];
  reminderLogs: ReminderLog[];
  onAddClient: (client: Omit<Client, 'id'>) => void;
  onUpdateClient: (client: Client) => void;
  onSendReminder: (reminder: Omit<ReminderLog, 'id' | 'date' | 'status'>) => void;
  settings?: AppSettings;
}

export default function ClientManager({
  clients,
  invoices,
  interventions,
  reminderLogs,
  onAddClient,
  onUpdateClient,
  onSendReminder,
  settings
}: ClientManagerProps) {
  const currency = settings?.currency || 'DH';

  // State
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

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
    setShowEditModal(true);
  };

  // Submit new client
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddClient({ name, phone, email, vehicle, plate, address });
    // Reset fields
    setName('');
    setPhone('');
    setEmail('');
    setVehicle('');
    setPlate('');
    setAddress('');
    setShowAddModal(false);
  };

  // Submit edit client
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    onUpdateClient({
      id: selectedClient.id,
      name, phone, email, vehicle, plate, address
    });
    // Update local selection
    setSelectedClient({ id: selectedClient.id, name, phone, email, vehicle, plate, address });
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
                    <h3 className="font-bold text-xs text-gray-950">{client.name}</h3>
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
                  <h2 className="text-lg font-black text-gray-950">{selectedClient.name}</h2>
                  
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
                        </div>
                      ))
                    )}
                  </div>
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

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
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

    </div>
  );
}
