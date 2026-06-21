import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatDate } from '@/lib/formatDate';

interface PdfArticle {
  nom: string;
  quantite: number;
  prix_unitaire: number;
  /** Taux TVA spécifique à la ligne (en %). Si non défini, on utilise data.tva_pct */
  tva_pct?: number;
}

interface PdfClient {
  nom?: string | null;
  ninea?: string | null;
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
}

interface PdfData {
  type: 'facture' | 'devis' | 'recu' | 'avoir';
  numero: string;
  date: string;
  echeance?: string | null;
  date_livraison?: string | null;
  validite_jours?: number;
  client: string;
  clientDetails?: PdfClient | null;
  articles: PdfArticle[];
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  tva_pct: number;
  /** Pourcentage de retenue à la source (BRS 5% au Sénégal). 0 si non applicable. */
  retenue_source_pct?: number;
  montant_retenue?: number;
  net_a_payer?: number;
  mode_paiement?: string | null;
  notes?: string | null;
  conditions_paiement?: string | null;
  penalites_retard?: string | null;
  // Recu-specific
  reference?: string | null;
  description?: string | null;
  facture_ref?: string | null;
  // Avoir-specific
  motif?: string | null;
  entreprise?: {
    nom?: string;
    adresse?: string | null;
    telephone?: string | null;
    email?: string | null;
    ninea?: string | null;
    rccm?: string | null;
    regime_fiscal?: string | null;
    devise?: string;
    logo_url?: string | null;
  } | null;
}

function esc(str: string | number | null | undefined): string {
  if (str === null || str === undefined || str === '') return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const fmt = (n: number, devise = 'FCFA') =>
  new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' ' + esc(devise);

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '';
  try { return formatDate(d); } catch { return esc(d); }
};

export type { PdfData };

