import 'package:flutter/foundation.dart';
import '../../data/models/payroll_model.dart';
import '../../data/repositories/payroll_repository_impl.dart';

class PayrollProvider extends ChangeNotifier {
  final PayrollRepositoryImpl _repository = PayrollRepositoryImpl();
  
  List<PayrollModel> _payrolls = [];
  bool _isLoading = false;
  String? _errorMessage;
  int _currentPage = 1;
  bool _hasMore = true;
  String? _statusFilter;
  int? _employeeFilter;
  String? _periodFilter;

  // Getters
  List<PayrollModel> get payrolls => _payrolls;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get hasMore => _hasMore;
  String? get statusFilter => _statusFilter;
  int? get employeeFilter => _employeeFilter;
  String? get periodFilter => _periodFilter;

  List<PayrollModel> get filteredPayrolls {
    if (_statusFilter == null && _employeeFilter == null && _periodFilter == null) {
      return _payrolls;
    }
    
    return _payrolls.where((payroll) {
      bool matches = true;
      
      if (_statusFilter != null && payroll.status != _statusFilter) {
        matches = false;
      }
      
      if (_employeeFilter != null && payroll.employeeId != _employeeFilter) {
        matches = false;
      }
      
      if (_periodFilter != null && payroll.period != _periodFilter) {
        matches = false;
      }
      
      return matches;
    }).toList();
  }

  Map<String, int> getPayrollStats() {
    final stats = <String, int>{
      'total': _payrolls.length,
      'pending': _payrolls.where((p) => p.status == 'pending').length,
      'approved': _payrolls.where((p) => p.status == 'approved').length,
      'processed': _payrolls.where((p) => p.status == 'processed').length,
    };
    return stats;
  }

  Future<void> loadPayrolls({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
      _payrolls.clear();
    }

    if (!_hasMore || _isLoading) return;

    _setLoading(true);
    _clearError();

    try {
      final newPayrolls = await _repository.getPayrolls(
        page: _currentPage,
        status: _statusFilter,
        employeeId: _employeeFilter,
        period: _periodFilter,
      );

      if (newPayrolls.isEmpty) {
        _hasMore = false;
      } else {
        if (refresh) {
          _payrolls = newPayrolls;
        } else {
          _payrolls.addAll(newPayrolls);
        }
        _currentPage++;
      }
    } catch (e) {
      _setError('Failed to load payrolls: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadMorePayrolls() async {
    await loadPayrolls();
  }

  Future<void> refreshPayrolls() async {
    await loadPayrolls(refresh: true);
  }

  Future<PayrollModel?> getPayrollById(int id) async {
    try {
      return await _repository.getPayrollById(id);
    } catch (e) {
      _setError('Failed to load payroll: ${e.toString()}');
      return null;
    }
  }

  Future<bool> createPayroll(PayrollModel payroll) async {
    _setLoading(true);
    _clearError();

    try {
      final newPayroll = await _repository.createPayroll(payroll);
      _payrolls.insert(0, newPayroll);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Failed to create payroll: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> updatePayroll(int id, PayrollModel payroll) async {
    _setLoading(true);
    _clearError();

    try {
      final updatedPayroll = await _repository.updatePayroll(id, payroll);
      final index = _payrolls.indexWhere((p) => p.id == id);
      if (index != -1) {
        _payrolls[index] = updatedPayroll;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('Failed to update payroll: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> deletePayroll(int id) async {
    _setLoading(true);
    _clearError();

    try {
      await _repository.deletePayroll(id);
      _payrolls.removeWhere((p) => p.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Failed to delete payroll: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> approvePayroll(int id) async {
    _setLoading(true);
    _clearError();

    try {
      final approvedPayroll = await _repository.approvePayroll(id);
      final index = _payrolls.indexWhere((p) => p.id == id);
      if (index != -1) {
        _payrolls[index] = approvedPayroll;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('Failed to approve payroll: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> processPayroll(int id) async {
    _setLoading(true);
    _clearError();

    try {
      final processedPayroll = await _repository.processPayroll(id);
      final index = _payrolls.indexWhere((p) => p.id == id);
      if (index != -1) {
        _payrolls[index] = processedPayroll;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('Failed to process payroll: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<String?> generatePayslip(int id) async {
    try {
      return await _repository.generatePayslip(id);
    } catch (e) {
      _setError('Failed to generate payslip: ${e.toString()}');
      return null;
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

  void setPeriodFilter(String? period) {
    _periodFilter = period;
    notifyListeners();
  }

  void clearFilters() {
    _statusFilter = null;
    _employeeFilter = null;
    _periodFilter = null;
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
