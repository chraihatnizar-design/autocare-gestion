import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Edit2,
  Filter,
  BarChart4
} from 'lucide-react';
import { MonthlyExpense, SupplierOrder, Invoice, AppSettings, PaymentMethod } from '../types';

interface ExpenseManagerProps {
  expenses: MonthlyExpense[];
  supplierOrders: SupplierOrder[];
  invoices: Invoice[];
  onAddExpense: (newExp: Omit<MonthlyExpense, 'id'>) => void;
  onUpdateExpense: (updatedExp: MonthlyExpense) => void;
  onDeleteExpense: (id: string) => void;
  settings: AppSettings;
}

export default function ExpenseManager({
  expenses,
  supplierOrders,
  invoices,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  settings
}: ExpenseManagerProps) {
  const currency = settings?.currency || 'DH';

  // State Tabs: 'expenses_list' | 'rentabilite'
  const [activeSubTab, setActiveSubTab] = useState<'expenses_list' | 'rentabilite'>('rentabilite');

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-06'); // Default to current virtual month

  // Modal / Form States
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<MonthlyExpense | null>(null);

  // Expense Form State
  const [expenseFormData, setExpenseFormData] = useState({
    label: '',
    amount: 0,
    category: 'Loyer',
    date: new Date().toISOString().split('T')[0],
    paymentStatus: 'Paid' as 'Paid' | 'Unpaid',
    paymentMethod: 'Transfer' as PaymentMethod
  });

  // Unique list of all months extracted from Data (Invoices, Purchases, Expenses)
  const allMonths = Array.from(new Set([
    ...invoices.map(inv => inv.date.substring(0, 7)),
    ...supplierOrders.map(so => so.orderDate.substring(0, 7)),
    ...expenses.map(e => e.date.substring(0, 7))
  ])).sort((a, b) => b.localeCompare(a));

  // If selectedMonth is not in the list or initial, fall back safely
  const currentMonth = allMonths.includes(selectedMonth) ? selectedMonth : (allMonths[0] || '2026-06');

  // Calculate stats for CURRENT selected month
  const monthlyInvoices = invoices.filter(inv => inv.date.startsWith(currentMonth) && inv.status === 'Paid');
  const monthlyRevenuesTTC = monthlyInvoices.reduce((sum, inv) => sum + inv.total, 0);
  
  // Calculate HT revenues for precise margin modeling
  const monthlyRevenuesHT = monthlyInvoices.reduce((sum, inv) => {
    const subtotalHT = inv.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const discountAmount = subtotalHT * (inv.discount / 100);
    return sum + (subtotalHT - discountAmount);
  }, 0);

  const monthlySupplierOrders = supplierOrders.filter(so => so.orderDate.startsWith(currentMonth));
  const monthlyPurchasesTTC = monthlySupplierOrders.reduce((sum, so) => sum + so.totalTTC, 0);
  const monthlyPurchasesHT = monthlySupplierOrders.reduce((sum, so) => sum + so.priceHT, 0);

  const monthlyExpensesList = expenses.filter(e => e.date.startsWith(currentMonth));
  const monthlyExpensesAmount = monthlyExpensesList.reduce((sum, e) => sum + e.amount, 0);

  const totalMonthlyCostsHT = monthlyPurchasesHT + monthlyExpensesAmount;
  const monthlyNetProfit = monthlyRevenuesHT - totalMonthlyCostsHT;
  
  const commercialMarginPercent = monthlyRevenuesHT > 0 
    ? (monthlyNetProfit / monthlyRevenuesHT) * 100 
    : 0;

  // Handle forms
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setExpenseFormData({
      label: '',
      amount: 0,
      category: 'Loyer',
      date: new Date().toISOString().split('T')[0],
      paymentStatus: 'Paid',
      paymentMethod: 'Transfer'
    });
    setShowExpenseModal(true);
  };

  const handleOpenEditExpense = (exp: MonthlyExpense) => {
    setEditingExpense(exp);
    setExpenseFormData({
      label: exp.label,
      amount: exp.amount,
      category: exp.category,
      date: exp.date,
      paymentStatus: exp.paymentStatus,
      paymentMethod: exp.paymentMethod
    });
    setShowExpenseModal(true);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseFormData.label.trim() || expenseFormData.amount <= 0) {
      alert("Veuillez saisir un libellé de charge valide et un montant supérieur à zéro.");
      return;
    }

    if (editingExpense) {
      onUpdateExpense({
        ...editingExpense,
        ...expenseFormData
      });
    } else {
      onAddExpense(expenseFormData);
    }
    setShowExpenseModal(false);
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          exp.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
    const matchesMonth = exp.date.substring(0, 7) === currentMonth;
    return matchesSearch && matchesCategory && matchesMonth;
  });

  return (
    <div className="space-y-6">

      {/* Header bar and action trigger */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xxs">
        <div className="text-left">
          <h2 className="text-xl font-display font-black tracking-tight text-slate-900 uppercase">
            Charges Mensuelles & Rentabilité
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Suivi analytique du résultat d'exploitation, des charges d'atelier, des dépenses courantes et calcul de marge nette.
          </p>
        </div>
        
        {/* Month Selector Filter */}
        <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto">
          <span className="text-[10px] font-black text-slate-400 uppercase">Mois analytique :</span>
          <select
            value={currentMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-900 text-white border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs font-bold outline-none cursor-pointer"
          >
            {allMonths.length === 0 ? (
              <option value="2026-06">Juin 2026</option>
            ) : (
              allMonths.map(m => {
                const [year, month] = m.split('-');
                const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                return <option key={m} value={m}>{monthName}</option>;
              })
            )}
          </select>

          <button
            onClick={handleOpenAddExpense}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-blue-700 font-sans"
          >
            <Plus size={14} /> Ajouter une Charge
          </button>
        </div>
      </div>

      {/* Analytical Tab Selector inside Expense module */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('rentabilite')}
          className={`px-5 py-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeSubTab === 'rentabilite'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp size={15} /> Compte de Résultat & Marges
        </button>
        <button
          onClick={() => setActiveSubTab('expenses_list')}
          className={`px-5 py-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeSubTab === 'expenses_list'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart4 size={15} /> Détail des Charges ({monthlyExpensesList.length})
        </button>
      </div>

      {/* --- SUB TAB 1: PROFITABILITY & MARGINS (COMTE DE RESULTAT ET MARGES) --- */}
      {activeSubTab === 'rentabilite' && (
        <div className="space-y-6">

          {/* Golden KPI Board */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Revenue Widget */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xxs text-left space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">CA Réalisé HT</span>
                <span className="text-xs font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md">Revenus</span>
              </div>
              <p className="text-lg font-black font-mono text-slate-900">{monthlyRevenuesHT.toFixed(2)} {currency}</p>
              <div className="pt-1.5 text-[10px] text-slate-400 leading-none">
                Volume encaissé : <span className="font-bold text-slate-600 font-mono">{monthlyRevenuesTTC.toFixed(2)} TTC</span>
              </div>
            </div>

            {/* Material Purchases cost */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xxs text-left space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Achats Fournisseurs HT</span>
                <span className="text-xs font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md">Fournitures</span>
              </div>
              <p className="text-lg font-black font-mono text-slate-900">{monthlyPurchasesHT.toFixed(2)} {currency}</p>
              <div className="pt-1.5 text-[10px] text-slate-400 leading-none">
                TTC Approvisionnement : <span className="font-bold text-slate-600 font-mono">{monthlyPurchasesTTC.toFixed(2)} TTC</span>
              </div>
            </div>

            {/* Monthly Operating Charges */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xxs text-left space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Charges de Fonctionnement</span>
                <span className="text-xs font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded-md">Charges</span>
              </div>
              <p className="text-lg font-black font-mono text-slate-900">{monthlyExpensesAmount.toFixed(2)} {currency}</p>
              <div className="pt-1.5 text-[10px] text-slate-400 leading-none">
                Loyer, Assurances, Telecoms...
              </div>
            </div>

            {/* Profit and Margin Golden Widget */}
            <div className={`p-5 rounded-2xl border shadow-xxs text-left space-y-2 ${
              monthlyNetProfit >= 0 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-250/60' 
                : 'bg-rose-50 text-rose-800 border-rose-250/60'
            }`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-black tracking-wider">Résultat Net Analytique</span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  monthlyNetProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  Bénéfice
                </span>
              </div>
              <p className="text-lg font-black font-mono">{monthlyNetProfit.toFixed(2)} {currency}</p>
              
              <div className="pt-1 border-t border-dashed border-emerald-200/50 flex justify-between items-center text-[10px]">
                <span className="opacity-80">Marge d'exploitation :</span>
                <span className="font-black font-mono text-xs">{commercialMarginPercent.toFixed(1)}%</span>
              </div>
            </div>

          </div>

          {/* Mid section layout: Compte de résultat structuré visual table & category breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 1. Structured analytical revenue table (Compte de Résultat Simplifié) */}
            <div className="bg-white border border-slate-205 rounded-2xl p-6 shadow-xxs text-left space-y-4 lg:col-span-7">
              <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                📊 Structure Financière du mois (HT)
              </h3>
              
              <div className="space-y-3.5 pt-2">
                
                {/* CA Section */}
                <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-semibold">Chiffre d'Affaires Encaissé HT (+)</span>
                  <span className="font-mono font-bold text-slate-900 select-all">{monthlyRevenuesHT.toFixed(2)} {currency}</span>
                </div>

                {/* Purchases Section */}
                <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-semibold">Achats de Fournitures / Pièces Fournisseurs (-)</span>
                  <span className="font-mono font-bold text-slate-800 select-all">-{monthlyPurchasesHT.toFixed(2)} {currency}</span>
                </div>

                {/* Charges Section */}
                <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-semibold">Charges fixes et de fonctionnement (-)</span>
                  <span className="font-mono font-bold text-slate-800 select-all">-{monthlyExpensesAmount.toFixed(2)} {currency}</span>
                </div>

                {/* Marge brute */}
                {(() => {
                  const margeBrute = monthlyRevenuesHT - monthlyPurchasesHT;
                  const margeBrutePercent = monthlyRevenuesHT > 0 ? (margeBrute / monthlyRevenuesHT) * 100 : 0;
                  return (
                    <div className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                      <span className="text-slate-700 font-bold">Marge Brute sur Matériaux (=)</span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-800 block">{margeBrute.toFixed(2)} {currency}</span>
                        <span className="text-[9px] text-slate-500 font-mono block">Marge brute : {margeBrutePercent.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Result */}
                <div className={`flex justify-between items-center p-3 rounded-xl border ${
                  monthlyNetProfit >= 0 
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}>
                  <div className="text-left font-bold text-xs space-y-0.5">
                    <span>Résultat Analytique Analysé :</span>
                    <span className="block text-[10px] text-slate-400 font-normal">Chiffre d'Affaires - Coût de revient</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-sm block">
                      {monthlyNetProfit >= 0 ? '+' : ''}{monthlyNetProfit.toFixed(2)} {currency}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-tight">
                      Marge Nette : {commercialMarginPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Analytical advice bar */}
                <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl text-[11px] leading-relaxed text-slate-650 font-normal">
                  💡 <strong>Indicateur d'activité :</strong> Votre marge commerciale d'exploitation s'établit à <strong>{commercialMarginPercent.toFixed(1)}%</strong> ce mois-ci. Pour un atelier mécanique itinérant, visez une marge générale d'au moins <strong>40%</strong> à <strong>50%</strong> (mains d'œuvre comprises) pour couvrir vos déplacements et l'amortissement logistique de votre fourgonnette d'atelier.
                </div>

              </div>
            </div>

            {/* 2. Breakdown of expenses by categories sidebar */}
            <div className="bg-white border border-slate-205 rounded-2xl p-6 shadow-xxs text-left space-y-4 lg:col-span-5">
              <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                🍕 Ventilation des charges
              </h3>
              
              <div className="space-y-3 pt-2">
                {(() => {
                  const categories = ['Loyer', 'Assurance', 'Carburant', 'Téléphonie & Cloud', 'Outillage', 'Impôts / Taxes', 'Autre'];
                  
                  return categories.map(cat => {
                    const catTotal = monthlyExpensesList
                      .filter(e => e.category.toLowerCase().includes(cat.toLowerCase().substring(0, 4)))
                      .reduce((sum, e) => sum + e.amount, 0);
                    
                    const percent = monthlyExpensesAmount > 0 ? (catTotal / monthlyExpensesAmount) * 100 : 0;
                    
                    if (catTotal === 0) return null;

                    return (
                      <div key={cat} className="space-y-1 text-xs">
                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                          <span>{cat}</span>
                          <span className="font-mono text-slate-900">{catTotal.toFixed(2)} {currency} ({percent.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  });
                })()}

                {monthlyExpensesList.length === 0 && (
                  <div className="p-12 text-center text-slate-400">
                    <p className="text-xs">Aucune charge mensuelle enregistrée ce mois-ci.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* --- SUB TAB 2: DETAILED CHARGES (DETAIL DES CHARGES) --- */}
      {activeSubTab === 'expenses_list' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xxs">
          
          {/* Internal filters for sub tab */}
          <div className="p-4 bg-slate-50 border-b border-slate-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex-1 w-full relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrer par libellé de charge..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-250 rounded-lg text-xs font-semibold focus:border-slate-400 outline-none text-left"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-slate-250 rounded-lg px-3 py-1.5 text-xs font-semibold focus:border-slate-400 outline-none cursor-pointer flex-1 sm:flex-initial"
              >
                <option value="all">Toutes catégories</option>
                <option value="Loyer">🏠 Loyers / Emplacement</option>
                <option value="Assurance">🛡️ Assurances</option>
                <option value="Carburant">⛽ Carburants</option>
                <option value="Téléphonie & Cloud">📱 Téléphonies & Web</option>
                <option value="Impôts & Taxes">🏛️ Impôts & Cotisations</option>
                <option value="Autre">📦 Autres charges d'atelier</option>
              </select>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <PieChart size={40} className="mx-auto text-slate-300" />
              <p className="font-semibold text-xs">Aucun charge d'atelier recensée pour ce mois</p>
              <p className="text-[11px] text-slate-400">Cliquez sur "Ajouter une Charge" pour documenter vos loyers, assurances ou carburants.</p>
            </div>
          ) : (
            <div className="overflow-x-auto text-left">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5 pl-5">Libellé de la dépense</th>
                    <th className="p-3.5">Catégorie</th>
                    <th className="p-3.5">Date Facture</th>
                    <th className="p-3.5 text-right">Montant charge (HT)</th>
                    <th className="p-3.5 text-center">Règlement</th>
                    <th className="p-3.5 text-right pr-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-105 font-medium">
                  {filteredExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/50">
                      <td className="p-3.5 pl-5 font-black text-slate-900">{exp.label}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-500">
                        {exp.date}
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-rose-600 text-sm">
                        -{exp.amount.toFixed(2)} {currency}
                      </td>
                      <td className="p-3.5 text-center">
                        {exp.paymentStatus === 'Paid' ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-md border border-emerald-100">
                              Payée
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                              {exp.paymentMethod}
                            </span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-800 text-[10px] font-bold rounded-md border border-rose-100">
                            À payer
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right pr-5">
                        <div className="flex justify-end items-center gap-1">
                          <button
                            onClick={() => handleOpenEditExpense(exp)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => {
                              // if (confirm(`Voulez-vous supprimer cette charge : ${exp.label} ?`)) {
                                onDeleteExpense(exp.id);
                              // }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- ADD / EDIT EXPENSE MODAL DIALOGUE --- */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-left shadow-2xl border border-slate-100 relative animate-scale-up space-y-4">
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">
              {editingExpense ? `Modifier la charge : ${editingExpense.label}` : "Ajouter une dépense / charge mensuelle"}
            </h3>

            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Désignation de la charge</label>
                <input
                  type="text"
                  required
                  placeholder="ex : Loyer Garage Valenciennes"
                  value={expenseFormData.label}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, label: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Montant (HT/Net)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={expenseFormData.amount || ''}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold font-mono focus:border-slate-800 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Date d'échéance / Paiement</label>
                  <input
                    type="date"
                    required
                    value={expenseFormData.date}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, date: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Catégorie budgétaire</label>
                <select
                  value={expenseFormData.category}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, category: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-slate-850 outline-none"
                >
                  <option value="Loyer">🏠 Loyers / Stockage / Emplacement</option>
                  <option value="Assurance">🛡️ Assurances professionnelles</option>
                  <option value="Carburant">⛽ Carburant & Péages</option>
                  <option value="Téléphonie & Cloud">📱 Abonnements Téléphonie, 4G, Logiciels SaaS</option>
                  <option value="Outillage">🛠️ Équipement & consommables d'atelier (Chiffons, gants)</option>
                  <option value="Impôts & Taxes">🏛️ Cotisations sociales, URSSAF, impôts</option>
                  <option value="Autre">📦 Autres dépenses courantes</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Statut réglementaire</label>
                  <select
                    value={expenseFormData.paymentStatus}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, paymentStatus: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-slate-850 outline-none"
                  >
                    <option value="Paid">✓ Payée (Solde débité)</option>
                    <option value="Unpaid">❌ À payer (Facture impayée)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Moyen de paiement favorisé</label>
                  <select
                    value={expenseFormData.paymentMethod}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-slate-850 outline-none"
                  >
                    <option value="Transfer">Virement bancaire (Transfer)</option>
                    <option value="Card">Carte bancaire (Card)</option>
                    <option value="Cash">Espèces (Cash)</option>
                    <option value="Check">Chèque pro (Check)</option>
                    <option value="Pending">En attente / Autre</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition"
                >
                  {editingExpense ? "Enregistrer les modifications" : "Ajouter la charge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
