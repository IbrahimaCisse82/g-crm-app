import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function CompanyPage() {
  const { data, setData } = useApp();
  const [saved, setSaved] = useState(false);

  const co = data.co;
  const update = (key: string, value: string | number) => {
    setData(d => ({ ...d, co: { ...d.co, [key]: value } }));
  };

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-extrabold text-sm text-foreground">Informations Entreprise</h3>
        </div>
        <div className="p-5">
          <div className="grid gap-3.5">
            <Field label="Nom entreprise" value={co.nom} onChange={v => update('nom', v)} />
            <Field label="Adresse" value={co.adr} onChange={v => update('adr', v)} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Téléphone" value={co.tel} onChange={v => update('tel', v)} />
              <Field label="Email" value={co.email} onChange={v => update('email', v)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="NINEA" value={co.ninea} onChange={v => update('ninea', v)} />
              <Field label="RCCM" value={co.rccm} onChange={v => update('rccm', v)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Site web / Slogan" value={co.slogan} onChange={v => update('slogan', v)} />
              <Field label="TVA (%)" value={String(co.tva)} onChange={v => update('tva', parseFloat(v) || 0)} type="number" />
            </div>
          </div>
          <div className="mt-3.5 flex items-center justify-between gap-3">
            <div className="py-2.5 px-3 bg-primary/10 rounded-lg text-[11.5px] text-primary flex-1">
              ✅ Ces infos apparaîtront sur vos factures PDF
            </div>
            <button onClick={save} className="gradient-primary text-primary-foreground border-none py-2 px-4 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all shrink-0">
              {saved ? '✅ Sauvegardé' : '💾 Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-extrabold text-sm text-foreground">Aperçu en-tête facture</h3>
        </div>
        <div className="p-5">
          <div className="bg-card border border-border rounded-lg p-5 font-sans text-[11px]">
            <div className="flex justify-between items-start border-b-2 border-primary pb-2.5 mb-2.5">
              <div>
                <div className="text-lg font-black text-foreground">{co.nom || 'Mon Entreprise'}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{co.slogan}</div>
              </div>
              <div className="text-right text-muted-foreground text-[10px] leading-relaxed">
                {co.adr && <div>{co.adr}</div>}
                {co.tel && <div>{co.tel}</div>}
                {co.email && <div>{co.email}</div>}
              </div>
            </div>
            <div className="text-[9px] text-muted-foreground">
              NINEA : <b>{co.ninea || '—'}</b> &nbsp;|&nbsp; RCCM : <b>{co.rccm || '—'}</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary focus:ring-[3px] focus:ring-primary/10 w-full"
      />
    </div>
  );
}
