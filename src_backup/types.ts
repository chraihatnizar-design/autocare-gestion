/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StockItem {
  id: string;
  barcode: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  priceBuy: number;
  priceSell: number;
  location: string;
}

export interface StockTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'IN' | 'OUT';
  quantity: number;
  date: string;
  reason: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicle: string;
  plate: string;
  address: string;
}

export type InterventionType = 'Entretien' | 'Freinage' | 'Panne' | 'Diagnostic' | 'Pneumatique' | 'Autre';
export type InterventionStatus = 'Scheduled' | 'In_Progress' | 'Completed' | 'Cancelled';

export interface Intervention {
  id: string;
  clientId: string;
  clientName: string;
  vehicle: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: InterventionType;
  description: string;
  status: InterventionStatus;
  priceEstimated: number;
  address: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  type: 'Service' | 'Part';
  partId?: string;
}

export type InvoiceStatus = 'Unpaid' | 'Paid' | 'Overdue';
export type PaymentMethod = 'Cash' | 'Card' | 'Transfer' | 'Check' | 'Bill' | 'Pending';

export interface Invoice {
  id: string; // Dynamic unique ID
  invoiceNumber: string; // Sequenced label e.g., FACT-2026-001
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientVehicle: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  discount: number; // percentage
  taxRate: number; // percentage (e.g. 20%)
  total: number;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  interventionId?: string;
}

export interface ReminderLog {
  id: string;
  clientId: string;
  clientName: string;
  type: 'SMS' | 'Email';
  recipient: string;
  subject?: string;
  content: string;
  date: string;
  status: 'Sent' | 'Failed';
}

export interface AppSettings {
  companyName: string;
  companyTagline: string;
  companyLogo?: string;
  userName: string;
  userRole: string;
  userPhone: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companyCapital: string;
  companyIce: string; // Identifiant Commun de l'Entreprise (Morocco)
  companyCity: string;
  defaultTaxRate: number;
  currency: string;
}

export interface AppUser {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: 'admin' | 'coadmin' | 'staff'; // admin = Admin Master, coadmin = Co-Admin (max 2), staff = Other personnel
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  category: string;
}

export interface SupplierOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  details: string;
  priceHT: number;
  taxRate: number;
  totalTTC: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Pending';
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  dueDate: string;
  paidAmount?: number;
  paymentProofImage?: string;
}

export interface MonthlyExpense {
  id: string;
  label: string;
  amount: number;
  category: string;
  date: string;
  paymentStatus: 'Paid' | 'Unpaid';
  paymentMethod: PaymentMethod;
}



