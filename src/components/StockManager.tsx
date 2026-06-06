/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Barcode, 
  Search, 
  Plus, 
  Minus, 
  AlertTriangle, 
  Layers, 
  CheckCircle, 
  History, 
  MapPin, 
  Camera, 
  X, 
  Volume2, 
  RotateCcw, 
  ArrowUp, 
  ArrowDown 
} from 'lucide-react';
import { StockItem, StockTransaction, AppSettings } from '../types';

interface StockManagerProps {
  stock: StockItem[];
  transactions: StockTransaction[];
  onAddStockItem: (item: Omit<StockItem, 'id'>) => void;
  onUpdateStockQuantity: (id: string, quantityChange: number, reason: string) => void;
  onDeleteStockItem: (id: string) => void;
  settings?: AppSettings;
}

export default function StockManager({
  stock,
  transactions,
  onAddStockItem,
  onUpdateStockQuantity,
  onDeleteStockItem,
  settings
}: StockManagerProps) {
  const currency = settings?.currency || 'DH';

  // Filters & State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  
  // Custom Transaction states (for manual edit)
  const [selectedItemForTx, setSelectedItemForTx] = useState<StockItem | null>(null);
  const [txType, setTxType] = useState<'IN' | 'OUT'>('IN');
  const [txQuantity, setTxQuantity] = useState(1);
  const [txReason, setTxReason] = useState('Ajustement inventaire');

  // New Item states
  const [newBarcode, setNewBarcode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Freinage');
  const [newQuantity, setNewQuantity] = useState(5);
  const [newMinThreshold, setNewMinThreshold] = useState(3);
  const [newPriceBuy, setNewPriceBuy] = useState(10);
  const [newPriceSell, setNewPriceSell] = useState(20);
  const [newLocation, setNewLocation] = useState('Coffre-Fort Atelier');

  // Scanner Live Camera Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<StockItem | null>(null);
  const [scanSuccessBeep, setScanSuccessBeep] = useState(true);

  // Play scanner sound using Web Audio API
  const playScanBeep = () => {
    if (!scanSuccessBeep) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); // High pitch beep
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio check blocked or unsupported:', e);
    }
  };

  // Categories
  const categories = ['Tous', 'Freinage', 'Fluides', 'Filtration', 'Électricité', 'Pneumatiques', 'Accessoires', 'Autre'];

  // Handle camera stream setup
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (showScanModal && cameraActive) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then((mediaStream) => {
          stream = mediaStream;
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch((err) => {
          console.error("Camera access error:", err);
          setCameraError("Impossible d'accéder à la caméra. Vérifiez les permissions de votre navigateur.");
          setCameraActive(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showScanModal, cameraActive]);

  // Handle scanned simulated or real values
  const handleBarcodeScanned = (scannedCode: string) => {
    const item = stock.find(p => p.barcode === scannedCode);
    if (item) {
      setScanResult(item);
      playScanBeep();
    } else {
      // Prompt option to register a new item with this scanned barcode!
      setNewBarcode(scannedCode);
      playScanBeep();
      // Set temporary state to show notice
      const tempItem: StockItem = {
        id: 'new-scanned-temp',
        barcode: scannedCode,
        name: 'Pièce inconnue (Nouveau Code-Barres détecté)',
        category: 'Autre',
        quantity: 0,
        minThreshold: 2,
        priceBuy: 0,
        priceSell: 0,
        location: 'À classer'
      };
      setScanResult(tempItem);
    }
  };

  // Filters computed
  const filteredStock = stock.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.barcode.includes(search) || 
                          item.location.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle manual stock entry/exit submit
  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForTx) return;
    
    const quantityChange = txType === 'IN' ? txQuantity : -txQuantity;
    onUpdateStockQuantity(selectedItemForTx.id, quantityChange, txReason);
    
    // Close modal settings
    setSelectedItemForTx(null);
    setTxQuantity(1);
    setTxReason('Ajustement inventaire');
  };

  // Handle new item registration submit
  const handleNewItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddStockItem({
      barcode: newBarcode || Math.floor(1000000000000 + Math.random() * 900000000000).toString(),
      name: newName,
      category: newCategory,
      quantity: newQuantity,
      minThreshold: newMinThreshold,
      priceBuy: newPriceBuy,
      priceSell: newPriceSell,
      location: newLocation
    });

    // Reset fields
    setNewBarcode('');
    setNewName('');
    setNewCategory('Freinage');
    setNewQuantity(5);
    setNewMinThreshold(3);
    setNewPriceBuy(10);
    setNewPriceSell(20);
    setNewLocation('Coffre-Fort Atelier');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Stock Manager Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Gestion de Stock & Inventaire</h1>
          <p className="text-xs text-gray-600">Suivi en temps réel des pièces de l'atelier mobile mécanique.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Barcode scanner button */}
          <button
            onClick={() => {
              setScanResult(null);
              setCameraError(null);
              setCameraActive(true);
              setShowScanModal(true);
            }}
            className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-gray-800 flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Barcode size={15} />
            Scanner Barcode
          </button>

          {/* Add Item button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus size={15} />
            Ajouter une Pièce
          </button>
        </div>
      </div>

      {/* Grid: Main database and logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Stock Grid list */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Search & Category Filter bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xxs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                <Search size={15} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Chercher pièce, code-barres..."
                className="w-full bg-gray-55/35 border border-gray-200 rounded-lg text-xs pl-9 pr-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Scrolling Category Badges */}
            <div className="flex gap-1 overflow-x-auto w-full pb-1 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition ${
                    selectedCategory === cat 
                      ? 'bg-blue-650 bg-blue-600 text-white shadow-xs' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Piece Grid List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStock.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-gray-100 text-gray-400 text-sm">
                Aucune pièce détachée trouvée.
              </div>
            ) : (
              filteredStock.map((item) => {
                const isAlarm = item.quantity <= item.minThreshold;
                return (
                  <div 
                    key={item.id} 
                    className={`bg-white p-4 rounded-xl border transition hover:border-gray-300 flex flex-col justify-between gap-3 ${
                      isAlarm ? 'border-red-200 bg-red-50/15' : 'border-gray-100'
                    }`}
                  >
                    {/* Header Item */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 font-bold rounded text-xxs tracking-wide uppercase">
                          {item.category}
                        </span>
                        
                        {isAlarm ? (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-800 font-bold rounded text-xxs flex items-center gap-0.5">
                            <AlertTriangle size={10} />
                            SEUIL CRITIQUE
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-800 font-bold rounded text-xxs flex items-center gap-0.5">
                            <Layers size={10} />
                            STOCK OK
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-xs text-gray-950 line-clamp-2 mt-1">{item.name}</h3>
                      <p className="text-xxs font-mono text-gray-400 flex items-center gap-1">
                        <Barcode size={10} /> {item.barcode}
                      </p>
                    </div>

                    {/* Metadata Box */}
                    <div className="bg-gray-50/70 p-2.5 rounded-lg space-y-1.5 border border-gray-100">
                      <div className="flex justify-between text-xxs">
                        <span className="text-gray-500">Achat / Vente HT :</span>
                        <span className="font-mono font-bold text-gray-800">
                          {item.priceBuy.toFixed(2)} {currency} / {item.priceSell.toFixed(2)} {currency}
                        </span>
                      </div>
                      <div className="flex justify-between text-xxs">
                        <span className="text-gray-500">Marge brute unit. :</span>
                        <span className="font-bold text-green-700 font-mono">
                          +{(item.priceSell - item.priceBuy).toFixed(2)} {currency}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xxs text-gray-500">
                        <MapPin size={11} className="text-gray-400" />
                        <span className="line-clamp-1">Loc : {item.location}</span>
                      </div>
                    </div>

                    {/* Quantity Adjustment Controls */}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
                      <div className="flex items-center gap-1">
                        <span className="text-xxs text-gray-500 mr-1">Seuil Min : {item.minThreshold}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setTxType('OUT');
                            setSelectedItemForTx(item);
                            setTxReason('Sortie pour intervention');
                          }}
                          className="p-1 px-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-150 text-xs flex items-center gap-0.5 cursor-pointer"
                        >
                          <Minus size={12} /> OUT
                        </button>

                        <div className="px-2 font-mono text-xs font-extrabold text-gray-900 bg-gray-100 border border-gray-200 rounded py-0.5 min-w-[28px] text-center">
                          {item.quantity}
                        </div>

                        <button
                          onClick={() => {
                            setTxType('IN');
                            setSelectedItemForTx(item);
                            setTxReason('Réapprovisionnement atelier');
                          }}
                          className="p-1 px-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 font-bold border border-green-150 text-xs flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus size={12} /> IN
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Movements log */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="border-b border-gray-50 pb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
              <History size={16} className="text-gray-500" />
              Journal des Mouvements
            </h2>
            <p className="text-xxs text-gray-500 mt-0.5">Historique des entrées et sorties de matériel.</p>
          </div>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                Aucun mouvement de stock enregistré.
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="text-xs border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-xxs font-mono mb-1">
                    <span className="text-gray-400">{tx.date}</span>
                    <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                      tx.type === 'IN' ? 'bg-green-105 text-green-800 bg-green-100' : 'bg-red-105 text-red-800 bg-red-100'
                    }`}>
                      {tx.type === 'IN' ? 'Entrée (+)' : 'Sortie (-)'}
                    </span>
                  </div>

                  <h4 className="font-bold text-gray-900 line-clamp-1">{tx.itemName}</h4>
                  
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xxs text-gray-500 italic truncate max-w-[150px]">
                      "{tx.reason}"
                    </span>
                    <span className="font-mono font-black text-gray-800">
                      Qté : {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* MODAL 1: Adjust quantity form (IN / OUT manual) */}
      {selectedItemForTx && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-gray-100 shadow-2xl relative space-y-4">
            <button 
              onClick={() => setSelectedItemForTx(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition p-1"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="font-extrabold text-gray-950 text-base">Enregistrer un mouvement de stock</h3>
              <p className="text-xs text-gray-500 mt-0.5">{selectedItemForTx.name}</p>
            </div>

            <form onSubmit={handleTxSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType('IN')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold text-center border cursor-pointer ${
                    txType === 'IN' 
                      ? 'bg-green-50 border-green-300 text-green-800 font-extrabold' 
                      : 'bg-gray-100 border-gray-200 text-gray-500'
                  }`}
                >
                  Entrée (+)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('OUT')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold text-center border cursor-pointer ${
                    txType === 'OUT' 
                      ? 'bg-red-50 border-red-300 text-red-800 font-extrabold' 
                      : 'bg-gray-100 border-gray-200 text-gray-500'
                  }`}
                >
                  Sortie (-)
                </button>
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Quantité</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={txQuantity}
                  onChange={(e) => setTxQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Raison du mouvement</label>
                <input
                  type="text"
                  required
                  value={txReason}
                  onChange={(e) => setTxReason(e.target.value)}
                  placeholder="Ex : Réapprovisionnement, Perte, Cassé"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItemForTx(null)}
                  className="flex-1 py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add completely new item */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 border border-gray-100 shadow-2xl relative space-y-4">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition p-1"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="font-extrabold text-gray-950 text-base">Enregistrer une nouvelle pièce en Stock</h3>
              <p className="text-xs text-gray-500 mt-0.5">Ajouter un nouveau type de composant au catalogue.</p>
            </div>

            <form onSubmit={handleNewItemSubmit} className="space-y-3.5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Code-barres */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Code-Barres EAN (Simulé si vide)</label>
                  <input
                    type="text"
                    value={newBarcode}
                    onChange={(e) => setNewBarcode(e.target.value)}
                    placeholder="Ex: 3256220120110"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2 focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>

                {/* Nom */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-700">Catégorie</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    {categories.filter(c => c !== 'Tous').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nom complet */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Désignation de la pièce</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex : Filtre à Air Boxer 3"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Quantités */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Quantité Initiale</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Seuil Alerte Minimum</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newMinThreshold}
                    onChange={(e) => setNewMinThreshold(parseInt(e.target.value) || 1)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2"
                  />
                </div>
              </div>

              {/* Prix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Prix d'Achat HT ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newPriceBuy}
                    onChange={(e) => setNewPriceBuy(parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Prix de Vente Conseillé HT ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newPriceSell}
                    onChange={(e) => setNewPriceSell(parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs p-2 font-mono"
                  />
                </div>
              </div>

              {/* Emplacement */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Emplacement dans le Fourgon</label>
                <input
                  type="text"
                  required
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Ex : Étagère Droite, Casier C"
                  className="w-full bg-gray-55/75 border border-gray-200 rounded-lg text-xs p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                >
                  Ajouter au catalogue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BARCODE SCANNER INTERACTIVE OVERLAY */}
      {showScanModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-slate-950 text-white rounded-3xl w-full max-w-lg p-6 border border-slate-800 shadow-2xl relative space-y-5">
            <button 
              onClick={() => {
                setShowScanModal(false);
                setCameraActive(false);
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-white transition p-1.5 bg-slate-900 rounded-full"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Barcode size={18} className="text-blue-400" />
                Scanner Code-Barres de Pièces
              </h3>
              <p className="text-xxs text-slate-400">Pointez la caméra vers un code-barres automobile ou utilisez le simulateur rapide ci-dessous.</p>
            </div>

            {/* Video view block and scanner line overlay */}
            <div className="relative aspect-video rounded-2xl bg-black border border-slate-800 overflow-hidden flex items-center justify-center text-center">
              
              {cameraActive && !cameraError ? (
                <>
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  {/* Bounding box animation */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="border-2 border-blue-400 w-48 h-28 relative rounded-xl shadow-2xl animate-pulse">
                      {/* Laser red scan line */}
                      <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] top-1/2 animate-[bounce_2s_infinite]" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 space-y-3">
                  <Camera size={38} className="text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    {cameraError || "Caméra désactivée."}
                  </p>
                  <button
                    onClick={() => {
                      setCameraError(null);
                      setCameraActive(true);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Activer la Caméra Réelle
                  </button>
                </div>
              )}

              {/* Status indicators in camera frames */}
              <div className="absolute bottom-3 left-3 bg-slate-900/80 px-2 py-1 rounded text-xxs flex items-center gap-1.5 border border-slate-800 font-mono">
                <Volume2 size={11} className="text-blue-400" /> Volume : BEEP actif
              </div>
            </div>

            {/* Scanner interactive item results panel */}
            {scanResult ? (
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xxs uppercase tracking-wider font-extrabold text-blue-400 bg-blue-900/40 px-2 py-0.5 rounded border border-blue-800">
                      {scanResult.category}
                    </span>
                    <h4 className="font-extrabold text-xs text-white mt-1.5">{scanResult.name}</h4>
                    <p className="text-xxs font-mono text-slate-400 flex items-center gap-1">
                      Code : <span className="text-white">{scanResult.barcode}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      scanResult.quantity <= scanResult.minThreshold ? 'bg-red-950 text-red-400 border border-red-900' : 'bg-slate-850 text-emerald-400'
                    }`}>
                      Qté en Stock : {scanResult.quantity}
                    </span>
                    <p className="text-xxs text-slate-500 mt-1">Fourgon : {scanResult.location}</p>
                  </div>
                </div>

                {scanResult.id === 'new-scanned-temp' ? (
                  <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700 flex justify-between items-center">
                    <span className="text-xxs text-amber-200">Cette pièce n'existe pas dans l'inventaire actuel.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setNewBarcode(scanResult.barcode);
                        setShowScanModal(false);
                        setCameraActive(false);
                        setShowAddModal(true);
                      }}
                      className="px-2.5 py-1.5 bg-yellow-550 bg-yellow-600 hover:bg-yellow-700 text-slate-950 font-black text-xxs rounded-lg transition"
                    >
                      + Créer la Pièce
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        onUpdateStockQuantity(scanResult.id, 1, 'Entrée directe par Scan de Code-Barres');
                        setScanResult(prev => prev ? { ...prev, quantity: prev.quantity + 1 } : null);
                        playScanBeep();
                      }}
                      className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xxs rounded-lg flex items-center justify-center gap-1 shadow-sm transition"
                    >
                      <Plus size={11} /> +1 Entrée (IN)
                    </button>
                    <button
                      onClick={() => {
                        onUpdateStockQuantity(scanResult.id, -1, 'Sortie directe par Scan de Code-Barres');
                        setScanResult(prev => prev ? { ...prev, quantity: Math.max(0, prev.quantity - 1) } : null);
                        playScanBeep();
                      }}
                      className="flex-1 py-1.5 px-3 bg-red-650 hover:bg-red-700 text-white font-bold text-xxs rounded-lg flex items-center justify-center gap-1 shadow-sm transition"
                    >
                      <Minus size={11} /> -1 Sortie (OUT)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 bg-slate-900/40 rounded-xl text-slate-400 text-xs">
                En attente qu'un code-barres soit centré dans le viseur...
              </div>
            )}

            {/* Test Simulation Panel (Crucial for sandboxed browser environment preview) */}
            <div className="space-y-2.5 border-t border-slate-900 pt-4">
              <span className="block text-xxs font-bold text-slate-500 uppercase tracking-widest">
                ⚙️ Simulateur de Scan (Pratique pour tester sans caméra) :
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto p-1.5 bg-slate-900 rounded-xl">
                {stock.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleBarcodeScanned(item.barcode)}
                    className="px-2 py-1 bg-slate-850 hover:bg-slate-800 text-slate-350 text-xxs rounded-lg border border-slate-800 hover:text-white transition whitespace-nowrap cursor-pointer flex items-center gap-1"
                  >
                    <Barcode size={10} className="text-blue-400" />
                    {item.name.split(' (')[0]}
                  </button>
                ))}
                
                {/* Simulated unknown barcode trigger */}
                <button
                  onClick={() => handleBarcodeScanned('3256220199993')}
                  className="px-2 py-1 bg-amber-950/40 hover:bg-amber-950/60 text-amber-300 border border-amber-900/60 text-xxs rounded-lg transition whitespace-nowrap cursor-pointer"
                >
                  + Nouveau Barcode Inconnu
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setShowScanModal(false);
                  setCameraActive(false);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold px-4 py-2 rounded-xl transition"
              >
                Fermer l'Outil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
