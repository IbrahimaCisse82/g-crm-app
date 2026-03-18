import { useState, useEffect, forwardRef, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';

export default function CompanyPage() {
  const { entreprise } = useApp();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [prevId, setPrevId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
    devise: co?.devise || 'FCFA',
    logo_url: co?.logo_url || '',
  });

  useEffect(() => {
    if (co && co.id !== prevId) {
      setPrevId(co.id);
      setForm({
        nom: co.nom || '',
        adresse: co.adresse || '',
        telephone: co.telephone || '',
        email: co.email || '',
        ninea: co.ninea || '',
        rccm: co.rccm || '',
        slogan: co.slogan || '',
        tva: co.tva ?? 18,
        devise: co.devise || 'FCFA',
        logo_url: co.logo_url || '',
      });
    }
  }, [co, prevId]);

  const uploadLogo = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 2 Mo)');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(path);

      // Add cache-busting
      const url = `${publicUrl}?t=${Date.now()}`;
      setForm(f => ({ ...f, logo_url: url }));
      toast.success('Logo uploadé !');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur upload');
    }
    setUploading(false);
  };

  const removeLogo = () => {
    setForm(f => ({ ...f, logo_url: '' }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await entreprise.upsert(form);
      toast.success('Sauvegardé !');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
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
            {/* Logo upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Logo entreprise</label>
              <div className="flex items-center gap-3">
                {form.logo_url ? (
                  <div className="relative group">
                    <img
                      src={form.logo_url}
                      alt="Logo"
                      className="h-16 w-16 object-contain rounded-lg border border-border bg-background"
                    />
                    <button
                      onClick={removeLogo}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="h-16 w-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) uploadLogo(file);
                    e.target.value = '';
                  }}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="text-xs text-primary font-semibold hover:underline disabled:opacity-50"
                >
                  {uploading ? '⏳ Upload...' : form.logo_url ? 'Changer' : 'Uploader un logo'}
                </button>
              </div>
            </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Site web / Slogan" value={form.slogan} onChange={v => setForm({ ...form, slogan: v })} />
              <Field label="TVA (%)" value={String(form.tva)} onChange={v => setForm({ ...form, tva: parseFloat(v) || 0 })} type="number" />
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Devise</label>
                <select
                  className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary focus:ring-[3px] focus:ring-primary/10 w-full"
                  value={form.devise}
                  onChange={e => setForm({ ...form, devise: e.target.value })}
                >
                  <option>FCFA</option>
                  <option>EUR</option>
                  <option>USD</option>
                  <option>GNF</option>
                </select>
              </div>
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
              <div className="flex items-start gap-3">
                {form.logo_url && (
                  <img src={form.logo_url} alt="Logo" className="h-12 w-12 object-contain rounded" />
                )}
                <div>
                  <div className="text-lg font-black text-foreground">{form.nom || 'Mon Entreprise'}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{form.slogan}</div>
                </div>
              </div>
              <div className="text-right text-muted-foreground text-[10px] leading-relaxed">
                {form.adresse && <div>{form.adresse}</div>}
                {form.telephone && <div>{form.telephone}</div>}
                {form.email && <div>{form.email}</div>}
              </div>
            </div>
            <div className="text-[9px] text-muted-foreground">
              NINEA : <b>{form.ninea || '—'}</b> &nbsp;|&nbsp; RCCM : <b>{form.rccm || '—'}</b> &nbsp;|&nbsp; Devise : <b>{form.devise}</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Field = forwardRef<HTMLInputElement, { label: string; value: string; onChange: (v: string) => void; type?: string }>(
  ({ label, value, onChange, type = 'text' }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary focus:ring-[3px] focus:ring-primary/10 w-full"
        />
      </div>
    );
  }
);
Field.displayName = 'Field';
