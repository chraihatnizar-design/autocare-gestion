-- SQL Schema for Autocare Management System - Migrating to Supabase PostgreSQL
-- Copy and paste this script directly into the Supabase SQL Editor (https://supabase.com) for your project.

-- 1. Table: clients
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    vehicle TEXT NOT NULL,
    plate TEXT NOT NULL,
    address TEXT NOT NULL,
    "clientType" TEXT DEFAULT 'Particulier',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table: stock
CREATE TABLE IF NOT EXISTS stock (
    id TEXT PRIMARY KEY,
    barcode TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 0,
    "minThreshold" NUMERIC NOT NULL DEFAULT 0,
    "priceBuy" NUMERIC NOT NULL DEFAULT 0,
    "priceSell" NUMERIC NOT NULL DEFAULT 0,
    location TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table: stock_transactions
CREATE TABLE IF NOT EXISTS stock_transactions (
    id TEXT PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
    quantity NUMERIC NOT NULL DEFAULT 1,
    date TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table: users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT,
    "fullName" TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'coadmin', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table: interventions
CREATE TABLE IF NOT EXISTS interventions (
    id TEXT PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    vehicle TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Scheduled',
    "priceEstimated" NUMERIC DEFAULT 0,
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Table: quotes
CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,
    "quoteNumber" TEXT NOT NULL UNIQUE,
    "clientId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "clientVehicle" TEXT NOT NULL,
    "vehicleMileage" TEXT,
    "vehicleBrand" TEXT,
    "vehicleModel" TEXT,
    "vehicleRegistration" TEXT,
    "publicNotes" TEXT,
    "privateNotes" TEXT,
    date TEXT NOT NULL,
    "validUntil" TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    discount NUMERIC NOT NULL DEFAULT 0,
    "taxRate" NUMERIC NOT NULL DEFAULT 20,
    total NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Pending',
    "invoiceId" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Table: invoices
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL UNIQUE,
    "clientId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "clientVehicle" TEXT NOT NULL,
    "vehicleMileage" TEXT,
    "vehicleBrand" TEXT,
    "vehicleModel" TEXT,
    "vehicleRegistration" TEXT,
    "publicNotes" TEXT,
    "privateNotes" TEXT,
    date TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    discount NUMERIC NOT NULL DEFAULT 0,
    "taxRate" NUMERIC NOT NULL DEFAULT 20,
    total NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Unpaid',
    "paymentMethod" TEXT NOT NULL DEFAULT 'Pending',
    "paymentDate" TEXT,
    "interventionId" TEXT,
    "quoteId" TEXT,
    "quoteNumber" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Table: reminders (represented in ts as ReminderLog)
CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('SMS', 'Email')),
    recipient TEXT NOT NULL,
    subject TEXT,
    content TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Table: suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Table: supplier_orders
CREATE TABLE IF NOT EXISTS supplier_orders (
    id TEXT PRIMARY KEY,
    "orderNumber" TEXT NOT NULL UNIQUE,
    "supplierId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "orderDate" TEXT NOT NULL,
    details TEXT NOT NULL,
    "priceHT" NUMERIC NOT NULL DEFAULT 0,
    "taxRate" NUMERIC NOT NULL DEFAULT 20,
    "totalTTC" NUMERIC NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'Pending',
    "paymentMethod" TEXT NOT NULL DEFAULT 'Pending',
    "paymentDate" TEXT,
    "dueDate" TEXT NOT NULL,
    "paidAmount" NUMERIC,
    "paymentProofImage" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Table: expenses (MonthlyExpense)
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'Unpaid',
    "paymentMethod" TEXT NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Table: settings
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY, -- will hold 'global' for the one row
    company_name TEXT,
    company_tagline TEXT,
    company_logo TEXT,
    user_name TEXT,
    user_role TEXT,
    user_phone TEXT,
    company_email TEXT,
    company_phone TEXT,
    company_address TEXT,
    company_capital TEXT,
    company_ice TEXT,
    company_city TEXT,
    default_tax_rate NUMERIC,
    currency TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS (Optional, can also just keep fully open for this internal app initially)
-- For maximum ease, we can configure Supabase policies to allow everything for public/anon Initially:
-- You can run these commands if Row Level Security (RLS) is enabled and you want simple open access:
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create Open Policies for ALL tables (Allows public access for simplicity, edit as needed for auth roles!)
CREATE POLICY "Allow public read-write on clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on stock" ON stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on stock_transactions" ON stock_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on interventions" ON interventions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on quotes" ON quotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on reminders" ON reminders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on supplier_orders" ON supplier_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on settings" ON settings FOR ALL USING (true) WITH CHECK (true);
