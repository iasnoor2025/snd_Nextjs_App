import 'package:flutter/foundation.dart';
import '../../domain/repositories/timesheet_repository.dart';
import '../../data/repositories/timesheet_repository_impl.dart';
import '../../data/models/timesheet_model.dart';
import '../../core/errors/api_exception.dart';

class TimesheetProvider extends ChangeNotifier {
  final TimesheetRepository _timesheetRepository = TimesheetRepositoryImpl();

  List<TimesheetModel> _timesheets = [];
  List<TimesheetModel> _filteredTimesheets = [];
  TimesheetModel? _selectedTimesheet;
  bool _isLoading = false;
  String? _error;
  String _searchQuery = '';
  String? _statusFilter;
  String? _employeeFilter;
  String? _projectFilter;
  DateTime? _startDateFilter;
  DateTime? _endDateFilter;
  int _currentPage = 1;
  bool _hasMoreData = true;

  // Getters
  List<TimesheetModel> get timesheets => _filteredTimesheets;
  List<TimesheetModel> get filteredTimesheets => _filteredTimesheets;
  TimesheetModel? get selectedTimesheet => _selectedTimesheet;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get errorMessage => _error;
  bool get hasError => _error != null;
  String get searchQuery => _searchQuery;
  String? get statusFilter => _statusFilter;
  String? get employeeFilter => _employeeFilter;
  String? get projectFilter => _projectFilter;
  DateTime? get startDateFilter => _startDateFilter;
  DateTime? get endDateFilter => _endDateFilter;
  bool get hasMoreData => _hasMoreData;

