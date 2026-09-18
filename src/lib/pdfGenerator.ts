// Utilitaire PDF – génération de factures SCA
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice } from '@/types/index';

export function generateInvoicePDF(invoice: Invoice): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const order = invoice.orders;
  const client = invoice.orders?.clients || invoice.clients;
  const items = order?.order_items || [];

  // ── Header band ──
  doc.setFillColor(15, 34, 64); // deep navy
  doc.rect(0, 0, 210, 38, 'F');

  // Logo placeholder text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SCA', 14, 18);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Société du Courant Alternatif', 14, 25);
  doc.text('Électricité générale • Solutions solaires • Matériel électrique', 14, 31);

  // Red accent stripe
  doc.setFillColor(192, 32, 26);
  doc.rect(0, 38, 210, 2, 'F');

  // ── Invoice title ──
  doc.setTextColor(192, 32, 26);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE', 140, 54);
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${invoice.invoice_number}`, 140, 62);
  doc.text(`Date : ${new Date(invoice.issued_at).toLocaleDateString('fr-FR')}`, 140, 69);

  // ── Client info ──
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURÉ À', 14, 54);
  doc.setFont('helvetica', 'normal');
  if (client) {
    doc.text(client.full_name || '', 14, 62);
    doc.text(`Tél: ${client.phone || ''}`, 14, 69);
    if (client.email) doc.text(`Email: ${client.email}`, 14, 76);
    if (client.address) doc.text(`Adresse: ${client.address}`, 14, 83);
  }

  // ── Order meta ──
  const yMeta = 92;
  doc.setFont('helvetica', 'bold');
  doc.text(`Commande N° ${order?.order_number || ''}`, 14, yMeta);
  doc.setFont('helvetica', 'normal');
  doc.text(`Mode : ${order?.delivery_mode === 'livraison' ? 'Livraison à domicile' : 'Retrait en magasin'}`, 14, yMeta + 7);

  // ── Items table ──
  autoTable(doc, {
    startY: yMeta + 16,
    head: [['Réf', 'Désignation', 'Qté', 'Prix Unit.', 'Total']],
    body: items.map((it) => [
      it.product_reference,
      it.product_name,
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

  // ── Totals ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY + 6;
  const totalsX = 130;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Sous-total :', totalsX, finalY);
  doc.text(`${Number(order?.subtotal || 0).toFixed(2)} $`, 195, finalY, { align: 'right' });

  doc.text('Livraison :', totalsX, finalY + 7);
  doc.text(`${Number(order?.delivery_fee || 0).toFixed(2)} $`, 195, finalY + 7, { align: 'right' });

  // Total line
  doc.setFillColor(15, 34, 64);
  doc.rect(totalsX - 2, finalY + 12, 67, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('TOTAL :', totalsX + 1, finalY + 18);
  doc.text(`${Number(invoice.total).toFixed(2)} $`, 193, finalY + 18, { align: 'right' });

  // ── Footer ──
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const pageH = doc.internal.pageSize.height;
  doc.setFillColor(240, 242, 245);
  doc.rect(0, pageH - 20, 210, 20, 'F');
  doc.setTextColor(80, 80, 80);
  doc.text('SCA – Société du Courant Alternatif  |  Haut-Katanga, RDC', 105, pageH - 13, { align: 'center' });
  doc.text('📞 085 865 74 75  /  097 528 31 55', 105, pageH - 7, { align: 'center' });

  doc.save(`${invoice.invoice_number}.pdf`);
}
