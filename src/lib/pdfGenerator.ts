// Utilitaire PDF – génération de factures et reçus SCA
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice, Order } from '@/types/index';

// Helper to safely execute autoTable regardless of how it was bundled (CJS, ESM, default export)
function runAutoTable(doc: jsPDF, options: any): void {
  try {
    if (typeof (doc as any).autoTable === 'function') {
      (doc as any).autoTable(options);
    } else if (typeof autoTable === 'function') {
      autoTable(doc, options);
    } else if (typeof (autoTable as any)?.default === 'function') {
      (autoTable as any).default(doc, options);
    } else {
      throw new Error('autoTable plugin is not available');
    }
  } catch (err) {
    console.error('Erreur autoTable PDF:', err);
    throw err;
  }
}

function getFinalY(doc: jsPDF, fallback: number): number {
  return ((doc as any).lastAutoTable?.finalY ?? fallback) + 6;
}

// ── Charge le logo en base64 depuis /logo.png ──
async function loadLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch('/logo.png');
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ── Dessine l'en-tête commun avec logo (ou texte de secours) ──
function drawHeader(doc: jsPDF, logoBase64: string | null): void {
  // Bande fond marine
  doc.setFillColor(15, 34, 64);
  doc.rect(0, 0, 210, 38, 'F');

  if (logoBase64) {
    // Logo image – cadré à gauche, hauteur max 28 mm
    try {
      doc.addImage(logoBase64, 'PNG', 10, 5, 28, 28);
    } catch {
      // Fallback texte si addImage échoue
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('SCA', 14, 18);
    }
    // Texte à côté du logo
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('SCA', 42, 16);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Société du Courant Alternatif', 42, 23);
    doc.text('Électricité générale • Solutions solaires • Matériel électrique', 42, 30);
  } else {
    // Texte seul si pas de logo
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SCA', 14, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Société du Courant Alternatif', 14, 25);
    doc.text('Électricité générale • Solutions solaires • Matériel électrique', 14, 31);
  }

  // Bande rouge accent
  doc.setFillColor(192, 32, 26);
  doc.rect(0, 38, 210, 2, 'F');
}

// ── Dessine le pied de page commun ──
function drawFooter(doc: jsPDF): void {
  const pageH = doc.internal.pageSize.height;
  doc.setFillColor(240, 242, 245);
  doc.rect(0, pageH - 20, 210, 20, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('SCA – Société du Courant Alternatif  |  Haut-Katanga, RDC', 105, pageH - 13, { align: 'center' });
  doc.text('Tél : 085 865 74 75  /  097 528 31 55', 105, pageH - 7, { align: 'center' });
}

export async function generateInvoicePDF(invoice: Invoice): Promise<void> {
  const logoBase64 = await loadLogoBase64();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const order = invoice.orders;
  const client = invoice.orders?.clients || invoice.clients;
  const items = order?.order_items || [];

  drawHeader(doc, logoBase64);

  // ── Titre Facture ──
  doc.setTextColor(192, 32, 26);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE', 140, 54);
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${invoice.invoice_number || 'SCA-FAC'}`, 140, 62);
  doc.text(
    `Date : ${invoice.issued_at
      ? new Date(invoice.issued_at).toLocaleDateString('fr-FR')
      : new Date().toLocaleDateString('fr-FR')}`,
    140, 69
  );

  // ── Infos client ──
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURÉ À', 14, 54);
  doc.setFont('helvetica', 'normal');
  if (client) {
    doc.text(client.full_name || 'Client', 14, 62);
    doc.text(`Tél : ${client.phone || '—'}`, 14, 69);
    if (client.email) doc.text(`Email : ${client.email}`, 14, 76);
    if (client.address) doc.text(`Adresse : ${client.address}`, 14, 83);
  }

  // ── Méta commande ──
  const yMeta = 92;
  doc.setFont('helvetica', 'bold');
  doc.text(`Commande N° ${order?.order_number || '—'}`, 14, yMeta);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Mode : ${order?.delivery_mode === 'livraison' ? 'Livraison à domicile' : 'Retrait en magasin'}`,
    14, yMeta + 6
  );
  const paymentLabel = order?.payment_method === 'airtel_money'
    ? 'Airtel Money (0975283155)'
    : order?.payment_method === 'orange_money'
    ? 'Orange Money (0858657475)'
    : 'Espèces (Cash)';
  doc.text(
    `Règlement : ${paymentLabel}${order?.payment_reference ? `  (Réf : ${order.payment_reference})` : ''}`,
    14, yMeta + 12
  );

  // ── Tableau articles ──
  runAutoTable(doc, {
    startY: yMeta + 18,
    head: [['Réf', 'Désignation', 'Qté', 'Prix Unit.', 'Total']],
    body: items.map((it) => [
      it.product_reference || '—',
      it.product_name || 'Produit',
      it.quantity.toString(),
      `${Number(it.unit_price).toFixed(2)} $`,
      `${Number(it.total).toFixed(2)} $`,
    ]),
    headStyles: { fillColor: [15, 34, 64], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 80 },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 30 },
    },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });

  // ── Totaux ──
  const finalY = getFinalY(doc, yMeta + 30);
  const totalsX = 130;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text('Sous-total :', totalsX, finalY);
  doc.text(`${Number(order?.subtotal || 0).toFixed(2)} $`, 195, finalY, { align: 'right' });
  doc.text('Livraison :', totalsX, finalY + 7);
  doc.text(`${Number(order?.delivery_fee || 0).toFixed(2)} $`, 195, finalY + 7, { align: 'right' });

  doc.setFillColor(15, 34, 64);
  doc.rect(totalsX - 2, finalY + 12, 67, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('TOTAL :', totalsX + 1, finalY + 18);
  doc.text(`${Number(invoice.total || 0).toFixed(2)} $`, 193, finalY + 18, { align: 'right' });

  drawFooter(doc);
  doc.save(`${invoice.invoice_number || 'Facture_SCA'}.pdf`);
}

