import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, Maximize2, Printer, Download, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { generatePdfHtml, downloadPdf, type PdfData } from '@/utils/generatePdf';
import { toast } from 'sonner';

interface PdfPreviewProps {
  data: PdfData;
  className?: string;
}

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

/** Ouvre le document dans une iframe cachée et déclenche l'impression navigateur */
async function printHtml(html: string) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc) { document.body.removeChild(iframe); throw new Error('Impression indisponible'); }
  doc.open();
  doc.write(html);
  doc.close();
  await new Promise(r => setTimeout(r, 400));
  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();
  setTimeout(() => { if (iframe.parentNode) document.body.removeChild(iframe); }, 60000);
}

function PdfFrame({ html, scale }: { html: string; scale: number }) {
  return (
    <div
      className="relative overflow-hidden rounded-lg border border-border bg-white shadow-sm mx-auto"
      style={{ width: A4_WIDTH * scale, height: A4_HEIGHT * scale }}
    >
      <iframe
        title="Aperçu du document"
        srcDoc={html}
        sandbox=""
        className="border-0 origin-top-left pointer-events-none"
        style={{ width: A4_WIDTH, height: A4_HEIGHT, transform: `scale(${scale})` }}
      />
    </div>
  );
}

/**
 * Prévisualisation A4 temps réel du document (facture, devis, reçu, avoir).
 * Zoom, plein écran, impression et téléchargement PDF.
 */
export function PdfPreview({ data, className }: PdfPreviewProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.5);
  const [zoom, setZoom] = useState<number | null>(null); // null = ajusté à la page
  const [fullscreen, setFullscreen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [debounced, setDebounced] = useState(data);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(data), 250);
    return () => clearTimeout(t);
  }, [data]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setFitScale(Math.min(1, w / A4_WIDTH));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const html = useMemo(() => generatePdfHtml(debounced), [debounced]);
  const scale = zoom ?? fitScale;

  const zoomOut = () => setZoom(Math.max(0.25, Math.round((scale - 0.1) * 100) / 100));
  const zoomIn = () => setZoom(Math.min(2, Math.round((scale + 0.1) * 100) / 100));
  const fit = () => setZoom(null);

  const handlePrint = useCallback(async () => {
    try { await printHtml(generatePdfHtml(data)); }
    catch { toast.error("Impression impossible"); }
  }, [data]);

  const handleDownload = useCallback(async () => {
    setBusy(true);
    try { await downloadPdf(data); }
    catch { toast.error('Téléchargement impossible'); }
    setBusy(false);
  }, [data]);

  const toolbar = (compact = false) => (
    <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
      <div className="flex items-center gap-1">
        <button type="button" onClick={zoomOut} title="Zoom arrière" className="border-[1.5px] border-border rounded-lg p-1.5 text-muted-foreground hover:border-primary hover:text-primary transition-all">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="text-[11px] font-bold text-muted-foreground w-11 text-center">{Math.round(scale * 100)}%</span>
        <button type="button" onClick={zoomIn} title="Zoom avant" className="border-[1.5px] border-border rounded-lg p-1.5 text-muted-foreground hover:border-primary hover:text-primary transition-all">
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={fit} className="border-[1.5px] border-border rounded-lg py-1.5 px-2 text-[10px] font-bold text-muted-foreground hover:border-primary hover:text-primary transition-all">
          Ajuster
        </button>
      </div>
      <div className="flex items-center gap-1">
        {!compact && (
          <button type="button" onClick={() => setFullscreen(true)} title="Plein écran" className="border-[1.5px] border-border rounded-lg p-1.5 text-muted-foreground hover:border-primary hover:text-primary transition-all">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        )}
        <button type="button" onClick={handlePrint} title="Imprimer" className="border-[1.5px] border-border rounded-lg p-1.5 text-muted-foreground hover:border-primary hover:text-primary transition-all">
          <Printer className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={handleDownload} disabled={busy} title="Télécharger le PDF A4" className="gradient-primary text-primary-foreground rounded-lg py-1.5 px-2.5 text-[10px] font-bold flex items-center gap-1 disabled:opacity-60 transition-all">
          <Download className="h-3.5 w-3.5" /> {busy ? '...' : 'PDF'}
        </button>
      </div>
    </div>
  );

  return (
    <div ref={wrapRef} className={className}>
      {toolbar()}
      <div className="max-h-[70vh] overflow-auto">
        <PdfFrame html={html} scale={scale} />
      </div>

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-[96vw] w-[96vw] h-[94vh] p-4 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-bold">Aperçu plein écran — {data.numero}</span>
            <button type="button" onClick={() => setFullscreen(false)} className="border-[1.5px] border-border rounded-lg py-1.5 px-3 text-[11px] font-bold text-muted-foreground hover:border-primary hover:text-primary transition-all flex items-center gap-1.5">
              <X className="h-3.5 w-3.5" /> Retour
            </button>
          </div>
          {toolbar(true)}
          <div className="flex-1 overflow-auto bg-muted/40 rounded-lg p-4">
            <PdfFrame html={html} scale={scale} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
