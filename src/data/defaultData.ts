/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StockItem, Client, Intervention, Invoice, ReminderLog, StockTransaction, AppSettings, AppUser, Supplier, SupplierOrder, MonthlyExpense } from '../types';

export const DEFAULT_STOCK: StockItem[] = [];

export const DEFAULT_CLIENTS: Client[] = [];

export const DEFAULT_INTERVENTIONS: Intervention[] = [];

export const DEFAULT_INVOICES: Invoice[] = [];

export const DEFAULT_TRANSACTIONS: StockTransaction[] = [];

export const DEFAULT_REMINDERS: ReminderLog[] = [];

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: "AUTOCARE gestion",
  companyTagline: "Gestion d'Atelier",
  companyLogo: "",
  userName: "Gestionnaire",
  userRole: "Directeur d'Atelier",
  userPhone: "",
  companyEmail: "",
  companyPhone: "",
  companyAddress: "",
  companyCapital: "",
  companyIce: "",
  companyCity: "",
  defaultTaxRate: 20,
  currency: "DH"
};

export const DEFAULT_USERS: AppUser[] = [
  {
    id: 'user-1',
    username: 'admin',
    password: 'admin4321',
    fullName: 'Administrateur',
    role: 'admin'
  }
];

export const DEFAULT_SUPPLIERS: Supplier[] = [];

export const DEFAULT_SUPPLIER_ORDERS: SupplierOrder[] = [];

export const DEFAULT_EXPENSES: MonthlyExpense[] = [];
