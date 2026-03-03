import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

export default function CompanyPage() {
  const { entreprise } = useApp();
  const [saving, setSaving] = useState(false);

  const co = entreprise.data;
  const [form, setForm] = useState({
    nom: co?.nom || '',
    adresse: co?.adresse || '',
    telephone: co?.telephone || '',
    email: co?.email || '',
    ninea: co?.ninea || '',
    rccm: co?.rccm || '',
    slogan: co?.slogan || '',
    tva: co?.tva ?? 18,
  });

  // Sync form when data loads
  const prevId = useState<string | null>(null);
  if (co && co.id !== prevId[0]) {
    prevId[1](co.id);
    setForm({
      nom: co.nom || '',
      adresse: co.adresse || '',
      telephone: co.telephone || '',
      email: co.email || '',
      ninea: co.ninea || '',
      rccm: co.rccm || '',
      slogan: co.slogan || '',
      tva: co.tva ?? 18,
    });
  }

  const save = async () => {
    setSaving(true);
    try {
      await entreprise.upsert(form);
      toast.success('Sauvegardé !');
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-extrabold text-sm text-foreground">Informations Entreprise</h3>
        </div>
        <div className="p-5">
          <div className="grid gap-3.5">
            <Field label="Nom entreprise" value={form.nom} onChange={v => setForm({ ...form, nom: v })} />
            <Field label="Adresse" value={form.adresse} onChange={v => setForm({ ...form, adresse: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Téléphone" value={form.telephone} onChange={v => setForm({ ...form, telephone: v })} />
              <Field label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="NINEA" value={form.ninea} onChange={v => setForm({ ...form, ninea: v })} />
              <Field label="RCCM" value={form.rccm} onChange={v => setForm({ ...form, rccm: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Site web / Slogan" value={form.slogan} onChange={v => setForm({ ...form, slogan: v })} />
              <Field label="TVA (%)" value={String(form.tva)} onChange={v => setForm({ ...form, tva: parseFloat(v) || 0 })} type="number" />
            </div>
          </div>
          <div className="mt-3.5 flex items-center justify-between gap-3">
            <div className="py-2.5 px-3 bg-primary/10 rounded-lg text-[11.5px] text-primary flex-1">
              ✅ Ces infos apparaîtront sur vos factures PDF
            </div>
            <button onClick={save} disabled={saving} className="gradient-primary text-primary-foreground border-none py-2 px-4 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all shrink-0 disabled:opacity-60">
              {saving ? '⏳...' : '💾 Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-extrabold text-sm text-foreground">Aperçu en-tête facture</h3>
        </div>
        <div className="p-5">
          <div className="bg-card border border-border rounded-lg p-5 font-sans text-[11px]">
            <div className="flex justify-between items-start border-b-2 border-primary pb-2.5 mb-2.5">
              <div>
                <div className="text-lg font-black text-foreground">{form.nom || 'Mon Entreprise'}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{form.slogan}</div>
              </div>
              <div className="text-right text-muted-foreground text-[10px] leading-relaxed">
                {form.adresse && <div>{form.adresse}</div>}
                {form.telephone && <div>{form.telephone}</div>}
                {form.email && <div>{form.email}</div>}
              </div>
            </div>
            <div className="text-[9px] text-muted-foreground">
              NINEA : <b>{form.ninea || '—'}</b> &nbsp;|&nbsp; RCCM : <b>{form.rccm || '—'}</b>
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
