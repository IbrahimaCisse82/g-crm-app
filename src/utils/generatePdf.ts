import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PdfArticle {
  nom: string;
  quantite: number;
  prix_unitaire: number;
}

interface PdfData {
  type: 'facture' | 'devis';
  numero: string;
  date: string;
  echeance?: string | null;
  validite_jours?: number;
  client: string;
  articles: PdfArticle[];
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  tva_pct: number;
  mode_paiement?: string | null;
  notes?: string | null;
  entreprise?: {
    nom?: string;
    adresse?: string | null;
    telephone?: string | null;
    email?: string | null;
    ninea?: string | null;
    rccm?: string | null;
    devise?: string;
    logo_url?: string | null;
  } | null;
}

function esc(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const fmt = (n: number, devise = 'FCFA') =>
  new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' ' + esc(devise);

export type { PdfData };

export function generatePdfHtml(data: PdfData): string {
  const devise = data.entreprise?.devise || 'FCFA';
  const title = data.type === 'facture' ? 'FACTURE' : 'DEVIS';
  const articles = Array.isArray(data.articles) ? data.articles as PdfArticle[] : [];
  const companyName = esc(data.entreprise?.nom) || 'Mon Entreprise';

  // Build footer info parts
  const footerParts: string[] = [companyName];
  if (data.entreprise?.adresse) footerParts.push(esc(data.entreprise.adresse));
  if (data.entreprise?.telephone) footerParts.push('Tél: ' + esc(data.entreprise.telephone));
  if (data.entreprise?.email) footerParts.push(esc(data.entreprise.email));
  if (data.entreprise?.ninea) footerParts.push('NINEA: ' + esc(data.entreprise.ninea));
  if (data.entreprise?.rccm) footerParts.push('RCCM: ' + esc(data.entreprise.rccm));

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<title>${esc(title)} ${esc(data.numero)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a2e; padding: 40px; font-size: 13px; display: flex; flex-direction: column; min-height: 100vh; width: 794px; }
  .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
  .company { max-width: 50%; display: flex; align-items: flex-start; gap: 12px; }
  .company-logo { height: 50px; width: 50px; object-fit: contain; border-radius: 4px; }
  .company h1 { font-size: 22px; color: #10b981; margin-bottom: 4px; }
  .company p { color: #666; font-size: 12px; line-height: 1.6; }
  .doc-info { text-align: right; }
  .doc-info h2 { font-size: 28px; font-weight: 900; color: #1a1a2e; letter-spacing: 2px; }
  .doc-info .num { font-size: 14px; color: #10b981; font-weight: 700; margin: 4px 0; }
  .doc-info p { color: #666; font-size: 12px; }
  .client-box { background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 30px; max-width: 300px; }
  .client-box .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; font-weight: 700; margin-bottom: 4px; }
  .client-box .name { font-size: 15px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { background: #1a1a2e; color: white; padding: 10px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
  thead th:first-child { border-radius: 6px 0 0 0; }
  thead th:last-child { border-radius: 0 6px 0 0; text-align: right; }
  thead th.right { text-align: right; }
  tbody td { padding: 10px 12px; border-bottom: 1px solid #eee; }
  tbody td.right { text-align: right; }
  .totals { display: flex; justify-content: flex-end; }
  .totals-box { width: 280px; }
  .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .totals-row.total { border-top: 2px solid #1a1a2e; padding-top: 10px; margin-top: 4px; font-size: 16px; font-weight: 900; }
  .totals-row.total .val { color: #10b981; }
  .notes { margin-top: 30px; padding: 12px; background: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666; }
  .notes strong { color: #333; }
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
      ${data.entreprise?.ninea ? `<p>NINEA: ${esc(data.entreprise.ninea)}</p>` : ''}
      ${data.entreprise?.rccm ? `<p>RCCM: ${esc(data.entreprise.rccm)}</p>` : ''}
      </div>
    </div>
    <div class="doc-info">
      <h2>${esc(title)}</h2>
      <p class="num">${esc(data.numero)}</p>
      <p>Date: ${esc(data.date)}</p>
      ${data.type === 'facture' && data.echeance ? `<p>Échéance: ${esc(data.echeance)}</p>` : ''}
      ${data.type === 'devis' && data.validite_jours ? `<p>Validité: ${data.validite_jours} jours</p>` : ''}
      ${data.mode_paiement ? `<p>Paiement: ${esc(data.mode_paiement)}</p>` : ''}
    </div>
  </div>

  <div class="client-box">
    <div class="label">Client</div>
    <div class="name">${esc(data.client)}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Désignation</th>
        <th class="right">Qté</th>
        <th class="right">Prix unitaire</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${articles.map(a => `
        <tr>
          <td>${esc(a.nom)}</td>
          <td class="right">${a.quantite}</td>
          <td class="right">${fmt(a.prix_unitaire, devise)}</td>
          <td class="right">${fmt(a.quantite * a.prix_unitaire, devise)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Total HT</span><span>${fmt(data.montant_ht, devise)}</span></div>
      <div class="totals-row"><span>TVA (${data.tva_pct}%)</span><span>${fmt(data.montant_tva, devise)}</span></div>
      <div class="totals-row total"><span>Total TTC</span><span class="val">${fmt(data.montant_ttc, devise)}</span></div>
    </div>
  </div>

  ${data.notes ? `<div class="notes"><strong>Notes:</strong> ${esc(data.notes)}</div>` : ''}
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

  // Create an off-screen container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // A4 width at 96dpi
  container.style.background = 'white';
  container.innerHTML = html.replace(/<!DOCTYPE[\s\S]*?<body>/, '<div>').replace(/<\/body>[\s\S]*$/, '</div>');

  // Parse just the body content with styles
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '794px';
  iframe.style.height = '1123px'; // A4 height
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) throw new Error('Cannot create iframe');

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for content & images to load
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
  const pdfWidth = 210; // A4 mm
  const pdfHeight = 297;

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  if (imgHeight <= pdfHeight) {
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
  } else {
    // Multi-page
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
    const label = data.type === 'facture' ? 'Facture' : 'Devis';
    a.href = url;
    a.download = `${label}_${data.numero.replace(/[/\\]/g, '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch {
    // Fallback: open HTML for printing
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