export function generatePdfHtml(data: PdfData): string {
  const devise = data.entreprise?.devise || 'FCFA';
  const titleMap = { facture: 'FACTURE', devis: 'DEVIS', recu: 'REÇU', avoir: 'AVOIR' } as const;
  const title = titleMap[data.type];
  const articles = Array.isArray(data.articles) ? data.articles as PdfArticle[] : [];
  const companyName = esc(data.entreprise?.nom) || 'Mon Entreprise';
  const defaultTva = data.tva_pct ?? 0;

  // Récap TVA par taux (regroupe les lignes par taux)
  const tvaGroups = new Map<number, { base: number; tva: number }>();
  articles.forEach(a => {
    const rate = a.tva_pct ?? defaultTva;
    const base = (a.quantite || 0) * (a.prix_unitaire || 0);
    const t = base * rate / 100;
    const cur = tvaGroups.get(rate) || { base: 0, tva: 0 };
    cur.base += base;
    cur.tva += t;
    tvaGroups.set(rate, cur);
  });
  const sortedRates = Array.from(tvaGroups.keys()).sort((a, b) => a - b);

  const retenuePct = data.retenue_source_pct ?? 0;
  const retenueAmount = data.montant_retenue ?? (retenuePct > 0 ? Math.round(data.montant_ht * retenuePct / 100) : 0);
  const netAPayer = data.net_a_payer ?? (data.montant_ttc - retenueAmount);

  // Footer info parts
  const footerParts: string[] = [companyName];
  if (data.entreprise?.adresse) footerParts.push(esc(data.entreprise.adresse));
  if (data.entreprise?.telephone) footerParts.push('Tél: ' + esc(data.entreprise.telephone));
  if (data.entreprise?.email) footerParts.push(esc(data.entreprise.email));
  if (data.entreprise?.ninea) footerParts.push('NINEA: ' + esc(data.entreprise.ninea));
  if (data.entreprise?.rccm) footerParts.push('RCCM: ' + esc(data.entreprise.rccm));
  if (data.entreprise?.regime_fiscal) footerParts.push('Régime: ' + esc(data.entreprise.regime_fiscal));

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<title>${esc(title)} ${esc(data.numero)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a2e; padding: 40px; font-size: 12px; display: flex; flex-direction: column; min-height: 100vh; width: 794px; }
  .header { display: flex; justify-content: space-between; margin-bottom: 28px; }
  .company { max-width: 55%; display: flex; align-items: flex-start; gap: 12px; }
  .company-logo { height: 50px; width: 50px; object-fit: contain; border-radius: 4px; }
  .company h1 { font-size: 20px; color: #10b981; margin-bottom: 4px; }
  .company p { color: #555; font-size: 11px; line-height: 1.55; }
  .doc-info { text-align: right; }
  .doc-info h2 { font-size: 26px; font-weight: 900; color: #1a1a2e; letter-spacing: 2px; }
  .doc-info .num { font-size: 13px; color: #10b981; font-weight: 700; margin: 4px 0; }
  .doc-info p { color: #555; font-size: 11px; }
  .client-box { background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 22px; max-width: 340px; }
  .client-box .label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #999; font-weight: 700; margin-bottom: 4px; }
  .client-box .name { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
  .client-box p { color: #555; font-size: 10.5px; line-height: 1.5; }
  table.lines { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  table.lines thead th { background: #1a1a2e; color: white; padding: 9px 10px; text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.5px; }
  table.lines thead th:first-child { border-radius: 6px 0 0 0; }
  table.lines thead th:last-child { border-radius: 0 6px 0 0; text-align: right; }
  table.lines thead th.right { text-align: right; }
  table.lines tbody td { padding: 9px 10px; border-bottom: 1px solid #eee; font-size: 11.5px; }
  table.lines tbody td.right { text-align: right; }
  .totals { display: flex; justify-content: flex-end; gap: 18px; flex-wrap: wrap; }
  .tva-recap { min-width: 220px; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 10px; }
  .tva-recap .label { font-size: 9px; text-transform: uppercase; color: #999; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.5px; }
  .tva-recap-row { display: flex; justify-content: space-between; font-size: 10.5px; padding: 2px 0; color: #444; }
  .totals-box { width: 290px; }
  .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; }
  .totals-row.total { border-top: 2px solid #1a1a2e; padding-top: 9px; margin-top: 4px; font-size: 15px; font-weight: 900; }
  .totals-row.net { border-top: 2px solid #10b981; padding-top: 9px; margin-top: 4px; font-size: 15px; font-weight: 900; color: #10b981; }
  .totals-row.retenue { color: #d97706; font-size: 11px; }
  .legal { margin-top: 22px; padding: 12px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; font-size: 10px; color: #7c2d12; line-height: 1.6; }
  .legal strong { color: #431407; }
  .notes { margin-top: 14px; padding: 10px 12px; background: #f8f9fa; border-radius: 6px; font-size: 11px; color: #555; line-height: 1.5; }
  .notes strong { color: #333; }
  .signature { margin-top: 30px; display: flex; justify-content: flex-end; }
  .signature-box { width: 220px; border-top: 1px solid #999; padding-top: 6px; text-align: center; font-size: 10px; color: #777; }
  .footer { margin-top: auto; text-align: center; color: #888; font-size: 9px; border-top: 1px solid #ddd; padding-top: 10px; line-height: 1.6; }
  .content { flex: 1; }
  @media print {
    body { padding: 20px; min-height: 100vh; }
    @page { margin: 10mm; }
  }
</style>
</head>
<body>
  <div class="content">
  <div class="header">
    <div class="company">
      ${data.entreprise?.logo_url ? `<img class="company-logo" src="${esc(data.entreprise.logo_url)}" alt="Logo" crossorigin="anonymous"/>` : ''}
      <div>
      <h1>${companyName}</h1>
      ${data.entreprise?.adresse ? `<p>${esc(data.entreprise.adresse)}</p>` : ''}
      ${data.entreprise?.telephone ? `<p>Tél: ${esc(data.entreprise.telephone)}</p>` : ''}
      ${data.entreprise?.email ? `<p>${esc(data.entreprise.email)}</p>` : ''}
      ${data.entreprise?.ninea ? `<p><strong>NINEA :</strong> ${esc(data.entreprise.ninea)}</p>` : ''}
      ${data.entreprise?.rccm ? `<p><strong>RCCM :</strong> ${esc(data.entreprise.rccm)}</p>` : ''}
      ${data.entreprise?.regime_fiscal ? `<p><strong>Régime fiscal :</strong> ${esc(data.entreprise.regime_fiscal)}</p>` : ''}
      </div>
    </div>
    <div class="doc-info">
      <h2>${esc(title)}</h2>
      <p class="num">${esc(data.numero)}</p>
      <p>Date d'émission : ${esc(fmtDate(data.date))}</p>
      ${data.type === 'facture' && data.date_livraison ? `<p>Date de livraison : ${esc(fmtDate(data.date_livraison))}</p>` : ''}
      ${data.type === 'facture' && data.echeance ? `<p>Échéance : ${esc(fmtDate(data.echeance))}</p>` : ''}
      ${data.type === 'devis' && data.validite_jours ? `<p>Validité : ${data.validite_jours} jours</p>` : ''}
      ${(data.type === 'facture' || data.type === 'recu') && data.mode_paiement ? `<p>Paiement : ${esc(data.mode_paiement)}</p>` : ''}
      ${data.type === 'recu' && data.reference ? `<p>Réf : ${esc(data.reference)}</p>` : ''}
      ${data.type === 'avoir' && data.facture_ref ? `<p>Facture : ${esc(data.facture_ref)}</p>` : ''}
    </div>
  </div>

  <div class="client-box">
    <div class="label">Client</div>
    <div class="name">${esc(data.clientDetails?.nom || data.client)}</div>
    ${data.clientDetails?.adresse ? `<p>${esc(data.clientDetails.adresse)}</p>` : ''}
    ${data.clientDetails?.telephone ? `<p>Tél: ${esc(data.clientDetails.telephone)}</p>` : ''}
    ${data.clientDetails?.email ? `<p>${esc(data.clientDetails.email)}</p>` : ''}
    ${data.clientDetails?.ninea ? `<p><strong>NINEA :</strong> ${esc(data.clientDetails.ninea)}</p>` : ''}
  </div>

  ${data.type === 'recu' ? `
  <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: center;">
    <div style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: 700; letter-spacing: 1px; margin-bottom: 6px;">Montant encaissé</div>
    <div style="font-size: 28px; font-weight: 900; color: #059669;">${fmt(data.montant_ttc, devise)}</div>
  </div>
  ${data.description ? `<div class="notes"><strong>Description :</strong> ${esc(data.description)}</div>` : ''}
  ${data.facture_ref ? `<div class="notes" style="margin-top:8px;"><strong>Facture associée :</strong> ${esc(data.facture_ref)}</div>` : ''}
  ` : `
  <table class="lines">
    <thead>
      <tr>
        <th>Désignation</th>
        <th class="right">Qté</th>
        <th class="right">PU HT</th>
        <th class="right">TVA</th>
        <th class="right">Total HT</th>
      </tr>
    </thead>
    <tbody>
      ${articles.map(a => {
        const rate = a.tva_pct ?? defaultTva;
        return `<tr>
          <td>${esc(a.nom)}</td>
          <td class="right">${a.quantite}</td>
          <td class="right">${fmt(a.prix_unitaire, devise)}</td>
          <td class="right">${rate}%</td>
          <td class="right">${fmt(a.quantite * a.prix_unitaire, devise)}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>

  <div class="totals">
    ${sortedRates.length > 1 || (sortedRates.length === 1 && sortedRates[0] > 0) ? `
    <div class="tva-recap">
      <div class="label">Récapitulatif TVA</div>
      ${sortedRates.map(rate => {
        const g = tvaGroups.get(rate)!;
        return `<div class="tva-recap-row"><span>Base ${rate}%</span><span>${fmt(g.base, devise)}</span></div>
                <div class="tva-recap-row"><span>TVA ${rate}%</span><span>${fmt(g.tva, devise)}</span></div>`;
      }).join('')}
    </div>` : ''}
    <div class="totals-box">
      <div class="totals-row"><span>Total HT</span><span>${fmt(data.montant_ht, devise)}</span></div>
      <div class="totals-row"><span>Total TVA</span><span>${fmt(data.montant_tva, devise)}</span></div>
      <div class="totals-row total"><span>${data.type === 'avoir' ? 'Total avoir TTC' : 'Total TTC'}</span><span>${fmt(data.montant_ttc, devise)}</span></div>
      ${retenuePct > 0 ? `
        <div class="totals-row retenue"><span>Retenue à la source (${retenuePct}%)</span><span>− ${fmt(retenueAmount, devise)}</span></div>
        <div class="totals-row net"><span>Net à payer</span><span>${fmt(netAPayer, devise)}</span></div>
      ` : ''}
    </div>
  </div>
  ${data.type === 'avoir' && data.motif ? `<div class="notes"><strong>Motif :</strong> ${esc(data.motif)}</div>` : ''}
  `}

  ${data.notes ? `<div class="notes"><strong>Notes :</strong> ${esc(data.notes)}</div>` : ''}

  ${data.type === 'facture' ? `
  <div class="legal">
    ${data.conditions_paiement ? `<div><strong>Conditions de paiement :</strong> ${esc(data.conditions_paiement)}</div>` : ''}
    ${data.penalites_retard ? `<div style="margin-top:4px;"><strong>Pénalités de retard :</strong> ${esc(data.penalites_retard)}</div>` : ''}
    ${retenuePct > 0 ? `<div style="margin-top:4px;"><strong>Retenue à la source :</strong> Conformément au Code Général des Impôts du Sénégal, une retenue à la source de ${retenuePct}% est appliquée sur le montant HT.</div>` : ''}
    ${data.entreprise?.regime_fiscal === 'Exonéré' ? `<div style="margin-top:4px;"><strong>TVA non applicable</strong> — article 293 B du CGI.</div>` : ''}
  </div>

  <div class="signature">
    <div class="signature-box">Signature & cachet de l'émetteur</div>
  </div>
  ` : ''}
  </div>

  <div class="footer">
    ${footerParts.join(' — ')}
  </div>
</body>
</html>`;

  return html;
}

/**
 * Generate a real PDF blob from PdfData using html2canvas + jsPDF
 */
export async function generatePdfBlob(data: PdfData): Promise<Blob> {
  const html = generatePdfHtml(data);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '794px';
  iframe.style.height = '1123px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) throw new Error('Cannot create iframe');

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  await new Promise(resolve => setTimeout(resolve, 500));

  const body = iframeDoc.body;

  const canvas = await html2canvas(body, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    width: 794,
    windowWidth: 794,
    backgroundColor: '#ffffff',
  });

  document.body.removeChild(iframe);

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = 210;
  const pdfHeight = 297;

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  if (imgHeight <= pdfHeight) {
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
  } else {
    let position = 0;
    let remaining = imgHeight;
    while (remaining > 0) {
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      remaining -= pdfHeight;
      position -= pdfHeight;
      if (remaining > 0) pdf.addPage();
    }
  }

  return pdf.output('blob');
}

export async function downloadPdf(data: PdfData) {
  try {
    const blob = await generatePdfBlob(data);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const labelMap = { facture: 'Facture', devis: 'Devis', recu: 'Recu', avoir: 'Avoir' } as const;
    const label = labelMap[data.type];
    a.href = url;
    a.download = `${label}_${data.numero.replace(/[/\\]/g, '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch {
    const html = generatePdfHtml(data);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.onload = () => setTimeout(() => win.print(), 300);
    }
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}
