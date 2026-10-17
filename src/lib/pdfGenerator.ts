import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice, Order, Quote } from '@/types/index';

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
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('SCA', 14, 18);
    }
    // Texte à côté du logo
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('SCA – Société du Courant Alternatif', 42, 14);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(220, 225, 235);
    doc.text('« Disponibilité • Qualité • Accessibilité »  —  « L\'avenir de demain »', 42, 21);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Électricité générale • Solutions solaires & hybrides • Matériel électrique & Ingénierie', 42, 28);
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('SCA – Société du Courant Alternatif', 14, 14);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(220, 225, 235);
    doc.text('« Disponibilité • Qualité • Accessibilité »  —  « L\'avenir de demain »', 14, 21);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Électricité générale • Solutions solaires & hybrides • Matériel électrique & Ingénierie', 14, 28);
  }

  // Bande rouge accent
  doc.setFillColor(192, 32, 26);
  doc.rect(0, 38, 210, 2.5, 'F');
}

// ── Dessine le pied de page commun ──
function drawFooter(doc: jsPDF): void {
  const pageH = doc.internal.pageSize.height;
  doc.setFillColor(240, 242, 245);
  doc.rect(0, pageH - 18, 210, 18, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('SCA – Société du Courant Alternatif  |  Haut-Katanga, RDC  |  « L\'avenir de demain »', 105, pageH - 11, { align: 'center' });
  doc.text('Tél : 085 865 74 75  /  097 528 31 55  •  Direction : Ing. Juniace Atanaz', 105, pageH - 5, { align: 'center' });
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

  // ── Signatures Client (Gauche) & Direction SCA (Droite) ──
  let signY = finalY + 28;
  const pageH = doc.internal.pageSize.height;
  if (signY + 34 > pageH - 18) {
    doc.addPage();
    signY = 30;
  }

  const signBoxW = 78;
  const signBoxH = 18;

  // 1. Côté Gauche : Signature pour le Client
  const signLeftX = 14;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 34, 64);
  doc.text('POUR LE CLIENT', signLeftX, signY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 34, 64);
  doc.text(client?.full_name || 'Client', signLeftX, signY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(7.5);
  doc.text('Accusé de réception & Signature', signLeftX, signY + 9.5);

  doc.setDrawColor(180, 190, 205);
  doc.setLineDashPattern([2, 1], 0);
  doc.rect(signLeftX, signY + 12, signBoxW, signBoxH, 'D');
  doc.setLineDashPattern([], 0);
  doc.setFontSize(7);
  doc.setTextColor(140, 145, 155);
  doc.setFont('helvetica', 'italic');
  doc.text('Date et signature du client', signLeftX + signBoxW / 2, signY + 22, { align: 'center' });

  // 2. Côté Droit : Signature Ingénieur Juniace (Direction SCA)
  const signRightX = 118;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 34, 64);
  doc.text('POUR LA SOCIÉTÉ DU COURANT ALTERNATIF', signRightX, signY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(192, 32, 26);
  doc.text('Ingénieur Juniace Atanaz', signRightX, signY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(7.5);
  doc.text('Direction Technique & Commerciale', signRightX, signY + 9.5);

  doc.setDrawColor(180, 190, 205);
  doc.setLineDashPattern([2, 1], 0);
  doc.rect(signRightX, signY + 12, signBoxW, signBoxH, 'D');
  doc.setLineDashPattern([], 0);
  doc.setFontSize(7);
  doc.setTextColor(140, 145, 155);
  doc.setFont('helvetica', 'italic');
  doc.text('Emplacement signature et cachet SCA', signRightX + signBoxW / 2, signY + 22, { align: 'center' });

  drawFooter(doc);
  doc.save(`Recu_${order.order_number || 'SCA-CMD'}.pdf`);
}

export async function generateQuotePDF(quote: Quote): Promise<void> {
  const logoBase64 = await loadLogoBase64();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const currencySymbol = quote.currency === 'CDF' ? 'FC' : '$';

  const formatCurr = (val: number | undefined | null) => {
    const num = Number(val) || 0;
    return `${num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}`;
  };

  const statusLabels: Record<string, string> = {
    brouillon: 'Brouillon',
    envoye: 'Envoyé au client',
    accepte: 'Accepté / Validé',
    refuse: 'Refusé',
    expire: 'Expiré',
    nouveau: 'Nouveau',
    en_cours: 'En cours d\'étude',
    traite: 'Traité',
    rejete: 'Rejeté',
  };

  // ── Page 1 Header ──
  drawHeader(doc, logoBase64);

  // ── Titre Devis & Métadonnées ──
  doc.setTextColor(192, 32, 26);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DEVIS PROFESSIONNEL', 130, 48);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° Devis : ${quote.quote_number || 'DEV-SCA'}`, 130, 54);
  doc.text(
    `Date d'émission : ${quote.created_at
      ? new Date(quote.created_at).toLocaleDateString('fr-FR')
      : new Date().toLocaleDateString('fr-FR')}`,
    130, 60
  );
  doc.text(`Validité de l'offre : ${quote.validity_days || 30} jours`, 130, 66);
  doc.text(`Statut : ${statusLabels[quote.status] || quote.status}`, 130, 72);

  // ── Encadré Client & Chantier ──
  // Bloc Client (Gauche)
  doc.setFillColor(248, 250, 253);
  doc.roundedRect(14, 44, 108, 38, 2, 2, 'F');
  doc.setDrawColor(215, 222, 235);
  doc.roundedRect(14, 44, 108, 38, 2, 2, 'D');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 34, 64);
  doc.text('INFORMATIONS CLIENT', 18, 50);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(8);
  doc.text(`Client : ${quote.full_name || 'Client comptoir'}`, 18, 56);
  doc.text(`Téléphone : ${quote.phone || '—'}`, 18, 62);
  if (quote.email) doc.text(`Email : ${quote.email}`, 18, 68);
  if (quote.address) {
    const splitAddr = doc.splitTextToSize(`Adresse : ${quote.address}`, 100);
    doc.text(splitAddr, 18, 74);
  }

  // Ligne Lieu des travaux si précisé
  const yStartTable = quote.work_location || quote.project_type ? 86 : 84;
  if (quote.work_location || quote.project_type) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 34, 64);
    doc.text('OBJET & CHANTIER :', 14, 85);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const projDesc = `${quote.project_type || 'Prestation générale'}${quote.work_location ? ` — Lieu des travaux : ${quote.work_location}` : ''}`;
    doc.text(projDesc, 52, 85);
  }

  // ── Préparation du tableau des fournitures & prestations ──
  const items = quote.items && quote.items.length > 0 ? quote.items : [];

  let tableHead: string[][];
  let tableBody: string[][];

  if (items.length > 0) {
    tableHead = [['N°', 'Réf.', 'Désignation & Spécifications', 'Unité', 'Qté', 'P.U.', 'Montant Total']];
    tableBody = items.map((it, idx) => [
      String(idx + 1),
      it.reference || '—',
      it.designation + (it.description ? `\n${it.description}` : ''),
      it.unit || 'pcs',
      String(it.quantity),
      formatCurr(it.unit_price),
      formatCurr(it.total || it.quantity * it.unit_price),
    ]);
  } else {
    tableHead = [['Section', 'Détails de la demande & Fournitures prévues']];
    tableBody = [
      ['Prestation / Projet', quote.project_type || 'Installation'],
      ['Description des besoins & Spécifications', quote.description || 'Selon cahier des charges client.'],
      ...(quote.admin_notes ? [['Notes d\'évaluation & Estimations', quote.admin_notes]] : []),
    ];
  }

  runAutoTable(doc, {
    startY: yStartTable + 4,
    head: tableHead,
    body: tableBody,
    showHead: 'everyPage',
    headStyles: {
      fillColor: [15, 34, 64],
      textColor: 255,
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: { fillColor: [248, 250, 253] },
    columnStyles: items.length > 0
      ? {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 20 },
          2: { cellWidth: 78 },
          3: { cellWidth: 16, halign: 'center' },
          4: { cellWidth: 14, halign: 'center' },
          5: { cellWidth: 23, halign: 'right' },
          6: { cellWidth: 23, halign: 'right', fontStyle: 'bold' },
        }
      : {
          0: { cellWidth: 50, fontStyle: 'bold' },
          1: { cellWidth: 132 },
        },
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
    margin: { top: 44, bottom: 24, left: 14, right: 14 },
    didDrawPage: (data: any) => {
      // Pour les pages 2+, dessiner un en-tête compact
      if (data.pageNumber > 1) {
        doc.setFillColor(15, 34, 64);
        doc.rect(0, 0, 210, 16, 'F');
        doc.setFillColor(192, 32, 26);
        doc.rect(0, 16, 210, 1.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`SCA – Devis N° ${quote.quote_number || 'DEV-SCA'} | Client : ${quote.full_name || 'Client'}`, 14, 11);
      }
      drawFooter(doc);
    },
  });

  let currentY = getFinalY(doc, yStartTable + 40);

  // Vérifier s'il reste assez de place pour les totaux, conditions et signatures, sinon nouvelle page
  if (currentY > 180) {
    doc.addPage();
    doc.setFillColor(15, 34, 64);
    doc.rect(0, 0, 210, 16, 'F');
    doc.setFillColor(192, 32, 26);
    doc.rect(0, 16, 210, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`SCA – Devis N° ${quote.quote_number || 'DEV-SCA'} | Synthèse financière & Validation`, 14, 11);
    drawFooter(doc);
    currentY = 24;
  }

  // ── Tableau Récapitulatif Financier (À droite) ──
  const totalsX = 125;
  const subtotal = quote.subtotal ?? (quote.items ? quote.items.reduce((acc, it) => acc + (it.total || it.quantity * it.unit_price), 0) : quote.total_amount || 0);
  const discountVal = Number(quote.discount) || 0;
  const transportVal = Number(quote.transport_fee) || 0;
  const totalGeneral = quote.total_amount ?? Math.max(0, subtotal - discountVal + transportVal);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);

  doc.text('Sous-total fournitures & services :', totalsX, currentY);
  doc.text(formatCurr(subtotal), 195, currentY, { align: 'right' });

  if (discountVal > 0) {
    currentY += 5;
    doc.setTextColor(192, 32, 26);
    doc.text('Remise commerciale :', totalsX, currentY);
    doc.text(`- ${formatCurr(discountVal)}`, 195, currentY, { align: 'right' });
    doc.setTextColor(40, 40, 40);
  }

  if (transportVal > 0) {
    currentY += 5;
    doc.text('Frais de transport / Déplacement :', totalsX, currentY);
    doc.text(formatCurr(transportVal), 195, currentY, { align: 'right' });
  }

  // Cadre Total Général
  currentY += 7;
  doc.setFillColor(15, 34, 64);
  doc.rect(totalsX - 3, currentY - 4.5, 74, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.text('TOTAL GÉNÉRAL :', totalsX, currentY + 1.5);
  doc.text(formatCurr(totalGeneral), 193, currentY + 1.5, { align: 'right' });

  currentY += 12;

  // ── Conditions & Observations (Sur toute la largeur) ──
  const fullWidth = 182;
  doc.setFillColor(248, 250, 253);
  doc.roundedRect(14, currentY - 6, fullWidth, 22, 1.5, 1.5, 'F');
  doc.setDrawColor(215, 222, 235);
  doc.roundedRect(14, currentY - 6, fullWidth, 22, 1.5, 1.5, 'D');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 34, 64);
  doc.text('CONDITIONS CONTRACTUELLES & DÉLAIS', 18, currentY - 1.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);

  // Colonne 1 gauche
  doc.text(`• Règlement : ${quote.payment_terms || '60% à la commande, solde à la livraison / réception.'}`, 18, currentY + 3.5);
  doc.text(`• Délai d'exécution : ${quote.execution_delay || '3 à 7 jours ouvrés après confirmation.'}`, 18, currentY + 8.5);

  // Colonne 2 droite
  doc.text(`• Validité de l'offre : ${quote.validity_days || 30} jours à compter de la date d'émission.`, 110, currentY + 3.5);
  if (quote.observations) {
    const obsShort = doc.splitTextToSize(`• Note : ${quote.observations}`, 82);
    doc.text(obsShort, 110, currentY + 8.5);
  } else {
    doc.text('• Travaux exécutés selon les normes de sécurité électrique SCA.', 110, currentY + 8.5);
  }

  currentY += 22;

  // Vérifier place pour signatures
  if (currentY + 32 > 275) {
    doc.addPage();
    currentY = 25;
  }

  // ── Double Signatures : Client à gauche & SCA / Admin à droite ──
  const signBoxW = 82;
  const signBoxH = 18;

  // 1. Signature Client (Gauche)
  const signClientX = 14;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 34, 64);
  doc.text('POUR LE CLIENT (ACCORD & BON POUR COMMANDE)', signClientX, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 34, 64);
  doc.text(quote.full_name || 'Client', signClientX, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(7);
  doc.text('Mention « Bon pour accord » et signature', signClientX, currentY + 8.5);

  doc.setDrawColor(180, 190, 205);
  doc.setLineDashPattern([2, 1], 0);
  doc.rect(signClientX, currentY + 10.5, signBoxW, signBoxH, 'D');
  doc.setLineDashPattern([], 0);
  doc.setFontSize(7);
  doc.setTextColor(140, 145, 155);
  doc.setFont('helvetica', 'italic');
  doc.text('Date et signature du client', signClientX + signBoxW / 2, currentY + 20.5, { align: 'center' });

  // 2. Signature Direction SCA (Droite)
  const signScaX = 114;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 34, 64);
  doc.text('POUR LA SOCIÉTÉ DU COURANT ALTERNATIF', signScaX, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(192, 32, 26);
  doc.text(quote.responsible_name || 'Ingénieur Juniace Atanaz', signScaX, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(7);
  doc.text('Direction Technique & Commerciale', signScaX, currentY + 8.5);

  doc.setDrawColor(180, 190, 205);
  doc.setLineDashPattern([2, 1], 0);
  doc.rect(signScaX, currentY + 10.5, signBoxW, signBoxH, 'D');
  doc.setLineDashPattern([], 0);
  doc.setFontSize(7);
  doc.setTextColor(140, 145, 155);
  doc.setFont('helvetica', 'italic');
  doc.text('Emplacement signature et cachet SCA', signScaX + signBoxW / 2, currentY + 20.5, { align: 'center' });

  drawFooter(doc);

  // Sauvegarde
  doc.save(`${quote.quote_number || 'Devis_SCA'}.pdf`);
}
