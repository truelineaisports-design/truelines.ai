import { serve } from 'inngest/next';
import { inngest } from '../../../inngest/client';
import { generateParlays } from '../../../inngest/generateParlays';
import { pollOddsStandard, pollOddsPregame } from '../../../inngest/fade-polling';
import { pollLiveGames, processLiveGame } from '../../../inngest/functions/live-props';

export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateParlays, pollOddsStandard, pollOddsPregame, pollLiveGames, processLiveGame],
});