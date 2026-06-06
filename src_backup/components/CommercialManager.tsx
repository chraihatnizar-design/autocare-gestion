import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Coins, 
  FileText, 
  PlusCircle, 
  MinusCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  Calendar,
  CheckCircle,
  HelpCircle,
  PiggyBank,
  Edit2,
  Printer
} from 'lucide-react';
import { Invoice, AppSettings } from '../types';

interface CommercialManagerProps {
  invoices: Invoice[];
  settings: AppSettings;
}

interface CashTransaction {
  id: string;
  date: string;
  label: string;
  type: 'IN' | 'OUT';
  amount: number;
  paymentMethod: 'Cash' | 'Check' | 'Bill';
  notes?: string;
}

export default function CommercialManager({ invoices, settings }: CommercialManagerProps) {
  const currency = settings.currency || '€';

  // 1. Load/Save Commercial Goal in localStorage
  const [commercialGoal, setCommercialGoal] = useState<number>(() => {
    const saved = localStorage.getItem('autocare_commercial_goal');
    return saved ? parseFloat(saved) : 10000;
  });

  const [showGoalInput, setShowGoalInput] = useState(false);
  const [goalInputVal, setGoalInputVal] = useState(commercialGoal.toString());

  // 2. Load/Save Custom Cash Ledger transactions
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(() => {
    const saved = localStorage.getItem('autocare_cash_transactions');
    if (saved) return JSON.parse(saved);
    
    // Empty list for fresh start
    return [];
  });

  // Modal states for adding custom transaction
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [txLabel, setTxLabel] = useState('');
  const [txType, setTxType] = useState<'IN' | 'OUT'>('OUT');
  const [txAmount, setTxAmount] = useState('');
  const [txMethod, setTxMethod] = useState<'Cash' | 'Check' | 'Bill'>('Cash');
  const [txNotes, setTxNotes] = useState('');

  // Save Goal to localStorage when changed
  useEffect(() => {
    localStorage.setItem('autocare_commercial_goal', commercialGoal.toString());
  }, [commercialGoal]);

  // Save manual transactions
  useEffect(() => {
    localStorage.setItem('autocare_cash_transactions', JSON.stringify(cashTransactions));
  }, [cashTransactions]);

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(goalInputVal);
    if (!isNaN(val) && val > 0) {
      setCommercialGoal(val);
      setShowGoalInput(false);
    }
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(txAmount);
    if (!txLabel || isNaN(amt) || amt <= 0) return;

    const newTx: CashTransaction = {
      id: 'tx-' + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      label: txLabel,
      type: txType,
      amount: amt,
      paymentMethod: txMethod,
      notes: txNotes
    };

    setCashTransactions([newTx, ...cashTransactions]);
    setTxLabel('');
    setTxAmount('');
    setTxNotes('');
    setShowAddTxModal(false);
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Voulez-vous supprimer cette opération de caisse ?')) {
      setCashTransactions(cashTransactions.filter(tx => tx.id !== id));
    }
  };

  // --- Calculations for Invoiced Revenue ---
  // We extract Paid invoices to compute real achieved amounts
  const paidInvoices = invoices.filter(inv => inv.status === 'Paid');

  // Breakdown of settlements of PAID invoices
  const invoiceCashTotal = paidInvoices
    .filter(inv => inv.paymentMethod === 'Cash')
    .reduce((sum, inv) => sum + inv.total, 0);

  const invoiceCheckTotal = paidInvoices
    .filter(inv => inv.paymentMethod === 'Check')
    .reduce((sum, inv) => sum + inv.total, 0);

  const invoiceBillTotal = paidInvoices
    .filter(inv => inv.paymentMethod === 'Bill')
    .reduce((sum, inv) => sum + inv.total, 0);

  // Other types like Card and Transfer
  const invoiceOtherTotal = paidInvoices
    .filter(inv => inv.paymentMethod !== 'Cash' && inv.paymentMethod !== 'Check' && inv.paymentMethod !== 'Bill')
    .reduce((sum, inv) => sum + inv.total, 0);

  // Total Realized Revenue from Invoices
  const totalRealizedRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);

  // Goal calculation stats
  const progressPercent = Math.min((totalRealizedRevenue / commercialGoal) * 100, 100);
  const remainingToGoal = Math.max(commercialGoal - totalRealizedRevenue, 0);

  // --- Calculations for "Comptabilité de Caisse & Règlements" ---
  // Manual cash inflows/outflows
  const manualCashIn = cashTransactions
    .filter(tx => tx.type === 'IN' && tx.paymentMethod === 'Cash')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const manualCashOut = cashTransactions
    .filter(tx => tx.type === 'OUT' && tx.paymentMethod === 'Cash')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // The actual Cash Balance (Solde de Caisse) = Initial apports/Recettes + Cash Invoices - Expenses
  const caisseBalance = manualCashIn + invoiceCashTotal - manualCashOut;

  // Manual Check Transactions (e.g. deposits representation)
  const manualCheckIn = cashTransactions
    .filter(tx => tx.type === 'IN' && tx.paymentMethod === 'Check')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const manualCheckOut = cashTransactions
    .filter(tx => tx.type === 'OUT' && tx.paymentMethod === 'Check')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const checkBalance = invoiceCheckTotal + manualCheckIn - manualCheckOut;

  // Manual Bills Transactions (Effets)
  const manualBillIn = cashTransactions
    .filter(tx => tx.type === 'IN' && tx.paymentMethod === 'Bill')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const manualBillOut = cashTransactions
    .filter(tx => tx.type === 'OUT' && tx.paymentMethod === 'Bill')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const billBalance = invoiceBillTotal + manualBillIn - manualBillOut;

  const handlePrintLedger = () => {
    // Read saved company settings if available
    let companyName = "AUTOCARE GESTION";
    try {
      const saved = localStorage.getItem('autocare_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.companyName) companyName = parsed.companyName.toUpperCase();
      }
    } catch (e) {
      console.error(e);
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Le bloqueur de fenêtres contextuelles est activé. Veuillez autoriser les fenêtres contextuelles pour imprimer le journal.");
      return;
    }

    const todayDate = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const cashInvoices = paidInvoices.filter(inv => ['Cash', 'Check', 'Bill'].includes(inv.paymentMethod));

    // Pre-generate transactions list HTML
    const cashTransactionsHTML = cashTransactions.length === 0 
      ? `<tr><td colspan="5" style="text-align:center; padding: 25px; color: #6b7280;">Aucune opération manuelle dans le journal.</td></tr>`
      : cashTransactions.map(tx => {
          const badgeClass = tx.paymentMethod === 'Cash' ? 'badge-cash' : tx.paymentMethod === 'Check' ? 'badge-check' : 'badge-bill';
          const badgeText = tx.paymentMethod === 'Cash' ? 'Espèces' : tx.paymentMethod === 'Check' ? 'Chèque' : 'Effet';
          const fluxClass = tx.type === 'IN' ? 'badge-in' : 'badge-out';
          const fluxText = tx.type === 'IN' ? 'Entrée (+)' : 'Sortie (-)';
          const colorStyle = tx.type === 'IN' ? '#059669' : '#dc2626';
          const notesHTML = tx.notes ? `<div style="font-size: 8px; color: #6b7280; font-style: italic;">Ref: ${tx.notes}</div>` : '';
          const sign = tx.type === 'IN' ? '+' : '-';

          return `
            <tr>
              <td class="font-mono">${tx.date}</td>
              <td>
                <strong>${tx.label}</strong>
                ${notesHTML}
              </td>
              <td>
                <span class="badge ${badgeClass}">${badgeText}</span>
              </td>
              <td>
                <span class="badge ${fluxClass}">${fluxText}</span>
              </td>
              <td class="font-mono text-right" style="font-weight: 700; color: ${colorStyle};">
                ${sign}${tx.amount.toFixed(2)} ${currency}
              </td>
            </tr>
          `;
        }).join('');

    // Pre-generate invoiced payments list HTML
    const cashInvoicesHTML = cashInvoices.length === 0
      ? `<tr><td colspan="5" style="text-align:center; padding: 25px; color: #6b7280;">Aucun règlement de facture enregistré par Caisse, Chèque ou Effet.</td></tr>`
      : cashInvoices.map(inv => {
          const badgeClass = inv.paymentMethod === 'Cash' ? 'badge-cash' : inv.paymentMethod === 'Check' ? 'badge-check' : 'badge-bill';
          const badgeText = inv.paymentMethod === 'Cash' ? 'Espèces' : inv.paymentMethod === 'Check' ? 'Chèque' : 'Effet';

          return `
            <tr>
              <td class="font-mono">${inv.date}</td>
              <td class="font-mono" style="font-weight: 700;">${inv.invoiceNumber}</td>
              <td>
                <strong>${inv.clientName}</strong>
              </td>
              <td>
                <span class="badge ${badgeClass}">${badgeText}</span>
              </td>
              <td class="font-mono text-right" style="font-weight: 700; color: #111827;">
                +${inv.total.toFixed(2)} ${currency}
              </td>
            </tr>
          `;
        }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Journal de Caisse - ${companyName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              color: #111827; 
              background-color: #fff; 
              margin: 40px; 
              padding: 0;
              font-size: 11px;
              line-height: 1.5;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #111827;
              padding-bottom: 15px;
              margin-bottom: 25px;
            }
            .company-name {
              font-size: 18px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: -0.5px;
              margin: 0;
            }
            .document-title {
              font-size: 13px;
              font-weight: 700;
              color: #4b5563;
              margin-top: 5px;
            }
            .meta-info {
              text-align: right;
              font-size: 10px;
              color: #4b5563;
            }
            .bento-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .card {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 12px;
              background-color: #f9fafb;
            }
            .card-title {
              font-size: 9px;
              text-transform: uppercase;
              color: #6b7280;
              font-weight: 700;
              margin-bottom: 4px;
            }
            .card-amount {
              font-size: 16px;
              font-weight: 800;
              margin: 0;
            }
            .card-amount.rose { color: #dc2626; }
            .card-amount.blue { color: #2563eb; }
            .card-amount.amber { color: #d97706; }
            
            .card-footer {
              display: flex;
              justify-content: space-between;
              font-size: 8px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
              margin-top: 8px;
              padding-top: 4px;
            }

            .section-title {
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              color: #111827;
              margin: 25px 0 10px 0;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 4px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background-color: #f3f4f6;
              font-weight: 700;
              text-align: left;
              padding: 8px 10px;
              border-bottom: 1px solid #d1d5db;
              font-size: 10px;
              text-transform: uppercase;
            }
            td {
              padding: 8px 10px;
              border-bottom: 1px solid #e5e7eb;
              word-break: break-word;
            }
            tr:hover {
              background-color: #f9fafb;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-mono { font-family: monospace; font-size: 10px; }
            
            .badge {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 8px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .badge-cash { background-color: #fee2e2; color: #991b1b; }
            .badge-check { background-color: #dbeafe; color: #1e40af; }
            .badge-bill { background-color: #fef3c7; color: #92400e; }
            
            .badge-in { background-color: #d1fae5; color: #065f46; }
            .badge-out { background-color: #fee2e2; color: #991b1b; }

            .footer-note {
              margin-top: 50px;
              border-top: 1px solid #e5e7eb;
              padding-top: 15px;
              text-align: center;
              font-size: 9px;
              color: #9ca3af;
            }

            @media print {
              body { margin: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="company-name">${companyName}</h1>
              <div class="document-title">JOURNAL DE TRÉSORERIE & COMPTABILITÉ CAISSE</div>
            </div>
            <div class="meta-info">
              Date d'édition : ${todayDate}<br>
              <strong>Activité de l'Atelier</strong>
            </div>
          </div>

          <div class="bento-grid">
            <div class="card">
              <div class="card-title">Solde de Caisse (Espèces)</div>
              <div class="card-amount rose">${caisseBalance.toFixed(2)} ${currency}</div>
              <div class="card-footer">
                <span>Fonds + Ventes: ${(manualCashIn + invoiceCashTotal).toFixed(2)} ${currency}</span>
                <span>Dépenses: -${manualCashOut.toFixed(2)} ${currency}</span>
              </div>
            </div>

            <div class="card">
              <div class="card-title">Solde Portefeuille Chèques</div>
              <div class="card-amount blue">${checkBalance.toFixed(2)} ${currency}</div>
              <div class="card-footer">
                <span>Ventes facturées: ${invoiceCheckTotal.toFixed(2)} ${currency}</span>
                <span>Ajustements: +${manualCheckIn.toFixed(2)} ${currency}</span>
              </div>
            </div>

            <div class="card">
              <div class="card-title">Portefeuille Effets de Commerce</div>
              <div class="card-amount amber">${billBalance.toFixed(2)} ${currency}</div>
              <div class="card-footer">
                <span>Ventes facturées: ${invoiceBillTotal.toFixed(2)} ${currency}</span>
                <span>Ajustements: +${manualBillIn.toFixed(2)} ${currency}</span>
              </div>
            </div>
          </div>

          <div class="section-title">1. Journal Complet des Opérations Manuelles & Ajustements</div>
          <table>
            <thead>
              <tr>
                <th style="width: 15%">Date</th>
                <th style="width: 35%">Libellé Opération</th>
                <th style="width: 15%">Moyen Règlement</th>
                <th style="width: 15%">Flux</th>
                <th style="width: 20%" class="text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${cashTransactionsHTML}
            </tbody>
          </table>

          <div class="section-title">2. Tableau des Encaissements de Vente Directe (Règlements de Factures)</div>
          <table>
            <thead>
              <tr>
                <th style="width: 20%">Date Facturation</th>
                <th style="width: 20%">Numéro Facture</th>
                <th style="width: 30%">Client / Véhicule</th>
                <th style="width: 15%">Moyen Règlement</th>
                <th style="width: 15%" class="text-right">Total Payé (TTC)</th>
              </tr>
            </thead>
            <tbody>
              ${cashInvoicesHTML}
            </tbody>
          </table>

          <div class="section-title">Synthèse Financière Multi-Règlements</div>
          <div style="display: flex; justify-content: space-between; align-items: center; background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-top:20px;">
            <div>
              <strong>Cumul Réalisations d'Atelier :</strong> ${totalRealizedRevenue.toFixed(2)} ${currency} sur un objectif de ${commercialGoal.toFixed(2)} ${currency} (${progressPercent.toFixed(1)}% Atteint)
            </div>
            <div style="font-size:11px; font-weight: 800; color: #111827;">
              TOTAL EN PORTES-FEUILLES TRÉSORERIE : ${(caisseBalance + checkBalance + billBalance).toFixed(2)} ${currency}
            </div>
          </div>

          <div class="footer-note">
            Document généré automatiquement pour contrôle comptable d'atelier mobile le ${todayDate} - Atelier Mobile App.
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 text-left animate-fade-in">
      
      {/* Tab Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xs">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-slate-800 rounded-full opacity-30 pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-24 w-80 h-80 bg-slate-850 rounded-full opacity-20 pointer-events-none" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <span className="text-[10px] bg-slate-800 text-slate-300 font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider">
              Pilotage Entreprise
            </span>
            <h1 className="text-2xl font-display font-black tracking-tight text-white mt-2">
              Performance & Suivi de Caisse
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Fixez des objectifs commerciaux, suivez le solde de votre caisse espèces, et optimisez la comptabilisation des paiements par chèque, effet et numéraire.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrintLedger}
              className="p-2 px-3 border border-slate-700 bg-slate-800/40 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xxs"
            >
              <Printer size={13} className="text-blue-400" /> Imprimer Journal
            </button>
            <button
              onClick={() => setShowGoalInput(true)}
              className="p-2 px-3 border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xxs"
            >
              <Edit2 size={13} className="text-amber-400" /> Objectif de CA
            </button>
            <button
              onClick={() => setShowAddTxModal(true)}
              className="p-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <PlusCircle size={14} /> Opération de Caisse
            </button>
          </div>
        </div>
      </div>

      {/* ----------------- SECTION 1 : OBJECTIFS COMMERCIAUX ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Progress Display Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xxs font-black text-gray-700 uppercase tracking-widest flex items-center gap-1">
                <TrendingUp size={13} className="text-blue-550" /> Objectif Chiffre d'Affaire Réalisé
              </span>
              <span className="text-xxs bg-blue-50 text-blue-700 font-mono font-black px-2 py-0.5 rounded-md">
                {progressPercent.toFixed(1)}% Atteint
              </span>
            </div>

            {/* Progress bar visual container */}
            <div className="space-y-2 mt-40">
              <div className="w-full bg-slate-100 h-6.5 rounded-full overflow-hidden p-1 flex items-center border border-slate-150">
                <div 
                  className="bg-slate-900 h-4.5 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2 min-w-[34px]"
                  style={{ width: `${progressPercent}%` }}
                >
                  {progressPercent > 8 && (
                    <span className="text-[9px] font-black font-mono text-white leading-none">
                      {progressPercent.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xxs font-mono text-gray-500 pt-1">
                <span>0.00 {currency}</span>
                <span className="font-extrabold text-blue-650">Actuel : {totalRealizedRevenue.toFixed(2)} {currency}</span>
                <span className="font-extrabold text-slate-800">Cible : {commercialGoal.toLocaleString('fr-FR')} {currency}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-gray-100 pt-4 mt-6">
            <div>
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Objectif visé</span>
              <span className="text-sm font-black font-mono text-gray-950 mt-1 block">
                {commercialGoal.toLocaleString('fr-FR')} {currency}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Réalisation (Payées)</span>
              <span className="text-sm font-black font-mono text-emerald-600 mt-1 block">
                +{totalRealizedRevenue.toFixed(2)} {currency}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Reste à faire</span>
              <span className="text-sm font-black font-mono text-blue-600 mt-1 block">
                {remainingToGoal === 0 ? '🏁 Atteint !' : `${remainingToGoal.toFixed(2)} ${currency}`}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown Card for Invoiced Methods */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <span className="text-xxs font-black text-gray-700 uppercase tracking-widest block mb-4">
              📜 Volume de Règlement Clients (Factures Payées)
            </span>

            {/* Quick mini ledger values breakdown */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xxs font-bold text-gray-650 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                  Espèces (Caisse)
                </span>
                <span className="text-xs font-black font-mono text-gray-900">
                  {invoiceCashTotal.toFixed(2)} {currency}
                </span>
              </div>

              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xxs font-bold text-gray-650 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                  Chèques
                </span>
                <span className="text-xs font-black font-mono text-gray-900">
                  {invoiceCheckTotal.toFixed(2)} {currency}
                </span>
              </div>

              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xxs font-bold text-gray-650 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                  Effets de commerce
                </span>
                <span className="text-xs font-black font-mono text-gray-900">
                  {invoiceBillTotal.toFixed(2)} {currency}
                </span>
              </div>

              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xxs font-bold text-gray-650 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-slate-300 rounded-full" />
                  Autres règlements (CB/virements)
                </span>
                <span className="text-xs font-black font-mono text-gray-800">
                  {invoiceOtherTotal.toFixed(2)} {currency}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 mt-4 text-center">
            <span className="text-[10px] text-gray-400 block font-medium">Revenu Net Facturé Clôturé (TTC)</span>
            <span className="text-sm font-black font-mono text-slate-800 mt-1 block">
              {totalRealizedRevenue.toFixed(2)} {currency}
            </span>
          </div>
        </div>

      </div>

      {/* ----------------- SECTION 2 : COMPTABILITÉ CAISSE & REGLEMENTS ----------------- */}
      <h2 className="text-sm font-black text-gray-950 uppercase tracking-wider pt-2 flex items-center gap-1.5">
        <Coins size={16} className="text-amber-550" /> Trésorerie d'Atelier : Caisse Espèces, Chèques & Effets
      </h2>

      {/* Tresor Balances Bento Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Caisse d'Atelier (Cash Box) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 relative overflow-hidden group">
          <div className="absolute right-3 top-3 p-1.5 bg-rose-50 text-rose-500 rounded-xl">
            <Coins size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Solde de Caisse (Espèces)</span>
            <p className="text-lg font-black font-mono text-rose-600 mt-2">
              {caisseBalance.toFixed(2)} {currency}
            </p>
            <div className="text-[10px] text-gray-400 mt-1">
              Encaissements, dépenses rapides & dépôts
            </div>
          </div>
          
          <div className="border-t border-slate-100/80 pt-3 mt-3.5 flex justify-between text-xxs bg-slate-50 -mx-5 -mb-5 p-3 px-5">
            <div>
              <span className="text-gray-400 block font-bold">Fonds + Ventes</span>
              <span className="font-mono text-gray-750 font-black">{(manualCashIn + invoiceCashTotal).toFixed(2)} {currency}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-400 block font-bold">Dépenses caisse</span>
              <span className="font-mono text-red-600 font-extrabold">-{manualCashOut.toFixed(2)} {currency}</span>
            </div>
          </div>
        </div>

        {/* Chèques en d'Atelier */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 relative overflow-hidden group">
          <div className="absolute right-3 top-3 p-1.5 bg-blue-50 text-blue-550 rounded-xl">
            <PiggyBank size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Encaissements Chèques</span>
            <p className="text-lg font-black font-mono text-blue-650 mt-2">
              {checkBalance.toFixed(2)} {currency}
            </p>
            <div className="text-[10px] text-gray-400 mt-1">
              Valeur totale des chèques physiques reçus
            </div>
          </div>

          <div className="border-t border-slate-100/80 pt-3 mt-3.5 flex justify-between text-xxs bg-slate-50 -mx-5 -mb-5 p-3 px-5">
            <div>
              <span className="text-gray-400 block font-bold">Facturés d'office</span>
              <span className="font-mono text-gray-750 font-black">{invoiceCheckTotal.toFixed(2)} {currency}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-400 block font-bold">Ajustement chèques</span>
              <span className="font-mono text-emerald-600 font-extrabold">+{manualCheckIn.toFixed(2)} {currency}</span>
            </div>
          </div>
        </div>

        {/* Effets (Bill of Exchange / Traite) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 relative overflow-hidden group">
          <div className="absolute right-3 top-3 p-1.5 bg-amber-50 text-amber-500 rounded-xl">
            <FileText size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Portefeuille Effets (Traites)</span>
            <p className="text-lg font-black font-mono text-amber-600 mt-2">
              {billBalance.toFixed(2)} {currency}
            </p>
            <div className="text-[10px] text-gray-400 mt-1">
              Total des effets de commerce en portefeuille
            </div>
          </div>

          <div className="border-t border-slate-100/80 pt-3 mt-3.5 flex justify-between text-xxs bg-slate-50 -mx-5 -mb-5 p-3 px-5">
            <div>
              <span className="text-gray-400 block font-bold">Facturation Mobile</span>
              <span className="font-mono text-gray-750 font-black">{invoiceBillTotal.toFixed(2)} {currency}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-400 block font-bold">Ajustement Traites</span>
              <span className="font-mono text-emerald-600 font-extrabold">+{manualBillIn.toFixed(2)} {currency}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Ledger Journal transactions table split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left lists: Cash Invoices register */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 lg:col-span-1">
          <span className="text-xxs font-black text-gray-700 uppercase tracking-widest block mb-1">
            🛒 Règlements par Caisse / Chèque / Effet
          </span>
          <p className="text-xxs text-gray-400 mb-4 font-bold">Venant de la facturation standard</p>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {paidInvoices.filter(inv => ['Cash', 'Check', 'Bill'].includes(inv.paymentMethod)).length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xxs">
                Aucun paiement correspondant enregistré hier ou aujourd'hui.
              </div>
            ) : (
              paidInvoices
                .filter(inv => ['Cash', 'Check', 'Bill'].includes(inv.paymentMethod))
                .map(inv => (
                  <div key={inv.id} className="p-3 bg-gray-50 rounded-xl border border-gray-150 text-left text-xxs space-y-1 relative">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-gray-900 font-mono">{inv.invoiceNumber}</span>
                      <span className="font-black text-gray-950 font-mono">+{inv.total.toFixed(2)} {currency}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-500">
                      <span>{inv.clientName}</span>
                      <span>Date : {inv.date}</span>
                    </div>
                    <div className="pt-1 flex items-center justify-between">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        inv.paymentMethod === 'Cash' 
                          ? 'bg-rose-50 text-rose-700 font-bold' 
                          : inv.paymentMethod === 'Check'
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'bg-amber-50 text-amber-700 font-bold'
                      }`}>
                        {inv.paymentMethod === 'Cash' ? 'Espèces' : inv.paymentMethod === 'Check' ? 'Chèque' : 'Effet'}
                      </span>
                      <span className="text-[9px] italic text-slate-400">Paiement Facture</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Right list: Complete Cash Ledger Journal (Journal de Caisse) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 lg:col-span-2">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-xxs font-black text-gray-700 uppercase tracking-widest block">
                📝 Journal de Caisse & Opérations Ajustement
              </span>
              <p className="text-xxs text-gray-400 mt-0.5">Saisies de trésorerie manuelles pour ajuster ou comptabiliser des frais</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handlePrintLedger}
                className="text-xxs border border-gray-300 bg-white hover:bg-slate-50 text-gray-750 font-bold p-1.5 px-3 rounded-lg flex items-center gap-1.5 transition shadow-xxs cursor-pointer"
              >
                <Printer size={12} className="text-gray-500" /> Imprimer
              </button>
              <button
                onClick={() => setShowAddTxModal(true)}
                className="text-xxs bg-slate-900 text-white font-bold p-1.5 px-3.5 rounded-lg flex items-center gap-1 hover:bg-blue-600 transition shadow-xxs cursor-pointer"
              >
                <PlusCircle size={12} /> Nouvelle Ligne
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xxs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-black uppercase tracking-wider">
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Libellé opération</th>
                  <th className="p-2.5">Mode</th>
                  <th className="p-2.5">Flux</th>
                  <th className="p-2.5 text-right">Montant</th>
                  <th className="p-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cashTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400 text-xs">
                      Aucune transaction manuelle enregistrée.
                    </td>
                  </tr>
                ) : (
                  cashTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-2.5 font-mono text-gray-500 whitespace-nowrap">{tx.date}</td>
                      <td className="p-2.5">
                        <div className="font-extrabold text-gray-900">{tx.label}</div>
                        {tx.notes && <div className="text-[10px] text-gray-400 italic font-mono">{tx.notes}</div>}
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          tx.paymentMethod === 'Cash' 
                            ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                            : tx.paymentMethod === 'Check'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {tx.paymentMethod === 'Cash' ? 'Espèces' : tx.paymentMethod === 'Check' ? 'Chèque' : 'Effet'}
                        </span>
                      </td>
                      <td className="p-2.5">
                        {tx.type === 'IN' ? (
                          <span className="text-emerald-600 font-extrabold bg-emerald-50 px-1 rounded flex items-center gap-0.5 w-fit">
                            <ArrowUpRight size={10} /> Entrée
                          </span>
                        ) : (
                          <span className="text-rose-600 font-extrabold bg-rose-50 px-1 rounded flex items-center gap-0.5 w-fit">
                            <ArrowDownRight size={10} /> Dépense
                          </span>
                        )}
                      </td>
                      <td className={`p-2.5 text-right font-mono font-black ${tx.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'IN' ? '+' : '-'}{tx.amount.toFixed(2)} {currency}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="text-red-500 hover:text-red-700 transition font-black hover:bg-red-50 p-1 rounded cursor-pointer"
                          title="Supprimer la transaction"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>


      {/* ----------------- MODAL 1 : EDIT COMMERCIAL REVENUE GOAL ----------------- */}
      {showGoalInput && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-sm w-full p-6 text-left">
            <h3 className="text-sm font-black text-gray-950 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              🏁 Fixer l'Objectif de Chiffre d'Affaires
            </h3>
            <p className="text-xxs text-gray-500 mb-4 leading-relaxed">
              Définissez le montant du chiffre d'affaires cumulé (Factures Payées) que vous souhaitez atteindre pour votre atelier mobile.
            </p>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Objectif (Cible en {currency}) *</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={goalInputVal}
                    onChange={(e) => setGoalInputVal(e.target.value)}
                    placeholder="Ex: 10000"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2.5 pr-10 outline-none"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-gray-500 font-bold">{currency}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoalInput(false)}
                  className="flex-1 py-2 border border-gray-250 hover:bg-gray-100 text-gray-800 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer text-center"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer text-center"
                >
                  Valider la Cible
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 2 : ADD TRANSACTION MANUAL FLUX ----------------- */}
      {showAddTxModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full p-6 text-left">
            <h3 className="text-sm font-black text-gray-950 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              📥 Nouvelle Ligne au Journal de Caisse / Trésorerie
            </h3>
            <p className="text-xxs text-gray-500 mb-4">
              Ajoutez manuellement des entrées de capital (fonds de roulement, apport) ou des dépenses courantes effectuées directement via les deniers de la caisse espèces physique ou chèques d'atelier.
            </p>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Type de Flux *</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as 'IN' | 'OUT')}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2.5 outline-none font-bold text-slate-800"
                  >
                    <option value="OUT">Dépense (Achat pièces, carburant, etc.)</option>
                    <option value="IN">Entrée (Apport, régul caisse, etc.)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Moyen Règlement *</label>
                  <select
                    value={txMethod}
                    onChange={(e) => setTxMethod(e.target.value as 'Cash' | 'Check' | 'Bill')}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2.5 outline-none font-bold text-slate-850"
                  >
                    <option value="Cash">Espèces (Caisse)</option>
                    <option value="Check">Chèque d'Atelier</option>
                    <option value="Bill">Effet de Commerce</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Libellé d'Opération *</label>
                <input
                  type="text"
                  required
                  value={txLabel}
                  onChange={(e) => setTxLabel(e.target.value)}
                  placeholder="Ex : Achat de disques de freins d'urgence / Essence"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2.5 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Montant *</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2.5 pr-10 outline-none font-mono"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-gray-500 font-bold">{currency}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Notes / Référence justificatif</label>
                  <input
                    type="text"
                    value={txNotes}
                    onChange={(e) => setTxNotes(e.target.value)}
                    placeholder="Ex: Facture #FR-9382"
                    className="w-full bg-gray-55/70 bg-slate-50 border border-gray-200 rounded-lg text-xs p-2.5 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTxModal(false)}
                  className="flex-1 py-2.5 border border-gray-250 hover:bg-gray-100 text-gray-800 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer text-center font-sans"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer text-center font-sans"
                >
                  Valider l'Opération
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
