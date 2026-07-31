import JSZip from 'jszip';

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  return '\uFEFF' + [headers.map(esc).join(';'), ...rows.map(r => r.map(esc).join(';'))].join('\r\n');
}

export interface PortabilityData {
  entreprise: Record<string, unknown> | null | undefined;
  clients: Record<string, unknown>[];
  produits: Record<string, unknown>[];
  factures: Record<string, unknown>[];
  devis: Record<string, unknown>[];
  recus: Record<string, unknown>[];
  avoirs: Record<string, unknown>[];
  journal: Record<string, unknown>[];
  comptes: Record<string, unknown>[];
  categories: Record<string, unknown>[];
}

function genericCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return toCsv(['(aucune donnée)'], []);
  const headers = Object.keys(rows[0]);
  return toCsv(
    headers,
    rows.map(r => headers.map(h => {
      const v = r[h];
      return typeof v === 'object' && v !== null ? JSON.stringify(v) : (v as string | number | null);
    })),
  );
}

/** Export ZIP de portabilité (loi n° 2008-12 / RGPD) : CSV + JSON de toutes les données du compte. */
export async function exportPortabilityZip(data: PortabilityData, companyName = 'mon-entreprise') {
  const zip = new JSZip();
  const stamp = new Date().toISOString().slice(0, 10);

  const sets: [string, Record<string, unknown>[]][] = [
    ['clients', data.clients],
    ['produits', data.produits],
    ['factures', data.factures],
    ['devis', data.devis],
    ['recus', data.recus],
    ['avoirs', data.avoirs],
    ['journal', data.journal],
    ['comptes-tresorerie', data.comptes],
    ['categories', data.categories],
  ];

  const csvFolder = zip.folder('csv')!;
  sets.forEach(([name, rows]) => csvFolder.file(`${name}.csv`, genericCsv(rows)));

  zip.file('donnees-completes.json', JSON.stringify({ exported_at: new Date().toISOString(), ...data }, null, 2));

  zip.file(
    'LISEZ-MOI.txt',
    [
      'Export de portabilité des données — G-CRM (GROWHUB SARL)',
      `Entreprise : ${companyName}`,
      `Date d'export : ${new Date().toLocaleString('fr-FR')}`,
      '',
      'Contenu :',
      '- /csv : un fichier par module, compatible Excel (UTF-8, séparateur point-virgule).',
      '- donnees-completes.json : intégralité des données brutes.',
      '',
      'Cet export répond au droit à la portabilité des données (loi sénégalaise n° 2008-12).',
    ].join('\n'),
  );

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `export-donnees-${stamp}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
