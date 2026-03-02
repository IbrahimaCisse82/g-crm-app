import { useApp } from '@/context/AppContext';

export default function CashPage() {
  const { data, fmt, deleteMM } = useApp();
  const mmModes = ['Wave', 'Orange Money', 'Yas Money'];
  const icons: Record<string, string> = { Wave: '🔵', 'Orange Money': '🟠', 'Yas Money': '🟣' };

  // Caisse espèce
  const eIn = data.journal.filter(j => j.type === 'Recette' && (j.mode === 'Espèce' || j.cpt === 'Caisse')).reduce((s, j) => s + j.mnt, 0);
  const eOut = data.journal.filter(j => j.type === 'Dépense' && (j.mode === 'Espèce' || j.cpt === 'Caisse')).reduce((s, j) => s + j.mnt, 0);
  const soldeCaisse = eIn - eOut;

  // Banque
  const bIn = data.journal.filter(j => j.type === 'Recette' && (j.mode === 'Virement' || j.mode === 'Chèque')).reduce((s, j) => s + j.mnt, 0);
  const bOut = data.journal.filter(j => j.type === 'Dépense' && (j.mode === 'Virement' || j.mode === 'Chèque')).reduce((s, j) => s + j.mnt, 0);
  const soldeBanque = bIn - bOut;

  // Mobile Money
  let mmTot = 0;
  const mmCards = data.mm.map(mm => {
    const mIn = data.journal.filter(j => j.type === 'Recette' && mmModes.includes(j.mode) && j.cpt?.includes(mm.num)).reduce((s, j) => s + j.mnt, 0);
    const mOut = data.journal.filter(j => j.type === 'Dépense' && mmModes.includes(j.mode) && j.cpt?.includes(mm.num)).reduce((s, j) => s + j.mnt, 0);
    const sol = mm.sol + mIn - mOut;
    mmTot += sol;
    return { mm, sol, mIn, mOut };
  });

  const total = soldeCaisse + mmTot + soldeBanque;

  return (
    <div>
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 mb-3.5">
        <div className="bg-card border border-border rounded-xl p-4 relative overflow-hidden shadow-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-secondary" />
          <div className="text-2xl mb-2">💵</div>
          <div className={`font-black text-lg ${soldeCaisse >= 0 ? '' : 'text-destructive'}`}>{fmt(soldeCaisse)}</div>
          <div className="text-[11px] text-muted-foreground">Caisse — Espèce</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 relative overflow-hidden shadow-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-secondary to-primary" />
          <div className="text-2xl mb-2">📱</div>
          <div className="font-black text-lg">{fmt(mmTot)}</div>
          <div className="text-[11px] text-muted-foreground">Mobile Money (total)</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 relative overflow-hidden shadow-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-success" />
          <div className="text-2xl mb-2">🏦</div>
          <div className="font-black text-lg">{fmt(soldeBanque)}</div>
          <div className="text-[11px] text-muted-foreground">Banque</div>
        </div>
      </div>

      {/* Total banner */}
      <div className="gradient-primary rounded-xl p-4 px-5 flex justify-between items-center text-primary-foreground mb-4 shadow-primary">
        <div className="text-sm font-bold opacity-85">💰 Trésorerie totale</div>
        <div className="font-black text-xl">{fmt(total)}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mobile Money accounts */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-foreground">📱 Comptes Mobile Money</h3>
          </div>
          <div className="p-4">
            {mmCards.length ? mmCards.map(({ mm, sol, mIn, mOut }) => (
              <div key={mm.id} className="bg-background border-[1.5px] border-border rounded-xl p-3 flex items-center justify-between mb-2 hover:border-primary/30 transition-all">
                <div>
                  <div className="font-bold text-sm">{icons[mm.op] || '📱'} {mm.op}</div>
                  <div className="text-[11px] text-muted-foreground">{mm.tit ? mm.tit + ' · ' : ''}{mm.num}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    Init: {fmt(mm.sol)} · +{fmt(mIn)} · -{fmt(mOut)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-black text-base ${sol >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(sol)}</div>
                  <button onClick={() => { if (confirm('Supprimer ?')) deleteMM(mm.id); }} className="text-[10.5px] text-muted-foreground hover:text-destructive mt-1">🗑 Supprimer</button>
                </div>
              </div>
            )) : (
              <div className="text-center py-7 text-muted-foreground text-xs">
                Aucun compte Mobile Money
              </div>
            )}
          </div>
        </div>

        {/* Account recap */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-extrabold text-sm text-foreground">Récap par compte</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Compte', 'Mode(s)', 'Solde'].map(h => (
                    <th key={h} className="px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-background">
                  <td className="px-3.5 py-3 text-sm font-bold border-b border-border">💵 Caisse</td>
                  <td className="px-3.5 py-3 text-[11.5px] text-muted-foreground border-b border-border">Espèce</td>
                  <td className={`px-3.5 py-3 text-sm font-bold border-b border-border ${soldeCaisse >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(soldeCaisse)}</td>
                </tr>
                {mmCards.map(({ mm, sol }) => (
                  <tr key={mm.id} className="hover:bg-background">
                    <td className="px-3.5 py-3 text-sm font-bold border-b border-border">{icons[mm.op] || '📱'} {mm.op}</td>
                    <td className="px-3.5 py-3 text-[11.5px] text-muted-foreground border-b border-border">Mobile Money</td>
                    <td className={`px-3.5 py-3 text-sm font-bold border-b border-border ${sol >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(sol)}</td>
                  </tr>
                ))}
                <tr className="hover:bg-background">
                  <td className="px-3.5 py-3 text-sm font-bold border-b border-border">🏦 Banque</td>
                  <td className="px-3.5 py-3 text-[11.5px] text-muted-foreground border-b border-border">Virement / Chèque</td>
                  <td className={`px-3.5 py-3 text-sm font-bold border-b border-border ${soldeBanque >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(soldeBanque)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border flex justify-between items-center">
            <span className="text-xs font-bold text-muted-foreground">TOTAL</span>
            <span className="text-sm font-black text-primary">{fmt(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
