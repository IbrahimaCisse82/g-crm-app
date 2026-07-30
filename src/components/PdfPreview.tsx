import { useEffect, useMemo, useRef, useState } from 'react';
import { generatePdfHtml, type PdfData } from '@/utils/generatePdf';

interface PdfPreviewProps {
  data: PdfData;
  /** Largeur disponible en px pour calculer l'échelle (A4 = 794px) */
  className?: string;
}

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

/**
 * Prévisualisation A4 temps réel du document (facture, devis, reçu, avoir).
 * Rend le même HTML que le PDF final dans une iframe isolée, mise à l'échelle.
 */
export function PdfPreview({ data, className }: PdfPreviewProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [debounced, setDebounced] = useState(data);

  // Debounce pour éviter de re-rendre l'iframe à chaque frappe
  useEffect(() => {
    const t = setTimeout(() => setDebounced(data), 250);
    return () => clearTimeout(t);
  }, [data]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(Math.min(1, w / A4_WIDTH));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const html = useMemo(() => generatePdfHtml(debounced), [debounced]);

  return (
    <div ref={wrapRef} className={className}>
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
    </div>
  );
}
