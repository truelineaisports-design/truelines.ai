import { inngest } from '../client';

export const fetchInjuriesJob = inngest.createFunction(
  { id: 'fetch-injuries', name: 'Fetch NBA Injuries', triggers: [{ cron: '*/30 * * * *' }] },
  async ({ step }) => {
    await step.run('run-injury-script', async () => {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout, stderr } = await execAsync(
        'python3 scripts/nba/fetch_injuries.py',
        { env: { ...process.env } }
      );
      if (stderr) console.error(stderr);
      console.log(stdout);
    });
  }
);