  // Load timesheets
  Future<void> loadTimesheets({
    bool refresh = false,
    String? employeeId,
    String? projectId,
  }) async {
    if (refresh) {
      _currentPage = 1;
      _hasMoreData = true;
      _timesheets.clear();
      _filteredTimesheets.clear();
    }

    if (_isLoading || !_hasMoreData) return;

    _setLoading(true);
    _clearError();

    try {
      final newTimesheets = await _timesheetRepository.getTimesheets(
        page: _currentPage,
        limit: 20,
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
        status: _statusFilter,
        employeeId: employeeId ?? _employeeFilter,
        projectId: projectId ?? _projectFilter,
        startDate: _startDateFilter,
        endDate: _endDateFilter,
      );

      if (refresh) {
        _timesheets = newTimesheets;
      } else {
        _timesheets.addAll(newTimesheets);
      }

      _hasMoreData = newTimesheets.length == 20;
      _currentPage++;

      _applyFilters();
    } on ApiException catch (e) {
      _setError(e.message);
    } catch (e) {
      _setError('Failed to load timesheets: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Load more timesheets (pagination)
  Future<void> loadMoreTimesheets() async {
    await loadTimesheets();
  }

  // Refresh timesheets
  Future<void> refreshTimesheets() async {
    await loadTimesheets(refresh: true);
  }

  // Get timesheet by ID
  Future<void> getTimesheetById(String id) async {
    _setLoading(true);
    _clearError();

    try {
      _selectedTimesheet = await _timesheetRepository.getTimesheetById(id);
      if (_selectedTimesheet == null) {
        _setError('Timesheet not found');
      }
    } on ApiException catch (e) {
      _setError(e.message);
    } catch (e) {
      _setError('Failed to load timesheet: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Create timesheet
  Future<bool> createTimesheet(TimesheetModel timesheet) async {
    _setLoading(true);
    _clearError();

    try {
      final newTimesheet = await _timesheetRepository.createTimesheet(timesheet);
      _timesheets.insert(0, newTimesheet);
      _applyFilters();
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to create timesheet: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update timesheet
  Future<bool> updateTimesheet(String id, TimesheetModel timesheet) async {
    _setLoading(true);
    _clearError();

    try {
      final updatedTimesheet = await _timesheetRepository.updateTimesheet(id, timesheet);
      
      // Update in local list
      final index = _timesheets.indexWhere((t) => t.id == id);
      if (index != -1) {
        _timesheets[index] = updatedTimesheet;
        _applyFilters();
      }

      // Update selected timesheet if it's the same
      if (_selectedTimesheet?.id == id) {
        _selectedTimesheet = updatedTimesheet;
      }

      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to update timesheet: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Delete timesheet
  Future<bool> deleteTimesheet(String id) async {
    _setLoading(true);
    _clearError();

    try {
      await _timesheetRepository.deleteTimesheet(id);
      
      // Remove from local list
      _timesheets.removeWhere((t) => t.id == id);
      _applyFilters();

      // Clear selected timesheet if it's the same
      if (_selectedTimesheet?.id == id) {
        _selectedTimesheet = null;
      }

      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to delete timesheet: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Approve timesheet
  Future<bool> approveTimesheet(String id, String approvedById) async {
    _setLoading(true);
    _clearError();

    try {
      await _timesheetRepository.approveTimesheet(id, approvedById);
      
      // Update in local list
      final index = _timesheets.indexWhere((t) => t.id == id);
      if (index != -1) {
        _timesheets[index] = _timesheets[index].copyWith(
          status: 'approved',
          approvedById: approvedById,
          approvedAt: DateTime.now(),
        );
        _applyFilters();
      }

      // Update selected timesheet if it's the same
      if (_selectedTimesheet?.id == id) {
        _selectedTimesheet = _selectedTimesheet!.copyWith(
          status: 'approved',
          approvedById: approvedById,
          approvedAt: DateTime.now(),
        );
      }

      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to approve timesheet: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Reject timesheet
  Future<bool> rejectTimesheet(String id, String rejectionReason) async {
    _setLoading(true);
    _clearError();

    try {
      await _timesheetRepository.rejectTimesheet(id, rejectionReason);
      
      // Update in local list
      final index = _timesheets.indexWhere((t) => t.id == id);
      if (index != -1) {
        _timesheets[index] = _timesheets[index].copyWith(
          status: 'rejected',
          rejectionReason: rejectionReason,
        );
        _applyFilters();
      }

      // Update selected timesheet if it's the same
      if (_selectedTimesheet?.id == id) {
        _selectedTimesheet = _selectedTimesheet!.copyWith(
          status: 'rejected',
          rejectionReason: rejectionReason,
        );
      }

      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to reject timesheet: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Search timesheets
  void searchTimesheets(String query) {
    _searchQuery = query;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data with search query
    loadTimesheets(refresh: true);
  }

  // Filter timesheets by status
  void filterByStatus(String? status) {
    _statusFilter = status;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data with status filter
    loadTimesheets(refresh: true);
  }

  // Filter timesheets by employee
  void filterByEmployee(String? employee) {
    _employeeFilter = employee;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data with employee filter
    loadTimesheets(refresh: true);
  }

  // Filter timesheets by project
  void filterByProject(String? project) {
    _projectFilter = project;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data with project filter
    loadTimesheets(refresh: true);
  }

  // Filter timesheets by date range
  void filterByDateRange(DateTime? startDate, DateTime? endDate) {
    _startDateFilter = startDate;
    _endDateFilter = endDate;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data with date filter
    loadTimesheets(refresh: true);
  }

  // Clear all filters
  void clearFilters() {
    _searchQuery = '';
    _statusFilter = null;
    _employeeFilter = null;
    _projectFilter = null;
    _startDateFilter = null;
    _endDateFilter = null;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data without filters
    loadTimesheets(refresh: true);
  }

  // Apply filters to timesheets list
  void _applyFilters() {
    _filteredTimesheets = List.from(_timesheets);

    // Apply search filter
    if (_searchQuery.isNotEmpty) {
      _filteredTimesheets = _filteredTimesheets.where((timesheet) {
        final employeeName = timesheet.employeeName.toLowerCase();
        final projectName = (timesheet.projectName ?? '').toLowerCase();
        final query = _searchQuery.toLowerCase();
        return employeeName.contains(query) || projectName.contains(query);
      }).toList();
    }

    // Apply status filter
    if (_statusFilter != null) {
      _filteredTimesheets = _filteredTimesheets.where((timesheet) {
        return timesheet.status == _statusFilter;
      }).toList();
    }

    // Apply employee filter
    if (_employeeFilter != null) {
      _filteredTimesheets = _filteredTimesheets.where((timesheet) {
        return timesheet.employeeId == _employeeFilter;
      }).toList();
    }

    // Apply project filter
    if (_projectFilter != null) {
      _filteredTimesheets = _filteredTimesheets.where((timesheet) {
        return timesheet.projectId == _projectFilter;
      }).toList();
    }

    // Apply date range filter
    if (_startDateFilter != null && _endDateFilter != null) {
      _filteredTimesheets = _filteredTimesheets.where((timesheet) {
        return timesheet.date.isAfter(_startDateFilter!.subtract(const Duration(days: 1))) &&
               timesheet.date.isBefore(_endDateFilter!.add(const Duration(days: 1)));
      }).toList();
    }

    notifyListeners();
  }

  // Get timesheet statistics
  Map<String, dynamic> getTimesheetStats() {
    final total = _timesheets.length;
    final pending = _timesheets.where((t) => t.isPending).length;
    final approved = _timesheets.where((t) => t.isApproved).length;
    final rejected = _timesheets.where((t) => t.isRejected).length;
    
    final totalHours = _timesheets.fold(0.0, (sum, t) => sum + t.totalHours);
    final totalOvertime = _timesheets.fold(0.0, (sum, t) => sum + (t.overtimeHours ?? 0));
    
    return {
      'total': total,
      'pending': pending,
      'approved': approved,
      'rejected': rejected,
      'totalHours': totalHours,
      'totalOvertime': totalOvertime,
    };
  }

  // Get employees list
  List<String> getEmployees() {
    return _timesheets
        .map((t) => t.employeeName)
        .toSet()
        .toList()
      ..sort();
  }

  // Get projects list
  List<String> getProjects() {
    return _timesheets
        .map((t) => t.projectName)
        .where((project) => project != null && project.isNotEmpty)
        .cast<String>()
        .toSet()
        .toList()
      ..sort();
  }

  // Private helper methods
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
  }

  // Clear all data
  void clearData() {
    _timesheets.clear();
    _filteredTimesheets.clear();
    _selectedTimesheet = null;
    _searchQuery = '';
    _statusFilter = null;
    _employeeFilter = null;
    _projectFilter = null;
    _startDateFilter = null;
    _endDateFilter = null;
    _currentPage = 1;
    _hasMoreData = true;
    _error = null;
    notifyListeners();
  }

}
