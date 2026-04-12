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
  }));

  return <BankrollDashboard bankroll={bankroll} betHistory={betHistory} />;
}