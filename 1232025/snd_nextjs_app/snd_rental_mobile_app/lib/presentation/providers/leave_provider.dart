import 'package:flutter/foundation.dart';
import '../../data/models/leave_model.dart';
import '../../data/repositories/leave_repository_impl.dart';

class LeaveProvider extends ChangeNotifier {
  final LeaveRepositoryImpl _repository = LeaveRepositoryImpl();
  
  List<LeaveModel> _leaves = [];
  bool _isLoading = false;
  String? _errorMessage;
  int _currentPage = 1;
  bool _hasMore = true;
  String? _statusFilter;
  int? _employeeFilter;
  String? _leaveTypeFilter;

  // Getters
  List<LeaveModel> get leaves => _leaves;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get hasMore => _hasMore;
  String? get statusFilter => _statusFilter;
  int? get employeeFilter => _employeeFilter;
  String? get leaveTypeFilter => _leaveTypeFilter;

  List<LeaveModel> get filteredLeaves {
    if (_statusFilter == null && _employeeFilter == null && _leaveTypeFilter == null) {
      return _leaves;
    }
    
    return _leaves.where((leave) {
      bool matches = true;
      
      if (_statusFilter != null && leave.status != _statusFilter) {
        matches = false;
      }
      
      if (_employeeFilter != null && leave.employeeId != _employeeFilter) {
        matches = false;
      }
      
      if (_leaveTypeFilter != null && leave.leaveType != _leaveTypeFilter) {
        matches = false;
      }
      
      return matches;
    }).toList();
  }

  Map<String, int> getLeaveStats() {
    final stats = <String, int>{
      'total': _leaves.length,
      'pending': _leaves.where((l) => l.status == 'pending').length,
      'approved': _leaves.where((l) => l.status == 'approved').length,
      'rejected': _leaves.where((l) => l.status == 'rejected').length,
      'cancelled': _leaves.where((l) => l.status == 'cancelled').length,
    };
    return stats;
  }

  Future<void> loadLeaves({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
      _leaves.clear();
    }

    if (!_hasMore || _isLoading) return;

    _setLoading(true);
    _clearError();

    try {
      final newLeaves = await _repository.getLeaves(
        page: _currentPage,
        status: _statusFilter,
        employeeId: _employeeFilter,
        leaveType: _leaveTypeFilter,
      );

      if (newLeaves.isEmpty) {
        _hasMore = false;
      } else {
        if (refresh) {
          _leaves = newLeaves;
        } else {
          _leaves.addAll(newLeaves);
        }
        _currentPage++;
      }
    } catch (e) {
      _setError('Failed to load leaves: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadMoreLeaves() async {
    await loadLeaves();
  }

  Future<void> refreshLeaves() async {
    await loadLeaves(refresh: true);
  }

  Future<LeaveModel?> getLeaveById(int id) async {
    try {
      return await _repository.getLeaveById(id);
    } catch (e) {
      _setError('Failed to load leave: ${e.toString()}');
      return null;
    }
  }

  Future<bool> createLeave(LeaveModel leave) async {
    _setLoading(true);
    _clearError();

    try {
      final newLeave = await _repository.createLeave(leave);
      _leaves.insert(0, newLeave);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Failed to create leave: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> updateLeave(int id, LeaveModel leave) async {
    _setLoading(true);
    _clearError();

    try {
      final updatedLeave = await _repository.updateLeave(id, leave);
      final index = _leaves.indexWhere((l) => l.id == id);
      if (index != -1) {
        _leaves[index] = updatedLeave;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('Failed to update leave: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> deleteLeave(int id) async {
    _setLoading(true);
    _clearError();

    try {
      await _repository.deleteLeave(id);
      _leaves.removeWhere((l) => l.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Failed to delete leave: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> approveLeave(int id) async {
    _setLoading(true);
    _clearError();

    try {
      final approvedLeave = await _repository.approveLeave(id);
      final index = _leaves.indexWhere((l) => l.id == id);
      if (index != -1) {
        _leaves[index] = approvedLeave;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('Failed to approve leave: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> rejectLeave(int id, String reason) async {
    _setLoading(true);
    _clearError();

    try {
      final rejectedLeave = await _repository.rejectLeave(id, reason);
      final index = _leaves.indexWhere((l) => l.id == id);
      if (index != -1) {
        _leaves[index] = rejectedLeave;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('Failed to reject leave: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<List<LeaveModel>> getEmployeeLeaves(int employeeId) async {
    try {
      return await _repository.getEmployeeLeaves(employeeId);
    } catch (e) {
      _setError('Failed to load employee leaves: ${e.toString()}');
      return [];
    }
  }

  Future<List<LeaveModel>> getPendingApprovals() async {
    try {
      return await _repository.getPendingApprovals();
    } catch (e) {
      _setError('Failed to load pending approvals: ${e.toString()}');
      return [];
    }
  }

  void setStatusFilter(String? status) {
    _statusFilter = status;
    notifyListeners();
  }

  void setEmployeeFilter(int? employeeId) {
    _employeeFilter = employeeId;
    notifyListeners();
  }

  void setLeaveTypeFilter(String? leaveType) {
    _leaveTypeFilter = leaveType;
    notifyListeners();
  }

  void clearFilters() {
    _statusFilter = null;
    _employeeFilter = null;
    _leaveTypeFilter = null;
    notifyListeners();
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _errorMessage = error;
    notifyListeners();
  }

  void _clearError() {
    _errorMessage = null;
  }

  bool get hasError => _errorMessage != null;
}
