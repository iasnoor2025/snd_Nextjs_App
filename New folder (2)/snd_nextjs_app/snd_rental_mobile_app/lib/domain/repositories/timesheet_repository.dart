import '../../data/models/timesheet_model.dart';

abstract class TimesheetRepository {
  // Get all timesheets with pagination
  Future<List<TimesheetModel>> getTimesheets({
    int page = 1,
    int limit = 20,
    String? search,
    String? status,
    String? employeeId,
    String? projectId,
    DateTime? startDate,
    DateTime? endDate,
  });

  // Get timesheet by ID
  Future<TimesheetModel?> getTimesheetById(String id);

  // Create new timesheet
  Future<TimesheetModel> createTimesheet(TimesheetModel timesheet);

  // Update timesheet
  Future<TimesheetModel> updateTimesheet(String id, TimesheetModel timesheet);

  // Delete timesheet
  Future<void> deleteTimesheet(String id);

  // Get employee timesheets
  Future<List<TimesheetModel>> getEmployeeTimesheets(
    String employeeId, {
    DateTime? startDate,
    DateTime? endDate,
  });

  // Get project timesheets
  Future<List<TimesheetModel>> getProjectTimesheets(
    String projectId, {
    DateTime? startDate,
    DateTime? endDate,
  });

  // Get weekly timesheets
  Future<List<TimesheetModel>> getWeeklyTimesheets({
    DateTime? weekStart,
    String? employeeId,
    String? projectId,
  });

  // Get monthly timesheets
  Future<List<TimesheetModel>> getMonthlyTimesheets({
    int? year,
    int? month,
    String? employeeId,
    String? projectId,
  });

  // Approve timesheet
  Future<void> approveTimesheet(String id, String approvedById);

  // Reject timesheet
  Future<void> rejectTimesheet(String id, String rejectionReason);

  // Bulk approve timesheets
  Future<void> bulkApproveTimesheets(List<String> timesheetIds, String approvedById);

  // Get pending approvals
  Future<List<TimesheetModel>> getPendingApprovals();

  // Get timesheet statistics
  Future<Map<String, dynamic>> getTimesheetStatistics({
    DateTime? startDate,
    DateTime? endDate,
    String? employeeId,
    String? projectId,
  });

  // Search timesheets
  Future<List<TimesheetModel>> searchTimesheets(String query);

  // Get timesheets by status
  Future<List<TimesheetModel>> getTimesheetsByStatus(String status);

  // Get timesheets by date range
  Future<List<TimesheetModel>> getTimesheetsByDateRange(
    DateTime startDate,
    DateTime endDate,
  );
}
