import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { fetchOddsJob } from '@/lib/inngest/jobs/fetch-odds';
import { fetchInjuriesJob } from '@/lib/inngest/jobs/fetch-injuries';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [fetchOddsJob, fetchInjuriesJob],
});