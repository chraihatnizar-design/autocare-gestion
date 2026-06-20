import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  FileText, 
  DollarSign, 
  Calendar, 
  AlertTriangle,
  UserCheck,
  Tag,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Clock,
  ExternalLink,
  Image,
  Upload,
  X,
  Eye,
  FileImage
} from 'lucide-react';
import { Supplier, SupplierOrder, AppSettings, PaymentMethod } from '../types';

interface SupplierManagerProps {
  suppliers: Supplier[];
  supplierOrders: SupplierOrder[];
  onAddSupplier: (newSup: Omit<Supplier, 'id'>) => void;
  onUpdateSupplier: (updatedSup: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onAddSupplierOrder: (newOrder: Omit<SupplierOrder, 'id' | 'orderNumber'>) => void;
  onUpdateSupplierOrderStatus: (
    id: string, 
    status: 'Paid' | 'Unpaid' | 'Pending', 
    method: PaymentMethod, 
    paymentDate?: string,
    paidAmount?: number,
    paymentProofImage?: string
  ) => void;
  onDeleteSupplierOrder: (id: string) => void;
  settings: AppSettings;
}

export default function SupplierManager({
  suppliers,
  supplierOrders,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onAddSupplierOrder,
  onUpdateSupplierOrderStatus,
  onDeleteSupplierOrder,
  settings
}: SupplierManagerProps) {
  const currency = settings?.currency || 'DH';

  // Section tabs: 'orders' | 'suppliers'
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'suppliers'>('orders');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal / Form States
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Payment Confirmation Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<SupplierOrder | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Transfer');
  const [payDate, setPayDate] = useState<string>('');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payProofImage, setPayProofImage] = useState<string>('');

  // Global Image Fullscreen Preview State
  const [imgPreviewUrl, setImgPreviewUrl] = useState<string | null>(null);

