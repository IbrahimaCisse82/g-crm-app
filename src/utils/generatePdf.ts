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

// Sanitize string to prevent XSS injection
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

export function downloadPdf(data: PdfData) {
  const devise = data.entreprise?.devise || 'FCFA';
  const title = data.type === 'facture' ? 'FACTURE' : 'DEVIS';
  const articles = Array.isArray(data.articles) ? data.articles as PdfArticle[] : [];

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<title>${esc(title)} ${esc(data.numero)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a2e; padding: 40px; font-size: 13px; display: flex; flex-direction: column; min-height: 100vh; }
  .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
  .company { max-width: 50%; }
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
  .footer { margin-top: auto; text-align: center; color: #aaa; font-size: 10px; border-top: 1px solid #eee; padding-top: 12px; }
  .content { flex: 1; }
  @media print { body { padding: 20px; min-height: 100vh; } }
</style>
</head>
<body>
  <div class="content">
  <div class="header">
    <div class="company">
      <h1>${esc(data.entreprise?.nom) || 'Mon Entreprise'}</h1>
      ${data.entreprise?.adresse ? `<p>${esc(data.entreprise.adresse)}</p>` : ''}
      ${data.entreprise?.telephone ? `<p>Tél: ${esc(data.entreprise.telephone)}</p>` : ''}
      ${data.entreprise?.email ? `<p>${esc(data.entreprise.email)}</p>` : ''}
      ${data.entreprise?.ninea ? `<p>NINEA: ${esc(data.entreprise.ninea)}</p>` : ''}
      ${data.entreprise?.rccm ? `<p>RCCM: ${esc(data.entreprise.rccm)}</p>` : ''}
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
    ${esc(data.entreprise?.nom) || 'Mon Entreprise'} — Document généré automatiquement
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onload = () => {
      setTimeout(() => { win.print(); }, 300);
    };
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
