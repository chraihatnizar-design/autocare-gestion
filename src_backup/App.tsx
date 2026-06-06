<h1 style={{color:'red'}}>VERSION TEST 2026 OK</h1>
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  LayoutDashboard, 
  Calendar, 
  Layers, 
  Users, 
  FileText, 
  MapPin, 
  ShieldAlert,
  Menu,
  X,
  Settings,
  TrendingUp,
  Truck,
  Receipt
} from 'lucide-react';

import { StockItem, Client, Intervention, Invoice, ReminderLog, StockTransaction, InvoiceStatus, PaymentMethod, InterventionStatus, AppSettings, AppUser, Supplier, SupplierOrder, MonthlyExpense, Quote } from './types';
import { 
  DEFAULT_STOCK, 
  DEFAULT_CLIENTS, 
  DEFAULT_INTERVENTIONS, 
  DEFAULT_INVOICES, 
  DEFAULT_TRANSACTIONS, 
  DEFAULT_REMINDERS,
  DEFAULT_SETTINGS,
  DEFAULT_USERS,
  DEFAULT_SUPPLIERS,
  DEFAULT_SUPPLIER_ORDERS,
  DEFAULT_EXPENSES
} from './data/defaultData';

// Modular Component Imports
import Dashboard from './components/Dashboard';
import StockManager from './components/StockManager';
import ClientManager from './components/ClientManager';
import InvoiceManager from './components/InvoiceManager';
import CalendarManager from './components/CalendarManager';
import SettingsManager from './components/SettingsManager';
import CommercialManager from './components/CommercialManager';
import SupplierManager from './components/SupplierManager';
import ExpenseManager from './components/ExpenseManager';
import Login from './components/Login';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Focus action links between views
  const [selectedInterventionForInvoice, setSelectedInterventionForInvoice] = useState<Intervention | null>(null);

  // States
  const [stock, setStock] = useState<StockItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);
  const [expenses, setExpenses] = useState<MonthlyExpense[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  // States of login and user management
  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('autocare_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('autocare_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // --- Handlers: User Accounts & Sessions ---
  const handleAddUser = (newUser: Omit<AppUser, 'id'>): { success: boolean; error?: string } => {
    const exists = users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase());
    if (exists) {
      return { success: false, error: "Ce nom d'utilisateur existe déjà. Veuillez en choisir un autre." };
    }

    if (newUser.role === 'coadmin') {
      const coadminCount = users.filter(u => u.role === 'coadmin').length;
      if (coadminCount >= 2) {
        return { success: false, error: "Limite de Co-Admins atteinte : Vous ne pouvez pas avoir plus de 2 Co-Admins simultanément." };
      }
    }

    const createdUser: AppUser = {
      ...newUser,
      id: 'user-' + Math.random().toString(36).substr(2, 9)
    };
    const updated = [...users, createdUser];
    setUsers(updated);
    localStorage.setItem('autocare_users', JSON.stringify(updated));
    return { success: true };
  };

  const handleDeleteUser = (id: string) => {
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    localStorage.setItem('autocare_users', JSON.stringify(updated));
  };

  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    localStorage.setItem('autocare_current_user', JSON.stringify(user));
    
    // Dynamically update default profile settings to match active logged in user
    const updatedSettings = {
      ...settings,
      userName: user.fullName,
      userRole: user.role === 'admin' 
        ? "Administrateur d'Atelier (Master)" 
        : user.role === 'coadmin' 
        ? "Co-Administrateur de l'Atelier" 
        : "Technicien Mécanicien"
    };
    setSettings(updatedSettings);
    localStorage.setItem('autocare_settings', JSON.stringify(updatedSettings));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('autocare_current_user');
  };

  // 1. Initial State Hydration with localstorage
  useEffect(() => {
    const savedStock = localStorage.getItem('autocare_stock');
    const savedClients = localStorage.getItem('autocare_clients');
    const savedInterventions = localStorage.getItem('autocare_interventions');
    const savedInvoices = localStorage.getItem('autocare_invoices');
    const savedTx = localStorage.getItem('autocare_transactions');
    const savedLogs = localStorage.getItem('autocare_reminders');
    const savedSettings = localStorage.getItem('autocare_settings');
    const savedSuppliers = localStorage.getItem('autocare_suppliers_list');
    const savedSupplierOrders = localStorage.getItem('autocare_supplier_orders_all');
    const savedExpenses = localStorage.getItem('autocare_expenses_all');
    const savedQuotes = localStorage.getItem('autocare_quotes');

    setStock(savedStock ? JSON.parse(savedStock) : DEFAULT_STOCK);
    setClients(savedClients ? JSON.parse(savedClients) : DEFAULT_CLIENTS);
    setInterventions(savedInterventions ? JSON.parse(savedInterventions) : DEFAULT_INTERVENTIONS);
    setInvoices(savedInvoices ? JSON.parse(savedInvoices) : DEFAULT_INVOICES);
    setTransactions(savedTx ? JSON.parse(savedTx) : DEFAULT_TRANSACTIONS);
    setReminderLogs(savedLogs ? JSON.parse(savedLogs) : DEFAULT_REMINDERS);
    setSuppliers(savedSuppliers ? JSON.parse(savedSuppliers) : DEFAULT_SUPPLIERS);
    setSupplierOrders(savedSupplierOrders ? JSON.parse(savedSupplierOrders) : DEFAULT_SUPPLIER_ORDERS);
    setExpenses(savedExpenses ? JSON.parse(savedExpenses) : DEFAULT_EXPENSES);
    setQuotes(savedQuotes ? JSON.parse(savedQuotes) : []);
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // 2. Synchronize persistence states
  const saveToLocalStorage = (key: string, data: any) => {
    const mappedKey = key.replace('meca_', 'autocare_');
    localStorage.setItem(mappedKey, JSON.stringify(data));
  };

  // --- Handlers: Settings ---
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveToLocalStorage('meca_settings', newSettings);
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    saveToLocalStorage('meca_settings', DEFAULT_SETTINGS);
  };

  // --- Handlers: Inventory (Stock) ---
  const handleAddStockItem = (newItem: Omit<StockItem, 'id'>) => {
    const createdItem: StockItem = {
      ...newItem,
      id: 'part-' + Math.random().toString(36).substr(2, 9)
    };
    const updated = [createdItem, ...stock];
    setStock(updated);
    saveToLocalStorage('meca_stock', updated);

    // Dynamic initial transaction
    const tx: StockTransaction = {
      id: 'tx-' + Math.random().toString(36).substr(2, 9),
      itemId: createdItem.id,
      itemName: createdItem.name,
      type: 'IN',
      quantity: createdItem.quantity,
      date: '2026-06-06',
      reason: 'Enregistrement initial du produit'
    };
    const updatedTx = [tx, ...transactions];
    setTransactions(updatedTx);
    saveToLocalStorage('meca_transactions', updatedTx);
  };

  const handleUpdateStockQuantity = (id: string, quantityChange: number, reason: string) => {
    const updated = stock.map(item => {
      if (item.id === id) {
        // Enforce boundary 0
        const finalQty = Math.max(0, item.quantity + quantityChange);
        
        // Log transaction movement
        const tx: StockTransaction = {
          id: 'tx-' + Math.random().toString(36).substr(2, 9),
          itemId: item.id,
          itemName: item.name,
          type: quantityChange >= 0 ? 'IN' : 'OUT',
          quantity: Math.abs(quantityChange),
          date: '2026-06-06',
          reason: reason
        };
        const updatedTx = [tx, ...transactions];
        setTransactions(updatedTx);
        saveToLocalStorage('meca_transactions', updatedTx);

        return { ...item, quantity: finalQty };
      }
      return item;
    });

    setStock(updated);
    saveToLocalStorage('meca_stock', updated);
  };

  const handleDeleteStockItem = (id: string) => {
    const updated = stock.filter(item => item.id !== id);
    setStock(updated);
    saveToLocalStorage('meca_stock', updated);
  };

  // --- Handlers: Clients ---
  const handleAddClient = (newClient: Omit<Client, 'id'>) => {
    const createdClient: Client = {
      ...newClient,
      id: 'client-' + Math.random().toString(36).substr(2, 9)
    };
    const updated = [createdClient, ...clients];
    setClients(updated);
    saveToLocalStorage('meca_clients', updated);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    const updated = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
    setClients(updated);
    saveToLocalStorage('meca_clients', updated);
  };

  // --- Handlers: Quotes / Devis (sequential numbered) ---
  const handleAddQuote = (newQuote: Omit<Quote, 'id' | 'quoteNumber' | 'status'>) => {
    const nextSeq = quotes.length + 1;
    const formattedSeq = nextSeq.toString().padStart(3, '0');
    const formattedQuoteNo = `DEVIS-2026-${formattedSeq}`;

    const createdQuote: Quote = {
      ...newQuote,
      id: 'qte-' + Math.random().toString(36).substr(2, 9),
      quoteNumber: formattedQuoteNo,
      status: 'Pending'
    };

    const updatedQuotes = [createdQuote, ...quotes];
    setQuotes(updatedQuotes);
    saveToLocalStorage('meca_quotes', updatedQuotes);
    return createdQuote;
  };

  const handleUpdateQuoteStatus = (quoteId: string, status: 'Pending' | 'Accepted' | 'Rejected') => {
    const updated = quotes.map(q => {
      if (q.id === quoteId) {
        return { ...q, status };
      }
      return q;
    });
    setQuotes(updated);
    saveToLocalStorage('meca_quotes', updated);
  };

  const handleConvertQuoteToInvoice = (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;

    // Check if progress or already converted
    if (quote.invoiceId) return;

    // Generate Invoice
    const nextSeq = invoices.length + 1;
    const formattedSeq = nextSeq.toString().padStart(3, '0');
    const formattedInvoiceNo = `FACT-2026-${formattedSeq}`;
    const invoiceId = 'inv-' + Math.random().toString(36).substr(2, 9);

    const createdInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber: formattedInvoiceNo,
      clientId: quote.clientId,
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      clientPhone: quote.clientPhone,
      clientVehicle: quote.clientVehicle,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days default
      items: quote.items,
      discount: quote.discount,
      taxRate: quote.taxRate,
      total: quote.total,
      status: 'Unpaid',
      paymentMethod: 'Pending',
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber
    };

    // Update quote status and link invoice
    const updatedQuotes = quotes.map(q => {
      if (q.id === quoteId) {
        return { ...q, status: 'Accepted' as const, invoiceId };
      }
      return q;
    });
    setQuotes(updatedQuotes);
    saveToLocalStorage('meca_quotes', updatedQuotes);

    // Save invoice
    const updatedInvoices = [createdInvoice, ...invoices];
    setInvoices(updatedInvoices);
    saveToLocalStorage('meca_invoices', updatedInvoices);

    // Stock deduction like in direct invoices
    let updatedStock = [...stock];
    let collectedTx = [...transactions];

    createdInvoice.items.forEach(item => {
      if (item.type === 'Part' && item.partId) {
        updatedStock = updatedStock.map(p => {
          if (p.id === item.partId) {
            const finalQty = Math.max(0, p.quantity - item.quantity);
            
            collectedTx.unshift({
              id: 'tx-' + Math.random().toString(36).substr(2, 9),
              itemId: p.id,
              itemName: p.name,
              type: 'OUT',
              quantity: item.quantity,
              date: createdInvoice.date,
              reason: `Automatique : Pose sur ${createdInvoice.clientVehicle} #${formattedInvoiceNo} (Devis accepté #${quote.quoteNumber})`
            });

            return { ...p, quantity: finalQty };
          }
          return p;
        });
      }
    });

    setStock(updatedStock);
    saveToLocalStorage('meca_stock', updatedStock);
    setTransactions(collectedTx);
    saveToLocalStorage('meca_transactions', collectedTx);
  };

  // --- Handlers: Invoices (sequential numbered) ---
  const handleAddInvoice = (newInvoice: Omit<Invoice, 'id' | 'invoiceNumber'>): Invoice => {
    // Generate sequential custom invoice number starting FACT-2026-004
    const nextSeq = invoices.length + 1;
    const formattedSeq = nextSeq.toString().padStart(3, '0');
    const formattedInvoiceNo = `FACT-2026-${formattedSeq}`;

    const createdInvoice: Invoice = {
      ...newInvoice,
      id: 'inv-' + Math.random().toString(36).substr(2, 9),
      invoiceNumber: formattedInvoiceNo
    };

    const updatedInvoices = [createdInvoice, ...invoices];
    setInvoices(updatedInvoices);
    saveToLocalStorage('meca_invoices', updatedInvoices);

    // AUTOMATED REAL-TIME INVENTORY TRACKING DISPATCHER as requested:
    // When invoice is created on-site, we cycle any component parts and decrease stock quantity
    const updatedStock = stock.map(part => {
      // Find if this part was used in the newly created invoice
      const invoiceUsage = createdInvoice.items.find(item => item.type === 'Part' && item.partId === part.id);
      if (invoiceUsage) {
        const finalQty = Math.max(0, part.quantity - invoiceUsage.quantity);

        // Record a dedicated automated transaction log
        const tx: StockTransaction = {
          id: 'tx-' + Math.random().toString(36).substr(2, 9),
          itemId: part.id,
          itemName: part.name,
          type: 'OUT',
          quantity: invoiceUsage.quantity,
          date: createdInvoice.date,
          reason: `Vente d'intervention - Facture #${formattedInvoiceNo}`
        };
        // Use a lazy approach, we will update transactions locally
        return { ...part, quantity: finalQty };
      }
      return part;
    });

    setStock(updatedStock);
    saveToLocalStorage('meca_stock', updatedStock);

    // Collect and update transactions state
    let collectedTx = [...transactions];
    createdInvoice.items.forEach(item => {
      if (item.type === 'Part' && item.partId) {
        const pRef = stock.find(p => p.id === item.partId);
        collectedTx.unshift({
          id: 'tx-' + Math.random().toString(36).substr(2, 9),
          itemId: item.partId,
          itemName: pRef ? pRef.name : item.name,
          type: 'OUT',
          quantity: item.quantity,
          date: createdInvoice.date,
          reason: `Automatique : Pose sur ${createdInvoice.clientVehicle} #${formattedInvoiceNo}`
        });
      }
    });
    setTransactions(collectedTx);
    saveToLocalStorage('meca_transactions', collectedTx);

    // Look if invoice was created from a scheduled intervention, we optionally mark intervention as completed
    if (createdInvoice.interventionId) {
      const updatedInterventions = interventions.map(inter => 
        inter.id === createdInvoice.interventionId ? { ...inter, status: 'Completed' as const } : inter
      );
      setInterventions(updatedInterventions);
      saveToLocalStorage('meca_interventions', updatedInterventions);
    }

    return createdInvoice;
  };

  const handleUpdateInvoiceStatus = (id: string, status: InvoiceStatus, method: PaymentMethod) => {
    const updated = invoices.map(inv => 
      inv.id === id ? { ...inv, status, paymentMethod: method, paymentDate: '2026-06-06' } : inv
    );
    setInvoices(updated);
    saveToLocalStorage('meca_invoices', updated);
  };

  // --- Handlers: Calendar Scheduling ---
  const handleAddIntervention = (newInter: Omit<Intervention, 'id'>) => {
    const createdInter: Intervention = {
      ...newInter,
      id: 'inter-' + Math.random().toString(36).substr(2, 9)
    };
    const updated = [createdInter, ...interventions];
    setInterventions(updated);
    saveToLocalStorage('meca_interventions', updated);
  };

  const handleUpdateInterventionStatus = (id: string, status: InterventionStatus) => {
    const updated = interventions.map(inter => 
      inter.id === id ? { ...inter, status } : inter
    );
    setInterventions(updated);
    saveToLocalStorage('meca_interventions', updated);
  };

  // --- Handlers: Reminders Logs ---
  const handleSendReminder = (newReminder: Omit<ReminderLog, 'id' | 'date' | 'status'>) => {
    const createdLog: ReminderLog = {
      ...newReminder,
      id: 'rem-' + Math.random().toString(36).substr(2, 9),
      date: '2026-06-06 10:28',
      status: 'Sent'
    };
    const updated = [createdLog, ...reminderLogs];
    setReminderLogs(updated);
    saveToLocalStorage('meca_reminders', updated);
  };

  // --- Handlers: Suppliers ---
  const handleAddSupplier = (newSup: Omit<Supplier, 'id'>) => {
    const created: Supplier = {
      ...newSup,
      id: 'sup-' + Math.random().toString(36).substr(2, 9)
    };
    const updated = [created, ...suppliers];
    setSuppliers(updated);
    saveToLocalStorage('meca_suppliers_list', updated);
  };

  const handleUpdateSupplier = (updatedSup: Supplier) => {
    const updated = suppliers.map(s => s.id === updatedSup.id ? updatedSup : s);
    setSuppliers(updated);
    saveToLocalStorage('meca_suppliers_list', updated);
  };

  const handleDeleteSupplier = (id: string) => {
    const updated = suppliers.filter(s => s.id !== id);
    setSuppliers(updated);
    saveToLocalStorage('meca_suppliers_list', updated);
  };

  // --- Handlers: Supplier Orders ---
  const handleAddSupplierOrder = (newOrder: Omit<SupplierOrder, 'id' | 'orderNumber'>) => {
    const nextSeq = supplierOrders.length + 1;
    const formattedSeq = nextSeq.toString().padStart(3, '0');
    const orderNumber = `CMD-FOURN-2026-${formattedSeq}`;

    const created: SupplierOrder = {
      ...newOrder,
      id: 'sup-ord-' + Math.random().toString(36).substr(2, 9),
      orderNumber
    };
    const updated = [created, ...supplierOrders];
    setSupplierOrders(updated);
    saveToLocalStorage('meca_supplier_orders_all', updated);
  };

  const handleUpdateSupplierOrderStatus = (
    id: string, 
    status: 'Paid' | 'Unpaid' | 'Pending', 
    method: PaymentMethod, 
    paymentDate?: string,
    paidAmount?: number,
    paymentProofImage?: string
  ) => {
    const updated = supplierOrders.map(o => 
      o.id === id ? { 
        ...o, 
        paymentStatus: status, 
        paymentMethod: method, 
        paymentDate: status === 'Paid' ? (paymentDate || '2026-06-06') : undefined,
        paidAmount: status === 'Paid' ? (paidAmount !== undefined ? paidAmount : o.totalTTC) : undefined,
        paymentProofImage: status === 'Paid' ? paymentProofImage : undefined
      } : o
    );
    setSupplierOrders(updated);
    saveToLocalStorage('meca_supplier_orders_all', updated);
  };

  const handleDeleteSupplierOrder = (id: string) => {
    const updated = supplierOrders.filter(o => o.id !== id);
    setSupplierOrders(updated);
    saveToLocalStorage('meca_supplier_orders_all', updated);
  };

  // --- Handlers: Monthly Expenses ---
  const handleAddExpense = (newExp: Omit<MonthlyExpense, 'id'>) => {
    const created: MonthlyExpense = {
      ...newExp,
      id: 'exp-' + Math.random().toString(36).substr(2, 9)
    };
    const updated = [created, ...expenses];
    setExpenses(updated);
    saveToLocalStorage('meca_expenses_all', updated);
  };

  const handleUpdateExpense = (updatedExp: MonthlyExpense) => {
    const updated = expenses.map(e => e.id === updatedExp.id ? updatedExp : e);
    setExpenses(updated);
    saveToLocalStorage('meca_expenses_all', updated);
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveToLocalStorage('meca_expenses_all', updated);
  };

  // Low stock alerts tracking count
  const criticalStockCount = stock.filter(item => item.quantity <= item.minThreshold).length;

  // Login Gate Security checks
  if (!currentUser) {
    return (
      <Login 
        users={users}
        onLoginSuccess={handleLoginSuccess}
        companyName={settings.companyName || "AUTOCARE gestion"}
        companyTagline={settings.companyTagline || "Gestion d'Atelier"}
        companyLogo={settings.companyLogo}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-105 selection:text-blue-900 antialiased">
      
      {/* Top Banner Branding */}
      <header className="h-16 bg-white border-b border-slate-250 flex items-center justify-between px-6 md:px-10 flex-shrink-0 relative z-30 shadow-xxs">
        <div className="flex items-center gap-3 animate-fade-in">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden transition select-none ${
              settings.companyLogo 
                ? 'bg-white border border-slate-200 hover:border-slate-400 p-0.5' 
                : 'bg-slate-900 text-white hover:bg-blue-600'
            }`}
          >
            {settings.companyLogo ? (
              <img 
                src={settings.companyLogo} 
                alt="Logo" 
                className="w-full h-full object-contain rounded"
              />
            ) : (
              <Wrench size={16} className="text-blue-500" />
            )}
          </button>
          <div className="text-left">
            <h1 className="text-base font-display font-black tracking-tight text-slate-800 leading-none">
              {settings.companyName || 'AUTOCARE gestion'}
            </h1>
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 mt-1 block">
              {settings.companyTagline || "Gestion d'Atelier"}
            </span>
          </div>
        </div>

        {/* Desktop Navigation Row */}
        <nav className="hidden lg:flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard size={14} /> Tableau de Bord
          </button>
          
          <button
            onClick={() => setActiveTab('planning')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'planning' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Calendar size={14} /> Calendrier/Planning
          </button>

          <button
            onClick={() => setActiveTab('inventaire')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-150 flex items-center gap-1.5 relative cursor-pointer ${
              activeTab === 'inventaire' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layers size={14} /> Stock & Scanner
            {criticalStockCount > 0 && (
              <span className="absolute -top-1 -right-1.5 px-1.5 py-0.2 bg-red-500 border border-white text-white text-[8px] font-black rounded-full">
                {criticalStockCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'clients' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users size={14} /> Fiches Clients
          </button>

          <button
            onClick={() => setActiveTab('factures')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'factures' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileText size={14} /> Factures / Paiements
          </button>

          <button
            onClick={() => setActiveTab('commercial')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'commercial' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <TrendingUp size={14} /> Commercial & Suivi
          </button>

          <button
            onClick={() => setActiveTab('fournisseurs')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'fournisseurs' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Truck size={14} /> Fournisseurs
          </button>

          <button
            onClick={() => setActiveTab('charges')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'charges' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Receipt size={14} /> Charges & Marges
          </button>

          <button
            onClick={() => setActiveTab('parametres')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'parametres' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Settings size={14} /> Paramètres
          </button>
        </nav>

        {/* User profile identifier (mock from Geometric Balance theme layout) */}
        <div className="hidden md:flex items-center gap-3 border-l border-slate-200 pl-6">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-extrabold font-display text-xs">
            {settings.userName ? settings.userName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'JD'}
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-slate-800 block line-clamp-1">{settings.userName || 'Julien Durand'}</span>
            <span className="text-[10px] text-slate-400 block line-clamp-1 leading-none">{settings.userRole || 'Mécanicien Itinérant'}</span>
          </div>
        </div>

        {/* Mobile menu toggle */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
        >
          {mobileMenuOpen ? <X size={22} className="text-slate-900" /> : <Menu size={22} className="text-slate-900" />}
        </button>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 p-4 space-y-1 relative z-20 shadow-lg text-left transition-all">
          <button
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
            className={`w-full p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 ${
              activeTab === 'dashboard' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard size={15} /> Tableau de Bord
          </button>
          
          <button
            onClick={() => { setActiveTab('planning'); setMobileMenuOpen(false); }}
            className={`w-full p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 ${
              activeTab === 'planning' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Calendar size={15} /> Calendrier/Planning
          </button>

          <button
            onClick={() => { setActiveTab('inventaire'); setMobileMenuOpen(false); }}
            className={`w-full p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 justify-between ${
              activeTab === 'inventaire' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2.5"><Layers size={15} /> Stock & Scanner</span>
            {criticalStockCount > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">
                {criticalStockCount} alertes
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('clients'); setMobileMenuOpen(false); }}
            className={`w-full p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 ${
              activeTab === 'clients' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Users size={15} /> Carnet fiches Clients
          </button>

          <button
            onClick={() => { setActiveTab('factures'); setMobileMenuOpen(false); }}
            className={`w-full p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 ${
              activeTab === 'factures' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FileText size={15} /> Factures & Paiements
          </button>

          <button
            onClick={() => { setActiveTab('commercial'); setMobileMenuOpen(false); }}
            className={`w-full p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 ${
              activeTab === 'commercial' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <TrendingUp size={15} /> Commercial & Suivi
          </button>

          <button
            onClick={() => { setActiveTab('fournisseurs'); setMobileMenuOpen(false); }}
            className={`w-full p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 ${
              activeTab === 'fournisseurs' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Truck size={15} /> Fournisseurs
          </button>

          <button
            onClick={() => { setActiveTab('charges'); setMobileMenuOpen(false); }}
            className={`w-full p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 ${
              activeTab === 'charges' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Receipt size={15} /> Charges & Marges
          </button>

          <button
            onClick={() => { setActiveTab('parametres'); setMobileMenuOpen(false); }}
            className={`w-full p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 ${
              activeTab === 'parametres' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Settings size={15} /> Paramètres de l'App
          </button>
        </div>
      )}

      {/* Main App Content Box Container */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-12">
        {activeTab === 'dashboard' && (
          <Dashboard
            stock={stock}
            clients={clients}
            interventions={interventions}
            invoices={invoices}
            setActiveTab={setActiveTab}
            setSelectedInterventionForInvoice={setSelectedInterventionForInvoice}
            settings={settings}
          />
        )}

        {activeTab === 'planning' && (
          <CalendarManager
            interventions={interventions}
            clients={clients}
            onAddIntervention={handleAddIntervention}
            onUpdateInterventionStatus={handleUpdateInterventionStatus}
            setSelectedInterventionForInvoice={setSelectedInterventionForInvoice}
            setActiveTab={setActiveTab}
            settings={settings}
          />
        )}

        {activeTab === 'inventaire' && (
          <StockManager
            stock={stock}
            transactions={transactions}
            onAddStockItem={handleAddStockItem}
            onUpdateStockQuantity={handleUpdateStockQuantity}
            onDeleteStockItem={handleDeleteStockItem}
            settings={settings}
          />
        )}

        {activeTab === 'clients' && (
          <ClientManager
            clients={clients}
            invoices={invoices}
            interventions={interventions}
            reminderLogs={reminderLogs}
            quotes={quotes}
            stock={stock}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onSendReminder={handleSendReminder}
            onAddQuote={handleAddQuote}
            onUpdateQuoteStatus={handleUpdateQuoteStatus}
            onConvertQuoteToInvoice={handleConvertQuoteToInvoice}
            onAddInvoice={handleAddInvoice}
            settings={settings}
          />
        )}

        {activeTab === 'factures' && (
          <InvoiceManager
            invoices={invoices}
            clients={clients}
            stock={stock}
            selectedInterventionForInvoice={selectedInterventionForInvoice}
            setSelectedInterventionForInvoice={setSelectedInterventionForInvoice}
            onAddInvoice={handleAddInvoice}
            onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
            settings={settings}
          />
        )}

        {activeTab === 'commercial' && (
          <CommercialManager
            invoices={invoices}
            settings={settings}
          />
        )}

        {activeTab === 'fournisseurs' && (
          <SupplierManager
            suppliers={suppliers}
            supplierOrders={supplierOrders}
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onAddSupplierOrder={handleAddSupplierOrder}
            onUpdateSupplierOrderStatus={handleUpdateSupplierOrderStatus}
            onDeleteSupplierOrder={handleDeleteSupplierOrder}
            settings={settings}
          />
        )}

        {activeTab === 'charges' && (
          <ExpenseManager
            expenses={expenses}
            supplierOrders={supplierOrders}
            invoices={invoices}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            settings={settings}
          />
        )}

        {activeTab === 'parametres' && (
          <SettingsManager
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetSettings={handleResetSettings}
            currentUser={currentUser}
            users={users}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Footer information section */}
      <footer className="bg-slate-905 border-t border-gray-200 mt-auto py-5 text-center text-xs text-gray-500 py-6">
        <p>© 2026 Atelier de Réparation Mécanique Itinérant. Toutes les fiches techniques sont préservées localement.</p>
        <p className="mt-1 text-[10px] text-gray-400">Simulation d'envoi de rappels emails par RFC template format direct.</p>
      </footer>

    </div>
  );
}
