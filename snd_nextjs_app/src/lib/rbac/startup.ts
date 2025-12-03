import { initializeRBACSystem } from './rbac-initializer';

/**
 * Auto-initialize RBAC system on application startup
 * This should be called in the main application entry point
 */
export async function initializeRBACOnStartup(): Promise<void> {
  try {
    // Wait a bit for database connection to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Initialize the RBAC system
    await initializeRBACSystem();
  } catch (error) {
    console.error('❌ RBAC system auto-initialization failed:', error);
    // Don't throw - let the application continue
    // The system can still work with manual initialization via API
  }
}

/**
 * Check if RBAC system needs initialization
 * Returns true if initialization is needed
 */
export async function checkRBACInitializationNeeded(): Promise<boolean> {
  try {
    const { rbacInitializer } = await import('./rbac-initializer');
    return !rbacInitializer.isSystemInitialized();
  } catch (error) {
    console.error('Error checking RBAC initialization status:', error);
    return true; // Assume initialization is needed if check fails
  }
}

/**
 * Manual initialization trigger
 * Can be called from admin panel or during setup
 */
export async function manualRBACInitialization(): Promise<boolean> {
  try {
    await initializeRBACSystem();
    return true;
  } catch (error) {
    console.error('Manual RBAC initialization failed:', error);
    return false;
  }
}
