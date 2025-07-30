import { toast } from 'sonner';

export interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export class ToastService {
  // ========================================
  // SUCCESS NOTIFICATIONS
  // ========================================

  static success(message: string, options?: ToastOptions) {
    return toast.success(message, {
      duration: options?.duration || 4000,
      action: options?.action,
    });
  }

  static created(subject: string, options?: ToastOptions) {
    return this.success(`${subject} created successfully`, options);
  }

  static updated(subject: string, options?: ToastOptions) {
    return this.success(`${subject} updated successfully`, options);
  }

  static deleted(subject: string, options?: ToastOptions) {
    return this.success(`${subject} deleted successfully`, options);
  }

  static saved(subject: string, options?: ToastOptions) {
    return this.success(`${subject} saved successfully`, options);
  }

  static approved(subject: string, options?: ToastOptions) {
    return this.success(`${subject} approved successfully`, options);
  }

  static rejected(subject: string, options?: ToastOptions) {
    return this.success(`${subject} rejected successfully`, options);
  }

  static uploaded(subject: string, options?: ToastOptions) {
    return this.success(`${subject} uploaded successfully`, options);
  }

  static exported(subject: string, options?: ToastOptions) {
    return this.success(`${subject} exported successfully`, options);
  }

  static imported(subject: string, options?: ToastOptions) {
    return this.success(`${subject} imported successfully`, options);
  }

  static synced(subject: string, options?: ToastOptions) {
    return this.success(`${subject} synced successfully`, options);
  }

  // ========================================
  // ERROR NOTIFICATIONS
  // ========================================

  static error(message: string, options?: ToastOptions) {
    return toast.error(message, {
      duration: options?.duration || 6000,
      action: options?.action,
    });
  }

  static failed(subject: string, action: string, options?: ToastOptions) {
    return this.error(`Failed to ${action} ${subject}`, options);
  }

  static notFound(subject: string, options?: ToastOptions) {
    return this.error(`${subject} not found`, options);
  }

  static unauthorized(options?: ToastOptions) {
    return this.error('You are not authorized to perform this action', options);
  }

  static forbidden(options?: ToastOptions) {
    return this.error('Access forbidden', options);
  }

  static validationError(message: string, options?: ToastOptions) {
    return this.error(`Validation error: ${message}`, options);
  }

  static networkError(options?: ToastOptions) {
    return this.error('Network error. Please check your connection.', options);
  }

  static serverError(options?: ToastOptions) {
    return this.error('Server error. Please try again later.', options);
  }

  // ========================================
  // WARNING NOTIFICATIONS
  // ========================================

  static warning(message: string, options?: ToastOptions) {
    return toast.warning(message, {
      duration: options?.duration || 5000,
      action: options?.action,
    });
  }

  static incomplete(subject: string, options?: ToastOptions) {
    return this.warning(`${subject} is incomplete`, options);
  }

  static pending(subject: string, options?: ToastOptions) {
    return this.warning(`${subject} is pending approval`, options);
  }

  static draft(subject: string, options?: ToastOptions) {
    return this.warning(`${subject} saved as draft`, options);
  }

  // ========================================
  // INFO NOTIFICATIONS
  // ========================================

  static info(message: string, options?: ToastOptions) {
    return toast.info(message, {
      duration: options?.duration || 4000,
      action: options?.action,
    });
  }

  static processing(subject: string, options?: ToastOptions) {
    return this.info(`Processing ${subject}...`, options);
  }

  static loading(subject: string, options?: ToastOptions) {
    return this.info(`Loading ${subject}...`, options);
  }

  static syncing(subject: string, options?: ToastOptions) {
    return this.info(`Syncing ${subject}...`, options);
  }

  // ========================================
  // CRUD OPERATIONS
  // ========================================

  static createSuccess(subject: string, options?: ToastOptions) {
    return this.created(subject, options);
  }

  static createError(subject: string, error?: string, options?: ToastOptions) {
    const message = error || `Failed to create ${subject}`;
    return this.error(message, options);
  }

  static updateSuccess(subject: string, options?: ToastOptions) {
    return this.updated(subject, options);
  }

  static updateError(subject: string, error?: string, options?: ToastOptions) {
    const message = error || `Failed to update ${subject}`;
    return this.error(message, options);
  }

  static deleteSuccess(subject: string, options?: ToastOptions) {
    return this.deleted(subject, options);
  }

  static deleteError(subject: string, error?: string, options?: ToastOptions) {
    const message = error || `Failed to delete ${subject}`;
    return this.error(message, options);
  }

  static fetchError(subject: string, error?: string, options?: ToastOptions) {
    const message = error || `Failed to fetch ${subject}`;
    return this.error(message, options);
  }

  // ========================================
  // FILE OPERATIONS
  // ========================================

  static fileUploadSuccess(fileName: string, options?: ToastOptions) {
    return this.success(`File "${fileName}" uploaded successfully`, options);
  }

  static fileUploadError(fileName: string, error?: string, options?: ToastOptions) {
    const message = error || `Failed to upload "${fileName}"`;
    return this.error(message, options);
  }

  static fileDeleteSuccess(fileName: string, options?: ToastOptions) {
    return this.success(`File "${fileName}" deleted successfully`, options);
  }

  static fileDeleteError(fileName: string, error?: string, options?: ToastOptions) {
    const message = error || `Failed to delete "${fileName}"`;
    return this.error(message, options);
  }

  static fileValidationError(message: string, options?: ToastOptions) {
    return this.error(`File validation error: ${message}`, options);
  }

  // ========================================
  // PAYMENT OPERATIONS
  // ========================================

  static paymentSuccess(amount: string, options?: ToastOptions) {
    return this.success(`Payment of ${amount} processed successfully`, options);
  }

  static paymentError(amount: string, error?: string, options?: ToastOptions) {
    const message = error || `Failed to process payment of ${amount}`;
    return this.error(message, options);
  }

  static refundSuccess(amount: string, options?: ToastOptions) {
    return this.success(`Refund of ${amount} processed successfully`, options);
  }

  static refundError(amount: string, error?: string, options?: ToastOptions) {
    const message = error || `Failed to process refund of ${amount}`;
    return this.error(message, options);
  }

  // ========================================
  // WORKFLOW OPERATIONS
  // ========================================

  static workflowApproved(subject: string, options?: ToastOptions) {
    return this.success(`${subject} workflow approved`, options);
  }

  static workflowRejected(subject: string, reason?: string, options?: ToastOptions) {
    const message = reason ? `${subject} rejected: ${reason}` : `${subject} rejected`;
    return this.error(message, options);
  }

  static workflowPending(subject: string, options?: ToastOptions) {
    return this.warning(`${subject} is pending approval`, options);
  }

  static workflowCompleted(subject: string, options?: ToastOptions) {
    return this.success(`${subject} workflow completed`, options);
  }

  // ========================================
  // EXPORT/IMPORT OPERATIONS
  // ========================================

  static exportSuccess(format: string, options?: ToastOptions) {
    return this.success(`Data exported to ${format.toUpperCase()} successfully`, options);
  }

  static exportError(format: string, error?: string, options?: ToastOptions) {
    const message = error || `Failed to export data to ${format.toUpperCase()}`;
    return this.error(message, options);
  }

  static importSuccess(count: number, options?: ToastOptions) {
    return this.success(`${count} records imported successfully`, options);
  }

  static importError(error?: string, options?: ToastOptions) {
    const message = error || 'Failed to import data';
    return this.error(message, options);
  }

  // ========================================
  // SYNC OPERATIONS
  // ========================================

  static syncSuccess(subject: string, count?: number, options?: ToastOptions) {
    const message = count ? `${subject} synced (${count} records)` : `${subject} synced successfully`;
    return this.success(message, options);
  }

  static syncError(subject: string, error?: string, options?: ToastOptions) {
    const message = error || `Failed to sync ${subject}`;
    return this.error(message, options);
  }

  static syncInProgress(subject: string, options?: ToastOptions) {
    return this.info(`Syncing ${subject}...`, options);
  }

  // ========================================
  // VALIDATION OPERATIONS
  // ========================================

  static validationSuccess(subject: string, options?: ToastOptions) {
    return this.success(`${subject} validation passed`, options);
  }

  static validationError(subject: string, errors: string[], options?: ToastOptions) {
    const message = `${subject} validation failed:\n${errors.join('\n')}`;
    return this.error(message, options);
  }

  static fieldRequired(fieldName: string, options?: ToastOptions) {
    return this.error(`${fieldName} is required`, options);
  }

  static fieldInvalid(fieldName: string, reason?: string, options?: ToastOptions) {
    const message = reason ? `${fieldName} is invalid: ${reason}` : `${fieldName} is invalid`;
    return this.error(message, options);
  }

  // ========================================
  // CONNECTION OPERATIONS
  // ========================================

  static connectionSuccess(service: string, options?: ToastOptions) {
    return this.success(`${service} connection established`, options);
  }

  static connectionError(service: string, error?: string, options?: ToastOptions) {
    const message = error || `Failed to connect to ${service}`;
    return this.error(message, options);
  }

  static connectionTimeout(service: string, options?: ToastOptions) {
    return this.error(`${service} connection timeout`, options);
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  static dismiss() {
    toast.dismiss();
  }

  static dismissAll() {
    toast.dismiss();
  }

  static promise<T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string;
      error: string;
    }
  ) {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  }
}

// Export default instance for convenience
export default ToastService; 