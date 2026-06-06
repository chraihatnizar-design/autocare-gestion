/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { Invoice } from '../types';

export function generateInvoicePDF(invoice: Invoice): void {
  // Read saved settings
  let settings: any = null;
  try {
    const saved = localStorage.getItem('autocare_settings');
    if (saved) settings = JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }

  const companyName = (settings?.companyName || 'AUTOCARE gestion').toUpperCase();
  const companyTagline = settings?.companyTagline || 'Gestion d\'Atelier & Service Mobile';
  const companyPhone = settings?.companyPhone || '';
  const companyEmail = settings?.companyEmail || '';
  const companyAddress = settings?.companyAddress || '';
  const companyCity = settings?.companyCity || "Casablanca";
  const companyCapital = settings?.companyCapital || '50 000 DH';
  const companyIce = settings?.companyIce || '001548239000182';
  const currency = settings?.currency || 'DH';

  // Initialize standard A4 PDF: portrait, mm, a4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Color Palette Definitions
  const PRIMARY_COLOR = [31, 41, 55]; // Gray 800
  const SECONDARY_COLOR = [75, 85, 99]; // Gray 600
  const ACCENT_COLOR = [37, 99, 235]; // Blue 600
  const LIGHT_BG = [243, 244, 246]; // Gray 100
  const TEXT_DARK = [17, 24, 39]; // Gray 900

  // Margins
  const marginX = 20;
  let currentY = 20;

  // Helpers
  const drawLine = (y: number, color = [229, 231, 235]) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.line(marginX, y, 210 - marginX, y);
  };

  // --- HEADER SECTION ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.text(companyName, marginX, currentY);

  // Add Company Logo in top-right corner if uploaded or draw vector logo fallback
  if (settings?.companyLogo) {
    try {
      let format = 'PNG';
      if (settings.companyLogo.includes('image/jpeg') || settings.companyLogo.includes('image/jpg')) {
        format = 'JPEG';
      } else if (settings.companyLogo.includes('image/webp')) {
        format = 'WEBP';
      }
      doc.addImage(settings.companyLogo, format, 150, 15, 38, 15, undefined, 'FAST');
    } catch (err) {
      console.error("Erreur d'insertion du logo au fichier PDF:", err);
    }
  } else {
    // Generate a beautiful, high-contrast, professional vector logo badge fallback
    doc.setFillColor(17, 24, 39); // Gray 900
    doc.rect(148, 15, 42, 14, 'F');
    
    doc.setDrawColor(37, 99, 235); // Accent Blue
    doc.setLineWidth(0.6);
    doc.line(151, 22, 157, 22);
    doc.circle(154, 22, 1.2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('MÉCANIQUE', 171, 21.5, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(156, 163, 175); // gray-400
    doc.text('MOBILE LOGO', 171, 25, { align: 'center' });

    doc.setFillColor(37, 99, 235);
    doc.rect(148, 28, 42, 1, 'F');
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(SECONDARY_COLOR[0], SECONDARY_COLOR[1], SECONDARY_COLOR[2]);
  currentY += 6;
  doc.text(companyTagline, marginX, currentY);
  currentY += 4;
  doc.text(`Tél : ${companyPhone}  |  Email : ${companyEmail}`, marginX, currentY);
  currentY += 4;
  doc.text(`Adresse : ${companyAddress}, ${companyCity}  |  ICE : ${companyIce}`, marginX, currentY);

  // Decorative Accent bar
  currentY += 6;
  doc.setFillColor(ACCENT_COLOR[0], ACCENT_COLOR[1], ACCENT_COLOR[2]);
  doc.rect(marginX, currentY, 210 - (marginX * 2), 2, 'F');
  currentY += 12;

  // --- INVOICE INFO & CLIENT INFO (Two Columns) ---
  const colLeftX = marginX;
  const colRightX = 115;
  const infoSectionY = currentY;

  // Left Column - Invoice specs
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.text(`FACTURE N° : ${invoice.invoiceNumber}`, colLeftX, currentY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  
  currentY += 7;
  doc.text(`Date d'émission : ${invoice.date}`, colLeftX, currentY);
  currentY += 5;
  doc.text(`Date d'échéance : ${invoice.dueDate}`, colLeftX, currentY);
  currentY += 5;
  doc.text(`Règlement : ${invoice.paymentMethod === 'Pending' ? 'En attente' : invoice.paymentMethod}`, colLeftX, currentY);
  
  // Status Banner
  currentY += 7;
  if (invoice.status === 'Paid') {
    doc.setFillColor(34, 197, 94); // Green 500
    doc.setTextColor(255, 255, 255);
    doc.rect(colLeftX, currentY - 4, 32, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('PAYÉE', colLeftX + 10, currentY);
  } else {
    doc.setFillColor(239, 68, 68); // Red 500
    doc.setTextColor(255, 255, 255);
    doc.rect(colLeftX, currentY - 4, 32, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('À PAYER', colLeftX + 8, currentY);
  }

  // Right Column - Client Info
  currentY = infoSectionY;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.text('DESTINATAIRE :', colRightX, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  
  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.clientName, colRightX, currentY);
  
  doc.setFont('helvetica', 'normal');
  currentY += 5;
  doc.text(`Tél : ${invoice.clientPhone}`, colRightX, currentY);
  currentY += 5;
  doc.text(`Email : ${invoice.clientEmail}`, colRightX, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'oblique');
  doc.text(`Véhicule : ${invoice.clientVehicle}`, colRightX, currentY);

  // Reset standard text styling
  doc.setFont('helvetica', 'normal');
  currentY = Math.max(currentY + 15, infoSectionY + 35);

  // --- ITEMS TABLE ---
  drawLine(currentY - 3);

  // Table Headers
  doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
  doc.rect(marginX, currentY - 1, 210 - (marginX * 2), 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  
  doc.text('Description / Service / Pièce', marginX + 3, currentY + 3.5);
  doc.text('Catégorie', 110, currentY + 3.5);
  doc.text('Qté', 140, currentY + 3.5);
  doc.text('P.U. HT', 155, currentY + 3.5);
  doc.text('Total HT', 180, currentY + 3.5);

  currentY += 6;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);

  let subtotalHT = 0;

  invoice.items.forEach((item, index) => {
    // Alternating rows bg
    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(marginX, currentY, 210 - (marginX * 2), 7, 'F');
    }
    
    const rowTotalHT = item.quantity * item.unitPrice;
    subtotalHT += rowTotalHT;

    // Truncate name if too long for layout
    const cleanName = item.name.length > 45 ? item.name.slice(0, 42) + '...' : item.name;
    const catText = item.type === 'Part' ? 'Pièce' : 'Main d\'œuvre';

    doc.text(cleanName, marginX + 3, currentY + 5);
    doc.text(catText, 110, currentY + 5);
    doc.text(item.quantity.toString(), 142, currentY + 5);
    doc.text(`${item.unitPrice.toFixed(2)} ${currency}`, 155, currentY + 5);
    doc.text(`${rowTotalHT.toFixed(2)} ${currency}`, 180, currentY + 5);

    currentY += 7;
  });

  drawLine(currentY + 2);
  currentY += 12; // Extra professional spacing

  // --- TOTALS CALCULATION BOX (BOTTOM-RIGHT ALIGNMENT) ---
  const totalsX = 130;
  
  // Calculate specific values
  const discountAmount = subtotalHT * (invoice.discount / 100);
  const totalHTAfterDiscount = subtotalHT - discountAmount;
  const taxAmount = totalHTAfterDiscount * (invoice.taxRate / 100);
  const calculatedTotalTTC = totalHTAfterDiscount + taxAmount;

  doc.setFontSize(9.5);
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);

  doc.text('Sous-Total HT :', totalsX, currentY);
  doc.text(`${subtotalHT.toFixed(2)} ${currency}`, 180, currentY);

  if (invoice.discount > 0) {
    currentY += 5.5;
    doc.setFont('helvetica', 'oblique');
    doc.text(`Remise (${invoice.discount}%) :`, totalsX, currentY);
    doc.text(`-${discountAmount.toFixed(2)} ${currency}`, 180, currentY);
    doc.setFont('helvetica', 'normal');
  }

  currentY += 5.5;
  doc.text(`TVA (${invoice.taxRate}%) :`, totalsX, currentY);
  doc.text(`${taxAmount.toFixed(2)} ${currency}`, 180, currentY);

  // Big total band
  currentY += 5;
  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(totalsX - 5, currentY, 210 - marginX - (totalsX - 5), 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL TTC :', totalsX, currentY + 5.5);
  doc.text(`${calculatedTotalTTC.toFixed(2)} ${currency}`, 180, currentY + 5.5);

  // --- FOOTER NOTE / PAYMENTS POLICY ---
  currentY = 265;
  drawLine(currentY - 4);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.text('Merci pour votre confiance !', 105, currentY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(SECONDARY_COLOR[0], SECONDARY_COLOR[1], SECONDARY_COLOR[2]);
  currentY += 4;
  doc.text(`${settings?.companyName || 'Atelier Mécanique Mobile'} - Societé au capital de ${companyCapital} - ICE: ${companyIce} - Ville: ${companyCity}`, 105, currentY, { align: 'center' });
  currentY += 3.5;
  doc.text('Conditions de règlement : Paiement à la réception des travaux. Pénalités de retard : 10% par an.', 105, currentY, { align: 'center' });

  // Download Action
  doc.save(`Facture_${invoice.invoiceNumber}.pdf`);
}
