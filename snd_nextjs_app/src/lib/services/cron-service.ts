import cron from 'node-cron';

class CronService {
  private static instance: CronService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): CronService {
    if (!CronService.instance) {
      CronService.instance = new CronService();
    }
    return CronService.instance;
  }

  public async initialize() {
    // Only initialize on the server side
    if (typeof window !== 'undefined') {
      console.log('Cron service cannot run on client side');
      return;
    }

    if (this.isInitialized) {
      console.log('Cron service already initialized');
      return;
    }

    try {
      console.log('Initializing cron service...');
      
      // Schedule timesheet auto-generation at 4 AM every day
      cron.schedule(
        '0 4 * * *',
        async () => {
          console.log('Running scheduled timesheet auto-generation...');
          try {
            // Dynamic import to avoid client-side bundling
            const { autoGenerateTimesheets } = await import('@/lib/timesheet-auto-generator');
            const result = await autoGenerateTimesheets();
            if (result.success) {
              console.log('Scheduled timesheet auto-generation completed successfully');
              if (result.errors.length > 0) {
                console.warn('Scheduled timesheet auto-generation completed with warnings:', result.errors);
              }
            } else {
              console.error('Scheduled timesheet auto-generation failed');
              if (result.errors.length > 0) {
                console.error('Scheduled timesheet auto-generation errors:', result.errors);
              }
            }
          } catch (error) {
            console.error('Error in scheduled timesheet auto-generation cron job:', error);
          }
        },
        {
          timezone: 'Asia/Riyadh', // Saudi Arabia timezone
        }
      );

      // Schedule employee status update at 5 AM every day
      cron.schedule(
        '0 5 * * *',
        async () => {
          console.log('Running scheduled employee status update...');
          try {
            // Call the employee status update API
            const response = await fetch(
              `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/employee-status`,
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${process.env.CRON_SECRET}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (response.ok) {
              const result = await response.json();
              console.log('Scheduled employee status update completed successfully');
            } else {
              console.error('Scheduled employee status update failed with status:', response.status);
            }
          } catch (error) {
            console.error('Error in scheduled employee status update cron job:', error);
          }
        },
        {
          timezone: 'Asia/Riyadh', // Saudi Arabia timezone
        }
      );

      // Schedule equipment status monitoring every hour (for critical monitoring)
      cron.schedule(
        '0 * * * *',
        async () => {
          console.log('Running hourly equipment status monitoring...');
          try {
            // Call the equipment status monitoring API
            const response = await fetch(
              `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/equipment-status-monitor`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${process.env.CRON_SECRET}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (response.ok) {
              const result = await response.json();
              console.log('Hourly equipment status monitoring completed successfully');
              if (result.results && result.results.fixed > 0) {
                console.log(`Fixed ${result.results.fixed} equipment status issues`);
              }
            } else {
              console.error('Hourly equipment status monitoring failed with status:', response.status);
            }
          } catch (error) {
            console.error('Error in hourly equipment status monitoring cron job:', error);
          }
        },
        {
          timezone: 'Asia/Riyadh', // Saudi Arabia timezone
        }
      );

      // Schedule equipment status monitoring at 6 AM every day (comprehensive check)
      cron.schedule(
        '0 6 * * *',
        async () => {
          console.log('Running daily comprehensive equipment status monitoring...');
          try {
            // Call the equipment status monitoring API
            const response = await fetch(
              `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/equipment-status-monitor`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${process.env.CRON_SECRET}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (response.ok) {
              const result = await response.json();
              console.log('Daily comprehensive equipment status monitoring completed successfully');
              if (result.results && result.results.fixed > 0) {
                console.log(`Fixed ${result.results.fixed} equipment status issues`);
              }
            } else {
              console.error('Daily comprehensive equipment status monitoring failed with status:', response.status);
            }
          } catch (error) {
            console.error('Error in daily comprehensive equipment status monitoring cron job:', error);
          }
        },
        {
          timezone: 'Asia/Riyadh', // Saudi Arabia timezone
        }
      );



      this.isInitialized = true;
      console.log('Cron service initialized successfully with scheduled jobs');
    } catch (error) {
      console.error('Failed to initialize cron service:', error);
    }
  }

  // Method to manually trigger timesheet auto-generation
  public async triggerTimesheetGeneration() {
    try {
      console.log('Manually triggering timesheet auto-generation...');
      const { autoGenerateTimesheets } = await import('@/lib/timesheet-auto-generator');
      const result = await autoGenerateTimesheets();
      
      if (result.success) {
        console.log('Manual timesheet auto-generation completed successfully');
        if (result.errors.length > 0) {
          console.warn('Manual timesheet auto-generation completed with warnings:', result.errors);
        }
      } else {
        console.error('Manual timesheet auto-generation failed');
        if (result.errors.length > 0) {
          console.error('Manual timesheet auto-generation errors:', result.errors);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error in manual timesheet auto-generation:', error);
      throw error;
    }
  }



  public stop() {
    console.log('Stopping cron service...');
    cron.getTasks().forEach(task => task.stop());
    this.isInitialized = false;
    console.log('Cron service stopped');
  }

  public getStatus() {
    return {
      isInitialized: this.isInitialized,
      tasks: Array.from(cron.getTasks().keys()),
      totalTasks: cron.getTasks().size,
      nextRun: this.getNextRunTimes(),
    };
  }

  private getNextRunTimes() {
    const tasks = cron.getTasks();
    const nextRuns: { [key: string]: string } = {};
    
    tasks.forEach((task, name) => {
      try {
        // Note: node-cron doesn't provide next run time information
        // We can only track if the task is running
        nextRuns[name] = 'running';
      } catch (error) {
        console.error(`Error getting status for task ${name}:`, error);
      }
    });
    
    return nextRuns;
  }
}

export const cronService = CronService.getInstance();
