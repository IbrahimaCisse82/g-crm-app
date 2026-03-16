interface DateFilterProps {
  month: string;
  setMonth: (m: string) => void;
  availableMonths: string[];
}

const monthLabels: Record<string, string> = {
  '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
  '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
  '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre',
};

export function DateFilter({ month, setMonth, availableMonths }: DateFilterProps) {
  return (
    <select
      className="bg-background border-[1.5px] border-border rounded-lg py-1 px-2 text-xs text-foreground outline-none font-sans"
      value={month}
      onChange={e => setMonth(e.target.value)}
    >
      <option value="">Toutes dates</option>
      {availableMonths.map(m => {
        const [year, mo] = m.split('-');
        return <option key={m} value={m}>{monthLabels[mo] || mo} {year}</option>;
      })}
    </select>
  );
}