  // Supplier Form Data
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    category: 'Pièces détachées'
  });

  // Order Form Data
  const [orderFormData, setOrderFormData] = useState({
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    details: '',
    priceHT: 0,
    taxRate: settings?.defaultTaxRate || 20,
    paymentStatus: 'Unpaid' as 'Paid' | 'Unpaid' | 'Pending',
    paymentMethod: 'Transfer' as PaymentMethod,
    paymentDate: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paidAmount: 0,
    paymentProofImage: ''
  });

  // Computed Values
  const totalOrdersAmount = supplierOrders.reduce((sum, order) => sum + order.totalTTC, 0);
  const paidOrdersAmount = supplierOrders
    .filter(order => order.paymentStatus === 'Paid')
    .reduce((sum, order) => sum + (order.paidAmount ?? order.totalTTC), 0);
  const unpaidOrdersAmount = supplierOrders
    .filter(order => order.paymentStatus !== 'Paid')
    .reduce((sum, order) => sum + order.totalTTC, 0);

  // File to Base64 helper
  const handleFileChangeHelper = (file: File | undefined, callback: (base64: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        callback(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      category: 'Pièces détachées'
    });
    setShowSupplierModal(true);
  };

  const handleOpenEditSupplier = (sup: Supplier) => {
    setEditingSupplier(sup);
    setSupplierFormData({
      name: sup.name,
      phone: sup.phone,
      email: sup.email,
      address: sup.address,
      category: sup.category
    });
    setShowSupplierModal(true);
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierFormData.name.trim()) return;

    if (editingSupplier) {
      onUpdateSupplier({
        ...editingSupplier,
        ...supplierFormData
      });
    } else {
      onAddSupplier(supplierFormData);
    }
    setShowSupplierModal(false);
  };

  const handleOpenAddOrder = () => {
    if (suppliers.length === 0) {
      alert("Veuillez d'abord créer au moins un fournisseur dans l'onglet 'Fiches Fournisseurs'.");
      setActiveSubTab('suppliers');
      return;
    }
    const defaultTotalTTC = 0;
    setOrderFormData({
      supplierId: suppliers[0].id,
      orderDate: new Date().toISOString().split('T')[0],
      details: '',
      priceHT: 0,
      taxRate: settings?.defaultTaxRate || 20,
      paymentStatus: 'Unpaid',
      paymentMethod: 'Transfer',
      paymentDate: '',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paidAmount: 0,
      paymentProofImage: ''
    });
    setShowOrderModal(true);
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderFormData.supplierId || !orderFormData.details.trim() || orderFormData.priceHT <= 0) {
      alert("Veuillez remplir correctement les détails de la commande ainsi que le prix.");
      return;
    }

    const selectedSup = suppliers.find(s => s.id === orderFormData.supplierId);
    if (!selectedSup) return;

    const totalTTC = orderFormData.priceHT * (1 + orderFormData.taxRate / 100);

    onAddSupplierOrder({
      supplierId: orderFormData.supplierId,
      supplierName: selectedSup.name,
      orderDate: orderFormData.orderDate,
      details: orderFormData.details,
      priceHT: orderFormData.priceHT,
      taxRate: orderFormData.taxRate,
      totalTTC: totalTTC,
      paymentStatus: orderFormData.paymentStatus,
      paymentMethod: orderFormData.paymentMethod,
      paymentDate: orderFormData.paymentStatus === 'Paid' ? (orderFormData.paymentDate || orderFormData.orderDate) : undefined,
      dueDate: orderFormData.dueDate,
      paidAmount: orderFormData.paymentStatus === 'Paid' ? (orderFormData.paidAmount || totalTTC) : undefined,
      paymentProofImage: orderFormData.paymentStatus === 'Paid' ? orderFormData.paymentProofImage : undefined
    });

    setShowOrderModal(false);
  };

  const handleTriggerPaymentModal = (order: SupplierOrder) => {
    setPaymentOrder(order);
    setPayMethod(order.paymentMethod || 'Transfer');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayAmount(order.totalTTC);
    setPayProofImage(order.paymentProofImage || '');
    setShowPaymentModal(true);
  };

  const handleConfirmOrderPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentOrder) return;
    
    onUpdateSupplierOrderStatus(
      paymentOrder.id,
      'Paid',
      payMethod,
      payDate,
      payAmount,
      payProofImage || undefined
    );
    
    setShowPaymentModal(false);
    setPaymentOrder(null);
  };

  // Filter lists based on states
  const filteredOrders = supplierOrders.filter(order => {
    const matchesSearch = order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredSuppliers = suppliers.filter(sup => {
    return sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           sup.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
           sup.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      
      {/* Title block with beautiful gradient look */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xxs">
        <div className="text-left">
          <h2 className="text-xl font-display font-black tracking-tight text-slate-900 uppercase">
            Gestion des Fournisseurs
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gérez vos approvisionnements, commandes de pièces & outillages, factures d'achat et échéanciers de règlement.
          </p>
        </div>
        <div className="flex gap-2">
          {activeSubTab === 'orders' ? (
            <button
              onClick={handleOpenAddOrder}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-slate-800"
            >
              <Plus size={14} /> Nouvelle Commande d'Achat
            </button>
          ) : (
            <button
              onClick={handleOpenAddSupplier}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-slate-800"
            >
              <Plus size={14} /> Créer un Fournisseur
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-xxs text-left flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
            <Tag size={18} />
          </div>
          <div>
            <span className="text-xxs uppercase font-black tracking-wider text-slate-400">Total Achats TTC</span>
            <p className="text-lg font-black font-mono text-slate-900 mt-0.5">{totalOrdersAmount.toFixed(2)} {currency}</p>
            <span className="text-[10px] text-slate-500 block leading-none mt-1">{supplierOrders.length} commandes enregistrées</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-xxs text-left flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            <CheckCircle size={18} />
          </div>
          <div>
            <span className="text-xxs uppercase font-black tracking-wider text-slate-400">Achats Réglés</span>
            <p className="text-lg font-black font-mono text-slate-900 mt-0.5">{paidOrdersAmount.toFixed(2)} {currency}</p>
            <span className="text-[10px] text-emerald-600 block leading-none mt-1">Approvisionnement payé</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-205 bg-amber-50/5 shadow-xxs text-left flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-xxs uppercase font-black tracking-wider text-slate-400">À Régler / En Attente</span>
            <p className="text-lg font-black font-mono text-amber-600 mt-0.5">{unpaidOrdersAmount.toFixed(2)} {currency}</p>
            <span className="text-[10px] text-amber-600 font-medium block leading-none mt-1">Échéances de paiement actives</span>
          </div>
        </div>
      </div>

      {/* Internal Ribbon tabs switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveSubTab('orders'); setSearchTerm(''); }}
          className={`px-5 py-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeSubTab === 'orders'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText size={15} /> Commandes Fournisseurs ({supplierOrders.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('suppliers'); setSearchTerm(''); }}
          className={`px-5 py-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeSubTab === 'suppliers'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck size={15} /> Fiches Fournisseurs ({suppliers.length})
        </button>
      </div>

      {/* Search and filter controls bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={activeSubTab === 'orders' ? "Rechercher une commande, pièce, référence..." : "Rechercher un fournisseur..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-250 rounded-xl text-xs font-semibold focus:border-slate-400 outline-none shadow-xxs text-left"
          />
        </div>
        
        {activeSubTab === 'orders' && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-250 rounded-xl px-4 py-2 text-xs font-semibold focus:border-slate-400 outline-none cursor-pointer"
          >
            <option value="all">Tous les règlements</option>
            <option value="Paid">Payées</option>
            <option value="Unpaid">Non Réglées</option>
            <option value="Pending">En Cours / Attente</option>
          </select>
        )}
      </div>

      {/* --- CONTENT TABS PANELS --- */}

      {/* 1. Suppliers Orders Tab View */}
      {activeSubTab === 'orders' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xxs">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <FileText size={40} className="mx-auto text-slate-300" />
              <p className="font-semibold text-xs">Aucune commande d'achat répertoriée</p>
              <p className="text-[11px] text-slate-400">Cliquez sur "Nouvelle Commande d'Achat" pour répertorier une facture fournisseur.</p>
            </div>
          ) : (
            <div className="overflow-x-auto text-left">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5 pl-5">N° Commande</th>
                    <th className="p-3.5">Fournisseur</th>
                    <th className="p-3.5">Détail des Achats</th>
                    <th className="p-3.5">Dates Commande / Due</th>
                    <th className="p-3.5 text-right">Prix HT</th>
                    <th className="p-3.5 text-right">Total TTC</th>
                    <th className="p-3.5 text-center">Règlement</th>
                    <th className="p-3.5 text-right pr-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredOrders.map(order => {
                    const isOverdue = order.paymentStatus !== 'Paid' && new Date(order.dueDate) < new Date();
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/50">
                        <td className="p-3.5 pl-5 font-bold font-mono text-slate-900">
                          {order.orderNumber}
                        </td>
                        <td className="p-3.5">
                          <span className="font-black text-slate-800">{order.supplierName}</span>
                          <span className="block text-[10px] text-slate-400 font-normal">Fournisseur lié</span>
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <div className="line-clamp-2 text-slate-650 font-normal text-[11px]" title={order.details}>
                            {order.details}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] space-y-0.5">
                          <p className="text-slate-800 flex items-center gap-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase w-7 inline-block">Cmd:</span>
                            {order.orderDate}
                          </p>
                          <p className={`flex items-center gap-1 ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                            <span className="text-[9px] font-bold text-slate-400 uppercase w-7 inline-block">Éch:</span>
                            {order.dueDate}
                            {isOverdue && <AlertTriangle size={10} className="text-rose-500" />}
                          </p>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-700">
                          {order.priceHT.toFixed(2)} {currency}
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-slate-900 text-sm">
                          {order.totalTTC.toFixed(2)} {currency}
                          <span className="block text-[9px] font-mono font-normal text-slate-400 italic">TVA {order.taxRate}%</span>
                        </td>
                        <td className="p-3.5 text-center">
                          {order.paymentStatus === 'Paid' ? (
                            <div className="inline-flex flex-col items-center space-y-1">
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-100 flex items-center gap-1">
                                Réglé ✓
                              </span>
                              <span className="text-[10px] font-mono text-slate-800 font-bold">
                                {order.paidAmount !== undefined ? `${order.paidAmount.toFixed(2)} ${currency}` : `${order.totalTTC.toFixed(2)} ${currency}`}
                              </span>
                              <span className="text-[9px] font-semibold text-slate-500" title={order.paymentMethod}>
                                {order.paymentMethod === 'Check' ? 'Chèque' : order.paymentMethod === 'Bill' ? 'Effet' : order.paymentMethod === 'Transfer' ? 'Virement' : order.paymentMethod === 'Cash' ? 'Espèces' : 'Carte'} {order.paymentDate && `- ${order.paymentDate}`}
                              </span>
                              {order.paymentProofImage && (
                                <button
                                  type="button"
                                  onClick={() => setImgPreviewUrl(order.paymentProofImage || null)}
                                  className="mt-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 hover:bg-blue-105 rounded text-[9px] font-bold transition flex items-center gap-0.5 cursor-pointer border border-blue-100"
                                >
                                  <Image size={10} /> Voir preuve
                                </button>
                              )}
                            </div>
                          ) : order.paymentStatus === 'Pending' ? (
                            <div className="inline-flex flex-col items-center space-y-1">
                              <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-[10px] font-bold rounded-md border border-sky-100">
                                En cours...
                              </span>
                              <button
                                onClick={() => handleTriggerPaymentModal(order)}
                                className="mt-1 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold rounded transition flex items-center gap-0.5 cursor-pointer"
                              >
                                Enregistrer paiement
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex flex-col items-center">
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-md border border-rose-100 animate-pulse">
                                À Payer
                              </span>
                              {isOverdue && (
                                <span className="text-[9px] text-rose-600 font-black tracking-tighter uppercase mt-0.5 bg-rose-50/50 px-1 rounded">
                                  En retard !
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-right pr-5">
                          <div className="flex justify-end items-center gap-1.5 font-sans">
                            {order.paymentStatus !== 'Paid' && (
                              <button
                                onClick={() => handleTriggerPaymentModal(order)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Marquer comme réglé"
                              >
                                Payer
                              </button>
                            )}
                            <button
                              onClick={() => {
                                // if (confirm("Confirmez-vous la suppression de cette commande d'achat ?")) {
                                  onDeleteSupplierOrder(order.id);
                                // }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Supprimer la commande"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. Suppliers Contact Directory Tab View */}
      {activeSubTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.length === 0 ? (
            <div className="bg-white border border-slate-205 p-12 rounded-2xl text-center text-slate-400 md:col-span-2 lg:col-span-3">
              <UserCheck size={40} className="mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-xs">Aucun fiche de fournisseur enregistrée</p>
              <p className="text-[11px] text-slate-400">Ajoutez des partenaires d'approvisionnement en pièces & services pour passer commande.</p>
              <button
                onClick={handleOpenAddSupplier}
                className="mt-4 px-3.5 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-xl transition inline-flex items-center gap-1 cursor-pointer hover:bg-slate-800"
              >
                <Plus size={12} /> Ajouter un nouveau fournisseur
              </button>
            </div>
          ) : (
            filteredSuppliers.map(sup => {
              const ordersCount = supplierOrders.filter(o => o.supplierId === sup.id).length;
              const totalSpent = supplierOrders
                .filter(o => o.supplierId === sup.id)
                .reduce((sum, o) => sum + o.totalTTC, 0);

              return (
                <div key={sup.id} className="bg-white border border-slate-205 rounded-2xl p-5 shadow-xxs text-left relative flex flex-col justify-between hover:border-slate-350 transition-all">
                  
                  {/* Category Badge & Actions */}
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-black uppercase rounded-md tracking-wider">
                      {sup.category}
                    </span>
                    <div className="flex items-center gap-1 select-none">
                      <button
                        onClick={() => handleOpenEditSupplier(sup)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                        title="Modifier la fiche"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => {
                          // if (confirm(`Êtes-vous sûr de vouloir supprimer le fournisseur ${sup.name} ?`)) {
                            onDeleteSupplier(sup.id);
                          // }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Supprimer la fiche"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Supplier Brand Details */}
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900 text-sm tracking-tight">{sup.name}</h4>
                    
                    <div className="space-y-1 text-slate-500 text-[11px] font-semibold">
                      <p className="flex items-center gap-2">
                        <Phone size={11} className="text-slate-400 shrink-0" />
                        <span>{sup.phone}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail size={11} className="text-slate-400 shrink-0" />
                        <span className="truncate">{sup.email}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin size={11} className="text-slate-400 shrink-0" />
                        <span className="truncate">{sup.address}</span>
                      </p>
                    </div>
                  </div>

                  {/* Orders Summary Footprint */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Volume lié :</span>
                    <div className="text-right">
                      <span className="font-bold text-slate-850 block font-mono">{totalSpent.toFixed(2)} {currency}</span>
                      <span className="text-[10px] text-slate-400 block">{ordersCount} factures d'achat</span>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* --- MODALS FORMS DIALOGS CONTAINER --- */}

      {/* A. Supplier Create / Edit Dialogue */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-left shadow-2xl border border-slate-100 relative animate-scale-up space-y-4">
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">
              {editingSupplier ? `Modifier : ${editingSupplier.name}` : "Ajouter un Fournisseur Partner"}
            </h3>
            
            <form onSubmit={handleSupplierSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Raison sociale / Nom complet</label>
                <input
                  type="text"
                  required
                  placeholder="ex : AutoDoc Pro France"
                  value={supplierFormData.name}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase font-bold">Téléphone du contact</label>
                  <input
                    type="tel"
                    placeholder="ex : +33 6 56 78 90"
                    value={supplierFormData.phone}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-slate-800 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Adresse mail commerciale</label>
                  <input
                    type="email"
                    placeholder="ex : commercial@autodoc.fr"
                    value={supplierFormData.email}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Catégorie d'approvisonnement</label>
                <select
                  value={supplierFormData.category}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, category: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-slate-850 outline-none"
                >
                  <option value="Pièces détachées">⚙️ Pièces détachées & Accessoires</option>
                  <option value="Lubrifiants & Fluides">🧪 Lubrifiants, Huiles & Fluides</option>
                  <option value="Outillage & Équipements">🛠️ Outillage & Équipements d'Atelier</option>
                  <option value="Carburant">⛽ Carburant & Énergie</option>
                  <option value="Services professionnels">💼 Services Externes (Logiciels, Assurances)</option>
                  <option value="Inconnu / Autre">📦 Autre catégorie d'achats</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Adresse Postale / Siège social</label>
                <input
                  type="text"
                  placeholder="ex : 12 rue des pièces de rechanges, Paris"
                  value={supplierFormData.address}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition"
                >
                  {editingSupplier ? "Enregistrer les modifications" : "Enregistrer le fournisseur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. Order Add Create Dialogue */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-left shadow-2xl border border-slate-100 relative animate-scale-up space-y-4">
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">
              Saisir une commande d'achat fournisseur
            </h3>
            
            <form onSubmit={handleOrderSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Sélectionner le Fournisseur</label>
                  <select
                    required
                    value={orderFormData.supplierId}
                    onChange={(e) => setOrderFormData({ ...orderFormData, supplierId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-slate-800 outline-none"
                  >
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name} ({sup.category})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Date d'enregistrement</label>
                  <input
                    type="date"
                    required
                    value={orderFormData.orderDate}
                    onChange={(e) => setOrderFormData({ ...orderFormData, orderDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Détail des achats / Pièces commandées</label>
                <textarea
                  required
                  rows={2}
                  placeholder="ex: 10x Filtre à air Purflux, 2x Amortisseurs avant Clio 3..."
                  value={orderFormData.details}
                  onChange={(e) => setOrderFormData({ ...orderFormData, details: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-slate-800 outline-none min-h-[50px] max-h-[120px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Prix Total HT</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={orderFormData.priceHT || ''}
                    onChange={(e) => {
                      const ht = parseFloat(e.target.value) || 0;
                      setOrderFormData({ ...orderFormData, priceHT: ht });
                    }}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold font-mono focus:border-slate-800 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">TVA Applicable %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={orderFormData.taxRate}
                    onChange={(e) => setOrderFormData({ ...orderFormData, taxRate: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold font-mono focus:border-slate-800 outline-none"
                  />
                </div>

                <div className="space-y-1 bg-slate-50 p-1 px-2.5 rounded-lg border border-slate-150">
                  <span className="text-[9px] uppercase font-black text-slate-400 block leading-tight">Total TTC calculé</span>
                  <span className="text-normal font-black font-mono text-slate-900 block mt-1">
                    {(orderFormData.priceHT * (1 + orderFormData.taxRate / 100)).toFixed(2)} {currency}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Statut réglement initial</label>
                  <select
                    value={orderFormData.paymentStatus}
                    onChange={(e) => setOrderFormData({ ...orderFormData, paymentStatus: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-slate-850 outline-none"
                  >
                    <option value="Unpaid">❌ Non Réglée (Facture ouverte)</option>
                    <option value="Paid">✓ Réglée (Payée au fournisseur)</option>
                    <option value="Pending">⏳ En attente (Enregistrée, paiement envoyé)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Moyen de paiement favorisé</label>
                  <select
                    value={orderFormData.paymentMethod}
                    onChange={(e) => setOrderFormData({ ...orderFormData, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-slate-850 outline-none"
                  >
                    <option value="Transfer">Virement Bancaire (Transfer)</option>
                    <option value="Card">Carte Bancaire (Card)</option>
                    <option value="Cash">Espèces (Cash)</option>
                    <option value="Check">Chèque (Check)</option>
                    <option value="Bill">Effet de commerce (Bill)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Date Limite de Paiement (Échéance)</label>
                  <input
                    type="date"
                    required
                    value={orderFormData.dueDate}
                    onChange={(e) => setOrderFormData({ ...orderFormData, dueDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-slate-800 outline-none"
                  />
                </div>

                {orderFormData.paymentStatus === 'Paid' && (
                  <div className="space-y-1 animate-fade-in">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Date Effective de Règlement</label>
                    <input
                      type="date"
                      required
                      value={orderFormData.paymentDate || orderFormData.orderDate}
                      onChange={(e) => setOrderFormData({ ...orderFormData, paymentDate: e.target.value })}
                      className="w-full px-3 py-1.5 border border-emerald-300 bg-emerald-50/10 rounded-lg text-xs font-semibold focus:border-slate-800 outline-none"
                    />
                  </div>
                )}
              </div>

              {orderFormData.paymentStatus === 'Paid' && (
                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3.5 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-450 uppercase font-bold">Montant Réglé ({currency})</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={orderFormData.paidAmount || (orderFormData.priceHT * (1 + orderFormData.taxRate / 100))}
                      onChange={(e) => setOrderFormData({ ...orderFormData, paidAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border border-emerald-300 rounded-lg text-xs font-semibold font-mono focus:border-emerald-500 outline-none text-emerald-800"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black text-slate-450 uppercase block font-bold">Justificatif (Chèque, Effet, Virement, etc.)</label>
                    <input
                      type="file"
                      id="upload-add-order-proof"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileChangeHelper(file, (b64) => {
                            setOrderFormData(prev => ({ ...prev, paymentProofImage: b64 }));
                          });
                        }
                      }}
                      className="hidden"
                    />
                    {orderFormData.paymentProofImage ? (
                      <div className="flex items-center justify-between gap-1.5 mt-1 bg-emerald-50 border border-emerald-250 rounded p-1.5">
                        <span className="text-[10px] font-bold text-emerald-800 truncate">Image attachée ✓</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setImgPreviewUrl(orderFormData.paymentProofImage)}
                            className="text-blue-600 hover:text-blue-800 font-bold text-[10px]"
                            title="Voir l'image"
                          >
                            Voir
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderFormData(prev => ({ ...prev, paymentProofImage: '' }))}
                            className="text-red-500 hover:text-red-700 font-bold text-[10px]"
                            title="Supprimer la preuve"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label 
                        htmlFor="upload-add-order-proof" 
                        className="mt-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold cursor-pointer transition inline-flex items-center gap-1 shrink-0 border border-slate-200"
                      >
                        <Upload size={12} /> Télécharger l'image
                      </label>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition"
                >
                  Enregistrer l'achat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. Payment Settlement Modal */}
      {showPaymentModal && paymentOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-left shadow-2xl border border-slate-100 relative animate-scale-up space-y-4">
            <div>
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">
                Enregistrer le Règlement
              </h3>
              <p className="text-[11px] text-slate-500">
                Commande n° {paymentOrder.orderNumber} - {paymentOrder.supplierName} ({paymentOrder.totalTTC.toFixed(2)} {currency})
              </p>
            </div>
            
            <form onSubmit={handleConfirmOrderPayment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase block font-bold">Moyen de paiement</label>
                <select
                  required
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:border-slate-800 outline-none"
                >
                  <option value="Transfer">🏦 Virement Bancaire</option>
                  <option value="Check">🎫 Chèque Bancaire</option>
                  <option value="Bill">📄 Effet de commerce</option>
                  <option value="Cash">Espèces</option>
                  <option value="Card">Carte Bancaire</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase block font-bold">Montant du paiement ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={payAmount || ''}
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold font-mono focus:border-slate-800 outline-none block"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase block font-bold">Date de paiement</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:border-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Upload section for Check, Bill, or Transfer */}
              {(payMethod === 'Check' || payMethod === 'Bill' || payMethod === 'Transfer') && (
                <div className="space-y-2 border-t border-slate-100 pt-3 animate-fade-in text-left">
                  <span className="text-[10px] font-black text-slate-450 uppercase block font-bold">
                    {payMethod === 'Check' ? "Image du Chèque" : payMethod === 'Bill' ? "Image de l'effet de commerce" : "Image du justificatif de Virement"}
                  </span>
                  
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition relative">
                    {payProofImage ? (
                      <div className="w-full flex flex-col items-center space-y-2">
                        <img 
                          src={payProofImage} 
                          alt="Preuve" 
                          className="max-h-24 rounded-lg object-contain border border-slate-200"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setImgPreviewUrl(payProofImage)}
                            className="px-2 py-1 bg-slate-100 text-slate-750 text-[10px] font-bold rounded hover:bg-slate-200 transition pointer-events-auto"
                          >
                            Agrandir
                          </button>
                          <button
                            type="button"
                            onClick={() => setPayProofImage('')}
                            className="px-2 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold rounded hover:bg-rose-100 transition pointer-events-auto"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-slate-400 mb-1.5" size={20} />
                        <span className="text-[10px] text-slate-500 text-center font-medium block">
                          Glissez-déposez une image ou cliquez pour télécharger
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileChangeHelper(file, (b64) => setPayProofImage(b64));
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-105">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentOrder(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                >
                  Confirmer le Règlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* D. Fullscreen Image Box Lightbox Preview */}
      {imgPreviewUrl && (
        <div className="fixed inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 z-50 animate-fade-in">
          <button
            type="button"
            onClick={() => setImgPreviewUrl(null)}
            className="absolute top-4 right-4 p-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition cursor-pointer z-50"
            title="Fermer la prévisualisation"
          >
            <X size={20} />
          </button>
          
          <div className="max-w-4xl max-h-[80vh] w-full flex items-center justify-center z-10">
            <img 
              referrerPolicy="no-referrer"
              src={imgPreviewUrl} 
              alt="Preuve d'achat" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border-2 border-slate-700" 
            />
          </div>
          
          <div className="mt-4 text-center z-10">
            <p className="text-xs text-slate-450 font-sans font-medium">Justificatif de paiement enregistré</p>
            <button
              onClick={() => setImgPreviewUrl(null)}
              className="mt-2 text-white/80 hover:text-white hover:underline text-xs font-bold cursor-pointer"
            >
              Fermer la fenêtre
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