export async function generateOrderReceiptPDF(order: Order): Promise<void> {
  const logoBase64 = await loadLogoBase64();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const client = order.clients;
  const items = order.order_items || [];

  drawHeader(doc, logoBase64);

  // ── Titre Reçu ──
  doc.setTextColor(192, 32, 26);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('REÇU DE COMMANDE', 120, 54);
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${order.order_number || 'SCA-CMD'}`, 120, 62);
  doc.text(
    `Date : ${order.created_at
      ? new Date(order.created_at).toLocaleDateString('fr-FR')
      : new Date().toLocaleDateString('fr-FR')}`,
    120, 69
  );
  const statusFr: Record<string, string> = {
    en_attente: 'En attente',
    confirme: 'Confirmée',
    en_preparation: 'En préparation',
    livre: 'Livrée',
    annule: 'Annulée',
  };
  doc.text(`Statut : ${statusFr[order.status] || order.status}`, 120, 76);

  // ── Infos client ──
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT', 14, 54);
  doc.setFont('helvetica', 'normal');
  if (client) {
    doc.text(client.full_name || 'Client', 14, 62);
    doc.text(`Tél : ${client.phone || '—'}`, 14, 69);
    if (client.email) doc.text(`Email : ${client.email}`, 14, 76);
    if (client.address) doc.text(`Adresse : ${client.address}`, 14, 83);
  } else {
    doc.text('Client comptoir', 14, 62);
  }

  // ── Mode livraison & Paiement ──
  const yMeta = 92;
  doc.setFont('helvetica', 'bold');
  doc.text('Mode de livraison :', 14, yMeta);
  doc.setFont('helvetica', 'normal');
  doc.text(
    order.delivery_mode === 'livraison'
      ? `Livraison à domicile : ${order.delivery_address || client?.address || '—'}`
      : 'Retrait en magasin (Gratuit)',
    14, yMeta + 6
  );
  const paymentReceiptLabel = order.payment_method === 'airtel_money'
    ? 'Airtel Money (0975283155)'
    : order.payment_method === 'orange_money'
    ? 'Orange Money (0858657475)'
    : 'Espèces (Cash)';
  doc.text(
    `Mode de paiement : ${paymentReceiptLabel}${order.payment_reference ? `  (Réf : ${order.payment_reference})` : ''}`,
    14, yMeta + 12
  );

  // ── Tableau articles ──
  runAutoTable(doc, {
    startY: yMeta + 18,
    head: [['Réf', 'Désignation', 'Qté', 'Prix Unit.', 'Total']],
    body: items.length > 0
      ? items.map((it) => [
          it.product_reference || '—',
          it.product_name || 'Produit',
          it.quantity.toString(),
          `${Number(it.unit_price).toFixed(2)} $`,
          `${Number(it.total).toFixed(2)} $`,
        ])
      : [['—', 'Articles de commande', '1',
          `${Number(order.subtotal).toFixed(2)} $`,
          `${Number(order.subtotal).toFixed(2)} $`]],
    headStyles: { fillColor: [15, 34, 64], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 80 },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 30 },
    },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });

  // ── Totaux ──
  const finalY = getFinalY(doc, yMeta + 30);
  const totalsX = 130;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text('Sous-total :', totalsX, finalY);
  doc.text(`${Number(order.subtotal || 0).toFixed(2)} $`, 195, finalY, { align: 'right' });
  doc.text('Livraison :', totalsX, finalY + 7);
  doc.text(`${Number(order.delivery_fee || 0).toFixed(2)} $`, 195, finalY + 7, { align: 'right' });

  doc.setFillColor(15, 34, 64);
  doc.rect(totalsX - 2, finalY + 12, 67, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('TOTAL :', totalsX + 1, finalY + 18);
  doc.text(`${Number(order.total || 0).toFixed(2)} $`, 193, finalY + 18, { align: 'right' });

  drawFooter(doc);
  doc.save(`Recu_${order.order_number || 'SCA-CMD'}.pdf`);
}
