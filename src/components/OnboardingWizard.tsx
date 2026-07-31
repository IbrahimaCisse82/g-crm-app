import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useProfile } from '@/hooks/useSupabaseData';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Building2, Receipt, Rocket, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { REGIMES_FISCAUX } from '@/types';
import { toast } from 'sonner';

const STEPS = ['Bienvenue', 'Entreprise', 'Fiscalité', 'C\'est parti'];

export default function OnboardingWizard() {
  const { entreprise, userName } = useApp();
  const profile = useProfile();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    telephone: '',
    adresse: '',
    ninea: '',
    rccm: '',
    regime_fiscal: 'Réel',
    tva: 18,
    devise: 'FCFA',
    conditions_paiement_defaut: 'Paiement à 30 jours',
    penalites_retard_defaut: 'Pénalités de retard : 1,5 % par mois de retard',
  });

  const open = !profile.isLoading && !!profile.data && profile.data.onboarding_completed === false;
  if (!open) return null;

  const initialNom = form.nom || entreprise.data?.nom || '';
  const set = (k: keyof typeof form, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const finish = async (skip = false) => {
    setSaving(true);
    try {
      if (!skip) {
        await entreprise.upsert({
          nom: initialNom || 'Mon Entreprise',
          telephone: form.telephone || null,
          adresse: form.adresse || null,
          ninea: form.ninea || null,
          rccm: form.rccm || null,
          regime_fiscal: form.regime_fiscal,
          tva: Number(form.tva) || 0,
          devise: form.devise,
          conditions_paiement_defaut: form.conditions_paiement_defaut || null,
          penalites_retard_defaut: form.penalites_retard_defaut || null,
        });
      }
      await profile.update({ onboarding_completed: true });
      toast.success(skip ? 'Configuration passée' : 'Configuration terminée. Bienvenue !');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none focus:border-primary';
  const labelCls = 'block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1';

  return (
    <Dialog open onOpenChange={() => { /* bloquant */ }}>
      <DialogContent className="max-w-[520px] max-h-[90vh] overflow-y-auto [&>button]:hidden">
        {/* Progress */}
        <div className="flex items-center gap-1.5 mb-1">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Étape {step + 1}/{STEPS.length} · {STEPS[step]}
        </p>

        {step === 0 && (
          <div className="space-y-3 py-2 text-center">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-primary">
              <Rocket className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-black text-foreground">Bienvenue {userName ? userName.split(' ')[0] : ''} !</h2>
            <p className="text-sm text-muted-foreground">
              Trois minutes pour configurer votre entreprise : vos factures et devis seront immédiatement conformes aux mentions DGI.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground"><Building2 className="w-4 h-4 text-primary" /> Identité de l'entreprise</div>
            <div>
              <label className={labelCls}>Nom commercial *</label>
              <input className={inputCls} value={initialNom} onChange={e => set('nom', e.target.value)} placeholder="Ex: GROWHUB SARL" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Téléphone</label>
                <input className={inputCls} value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="77 000 00 00" />
              </div>
              <div>
                <label className={labelCls}>Devise</label>
                <input className={inputCls} value={form.devise} onChange={e => set('devise', e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Adresse</label>
              <input className={inputCls} value={form.adresse} onChange={e => set('adresse', e.target.value)} placeholder="Dakar, Sénégal" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground"><Receipt className="w-4 h-4 text-primary" /> Mentions fiscales (DGI)</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>NINEA</label>
                <input className={inputCls} value={form.ninea} onChange={e => set('ninea', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>RCCM</label>
                <input className={inputCls} value={form.rccm} onChange={e => set('rccm', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Régime fiscal</label>
                <select className={inputCls} value={form.regime_fiscal} onChange={e => set('regime_fiscal', e.target.value)}>
                  {REGIMES_FISCAUX.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>TVA par défaut (%)</label>
                <input type="number" className={inputCls} value={form.tva} onChange={e => set('tva', Number(e.target.value))} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Conditions de paiement</label>
              <input className={inputCls} value={form.conditions_paiement_defaut} onChange={e => set('conditions_paiement_defaut', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Pénalités de retard</label>
              <input className={inputCls} value={form.penalites_retard_defaut} onChange={e => set('penalites_retard_defaut', e.target.value)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 py-2 text-center">
            <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7 text-success" />
            </div>
            <h2 className="text-lg font-black text-foreground">Tout est prêt</h2>
            <p className="text-sm text-muted-foreground">
              Vous pouvez modifier ces informations à tout moment dans « Infos Entreprise ».
            </p>
            <ul className="text-left text-sm space-y-1.5 bg-muted/40 rounded-xl p-3">
              <li>1. Ajoutez vos clients</li>
              <li>2. Créez votre première facture ou devis</li>
              <li>3. Suivez vos encaissements dans le journal</li>
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          <button
            onClick={() => (step === 0 ? finish(true) : setStep(s => s - 1))}
            disabled={saving}
            className="px-3 py-2 text-xs font-semibold rounded-lg border-[1.5px] border-border text-muted-foreground hover:bg-background disabled:opacity-50 flex items-center gap-1.5"
          >
            {step === 0 ? 'Passer' : <><ArrowLeft className="w-3.5 h-3.5" /> Retour</>}
          </button>
          <button
            onClick={() => (step === STEPS.length - 1 ? finish() : setStep(s => s + 1))}
            disabled={saving || (step === 1 && !initialNom.trim())}
            className="px-4 py-2 text-xs font-bold rounded-lg gradient-primary text-primary-foreground disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving ? '…' : step === STEPS.length - 1 ? 'Commencer' : <>Continuer <ArrowRight className="w-3.5 h-3.5" /></>}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
