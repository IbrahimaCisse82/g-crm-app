import { toast } from 'sonner';

interface ShareDocData {
  type: 'facture' | 'devis';
  numero: string;
  client: string;
  montant_ttc: number;
  devise?: string;
  date: string;
}

const fmtMoney = (n: number, devise = 'FCFA') =>
  new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' ' + devise;

export async function shareDocument(data: ShareDocData) {
  const label = data.type === 'facture' ? 'Facture' : 'Devis';
  const title = `${label} ${data.numero}`;
  const text = `${label} ${data.numero}\nClient : ${data.client}\nMontant TTC : ${fmtMoney(data.montant_ttc, data.devise)}\nDate : ${data.date}`;

  if (navigator.share) {
    try {
      await navigator.share({ title, text });
    } catch (e: unknown) {
      // User cancelled share - ignore AbortError
      if (e instanceof Error && e.name !== 'AbortError') {
        toast.error('Erreur de partage');
      }
    }
  } else {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Contenu copié dans le presse-papiers');
    } catch {
      toast.error('Partage non supporté sur ce navigateur');
    }
  }
}
