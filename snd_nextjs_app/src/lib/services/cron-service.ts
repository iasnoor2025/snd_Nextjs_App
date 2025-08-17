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
      console.log('Cron service cannot be initialized on the client side');
      return;
    }

    if (this.isInitialized) {
      console.log('Cron service already initialized');
      return;
    }

    console.log('Initializing cron service...');

    try {
      // Schedule timesheet auto-generation at 4 AM every day
      cron.schedule('0 4 * * *', async () => {
        console.log('🕐 Running scheduled timesheet auto-generation at 4 AM...');
        try {
          // Dynamic import to avoid client-side bundling
          const { autoGenerateTimesheets } = await import('@/lib/timesheet-auto-generator');
          const result = await autoGenerateTimesheets();
          if (result.success) {
            console.log(`✅ Timesheet auto-generation completed successfully. Created: ${result.created} timesheets`);
            if (result.errors.length > 0) {
              console.warn(`⚠️ Auto-generation completed with ${result.errors.length} errors:`, result.errors);
            }
          } else {
            console.error('❌ Timesheet auto-generation failed:', result.message);
            if (result.errors.length > 0) {
              console.error('Errors:', result.errors);
            }
          }
        } catch (error) {
          console.error('❌ Error in scheduled timesheet auto-generation:', error);
        }
      }, {
        timezone: 'Asia/Riyadh' // Saudi Arabia timezone
      });

      // Schedule employee status update at 5 AM every day
      cron.schedule('0 5 * * *', async () => {
        console.log('🕐 Running scheduled employee status update at 5 AM...');
        try {
          // Call the employee status update API
          const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/employee-status`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.CRON_SECRET}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const result = await response.json();
            console.log('✅ Employee status update completed successfully:', result);
          } else {
            console.error('❌ Employee status update failed:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('❌ Error in scheduled employee status update:', error);
        }
      }, {
        timezone: 'Asia/Riyadh' // Saudi Arabia timezone
      });

      // In development, also schedule a test job every 5 minutes for testing
      if (process.env.NODE_ENV === 'development') {
        cron.schedule('*/5 * * * *', async () => {
          console.log('🧪 Development mode: Running test timesheet auto-generation every 5 minutes...');
          try {
            // Dynamic import to avoid client-side bundling
            const { autoGenerateTimesheets } = await import('@/lib/timesheet-auto-generator');
            const result = await autoGenerateTimesheets();
            if (result.success) {
              console.log(`✅ Development test completed. Created: ${result.created} timesheets`);
            } else {
              console.log(`⚠️ Development test completed with errors: ${result.errors.length}`);
            }
          } catch (error) {
            console.error('❌ Error in development test:', error);
          }
        });
      }

      this.isInitialized = true;
      console.log('✅ Cron service initialized successfully');
      console.log('📅 Scheduled jobs:');
      console.log('   - Timesheet auto-generation: 4:00 AM daily (Asia/Riyadh)');
      console.log('   - Employee status update: 5:00 AM daily (Asia/Riyadh)');
      if (process.env.NODE_ENV === 'development') {
        console.log('   - Development test: Every 5 minutes');
      }
    } catch (error) {
      console.error('❌ Error initializing cron service:', error);
    }
  }

  public stop() {
    console.log('Stopping cron service...');
    cron.getTasks().forEach(task => task.stop());
    this.isInitialized = false;
    console.log('✅ Cron service stopped');
  }

  public getStatus() {
    return {
      isInitialized: this.isInitialized,
      tasks: Array.from(cron.getTasks().keys())
    };
  }
}

export const cronService = CronService.getInstance();
