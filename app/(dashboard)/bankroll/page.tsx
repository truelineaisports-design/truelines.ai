import { getBankroll, getBetHistory } from './actions';
import { BankrollSetup } from './components/BankrollSetup';
import { BankrollDashboard } from './components/BankrollDashboard';

export default async function BankrollPage() {
  const bankroll = await getBankroll();
  const rawBetHistory = await getBetHistory();

  if (!bankroll) {
    return <BankrollSetup />;
  }

const betHistory = rawBetHistory.map((bet) => ({
    ...bet,
    potentialPayout: bet.potentialPayout ?? '0.00',
    actualPayout: bet.actualPayout ?? null,
    kellyStakePct: bet.kellyStakePct ?? null,
    placedAt: bet.placedAt ?? new Date(),
    createdAt: bet.createdAt ?? new Date(),
  }));

  const safeBankroll = {
    ...bankroll,
    peakBankroll: bankroll.peakBankroll ?? bankroll.bankrollAmount,
    maxDrawdownPct: bankroll.maxDrawdownPct ?? '0',
  };

  return <BankrollDashboard bankroll={safeBankroll} betHistory={betHistory} />;
}