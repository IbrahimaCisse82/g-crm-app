import { toast } from 'sonner';
import { generatePdfBlob, type PdfData } from './generatePdf';

interface ShareDocData {
  type: 'facture' | 'devis';
  numero: string;
  client: string;
  montant_ttc: number;
  devise?: string;
  date: string;
  pdfData?: PdfData;
}

const fmtMoney = (n: number, devise = 'FCFA') =>
  new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' ' + devise;

export async function shareDocument(data: ShareDocData) {
  const label = data.type === 'facture' ? 'Facture' : 'Devis';
  const title = `${label} ${data.numero}`;
  const text = `${label} ${data.numero}\nClient : ${data.client}\nMontant TTC : ${fmtMoney(data.montant_ttc, data.devise)}\nDate : ${data.date}`;

  // Generate PDF file attachment if pdfData provided
  let files: File[] | undefined;
  if (data.pdfData) {
    try {
      const pdfBlob = await generatePdfBlob(data.pdfData);
      const fileName = `${label}_${data.numero.replace(/[/\\]/g, '-')}.pdf`;
      files = [new File([pdfBlob], fileName, { type: 'application/pdf' })];
    } catch {
      // If PDF generation fails, continue without attachment
      console.warn('PDF generation failed, sharing text only');
    }
  }

  const canShare = typeof navigator.share === 'function';
  const isInIframe = window.self !== window.top;

  if (canShare && !isInIframe) {
    const canShareFiles = files && navigator.canShare?.({ files });

    try {
      await navigator.share({
        title,
        text,
        ...(canShareFiles ? { files } : {}),
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        await copyToClipboard(text);
      }
    }
  } else {
    await copyToClipboard(text);
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Contenu copié dans le presse-papiers');
  } catch {
    toast.error('Partage non supporté sur ce navigateur');
  }
}
