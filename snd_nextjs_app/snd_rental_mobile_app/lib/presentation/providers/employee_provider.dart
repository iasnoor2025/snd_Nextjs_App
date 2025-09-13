import 'package:flutter/foundation.dart';
import '../../domain/repositories/employee_repository.dart';
import '../../data/repositories/employee_repository_impl.dart';
import '../../data/models/employee_model.dart';
import '../../core/errors/api_exception.dart';

class EmployeeProvider extends ChangeNotifier {
  final EmployeeRepository _employeeRepository = EmployeeRepositoryImpl();

  List<EmployeeModel> _employees = [];
  List<EmployeeModel> _filteredEmployees = [];
  EmployeeModel? _selectedEmployee;
  bool _isLoading = false;
  String? _error;
  String _searchQuery = '';
  String? _statusFilter;
  String? _departmentFilter;
  int _currentPage = 1;
  bool _hasMoreData = true;

  // Getters
  List<EmployeeModel> get employees => _filteredEmployees;
  EmployeeModel? get selectedEmployee => _selectedEmployee;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get searchQuery => _searchQuery;
  String? get statusFilter => _statusFilter;
  String? get departmentFilter => _departmentFilter;
  bool get hasMoreData => _hasMoreData;

  // Load employees
  Future<void> loadEmployees({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _hasMoreData = true;
      _employees.clear();
      _filteredEmployees.clear();
    }

    if (_isLoading || !_hasMoreData) return;

    _setLoading(true);
    _clearError();

    try {
      final newEmployees = await _employeeRepository.getEmployees(
        page: _currentPage,
        limit: 20,
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
        status: _statusFilter,
        department: _departmentFilter,
      );

      if (refresh) {
        _employees = newEmployees;
      } else {
        _employees.addAll(newEmployees);
      }

      _hasMoreData = newEmployees.length == 20;
      _currentPage++;

      _applyFilters();
    } on ApiException catch (e) {
      _setError(e.message);
    } catch (e) {
      _setError('Failed to load employees: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Load more employees (pagination)
  Future<void> loadMoreEmployees() async {
    await loadEmployees();
  }

  // Refresh employees
  Future<void> refreshEmployees() async {
    await loadEmployees(refresh: true);
  }

  // Get employee by ID
  Future<void> getEmployeeById(String id) async {
    _setLoading(true);
    _clearError();

    try {
      _selectedEmployee = await _employeeRepository.getEmployeeById(id);
      if (_selectedEmployee == null) {
        _setError('Employee not found');
      }
    } on ApiException catch (e) {
      _setError(e.message);
    } catch (e) {
      _setError('Failed to load employee: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Create employee
  Future<bool> createEmployee(EmployeeModel employee) async {
    _setLoading(true);
    _clearError();

    try {
      final newEmployee = await _employeeRepository.createEmployee(employee);
      _employees.insert(0, newEmployee);
      _applyFilters();
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to create employee: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update employee
  Future<bool> updateEmployee(String id, EmployeeModel employee) async {
    _setLoading(true);
    _clearError();

    try {
      final updatedEmployee = await _employeeRepository.updateEmployee(id, employee);
      
      // Update in local list
      final index = _employees.indexWhere((e) => e.id == id);
      if (index != -1) {
        _employees[index] = updatedEmployee;
        _applyFilters();
      }

      // Update selected employee if it's the same
      if (_selectedEmployee?.id == id) {
        _selectedEmployee = updatedEmployee;
      }

      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to update employee: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Delete employee
  Future<bool> deleteEmployee(String id) async {
    _setLoading(true);
    _clearError();

    try {
      await _employeeRepository.deleteEmployee(id);
      
      // Remove from local list
      _employees.removeWhere((e) => e.id == id);
      _applyFilters();

      // Clear selected employee if it's the same
      if (_selectedEmployee?.id == id) {
        _selectedEmployee = null;
      }

      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to delete employee: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Search employees
  void searchEmployees(String query) {
    _searchQuery = query;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data with search query
    loadEmployees(refresh: true);
  }

  // Filter employees by status
  void filterByStatus(String? status) {
    _statusFilter = status;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data with status filter
    loadEmployees(refresh: true);
  }

  // Filter employees by department
  void filterByDepartment(String? department) {
    _departmentFilter = department;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data with department filter
    loadEmployees(refresh: true);
  }

  // Clear all filters
  void clearFilters() {
    _searchQuery = '';
    _statusFilter = null;
    _departmentFilter = null;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data without filters
    loadEmployees(refresh: true);
  }

  // Apply filters to employees list
  void _applyFilters() {
    _filteredEmployees = List.from(_employees);

    // Apply search filter
    if (_searchQuery.isNotEmpty) {
      _filteredEmployees = _filteredEmployees.where((employee) {
        final fullName = employee.fullName.toLowerCase();
        final email = employee.email.toLowerCase();
        final query = _searchQuery.toLowerCase();
        return fullName.contains(query) || email.contains(query);
      }).toList();
    }

    // Apply status filter
    if (_statusFilter != null) {
      _filteredEmployees = _filteredEmployees.where((employee) {
        return employee.status == _statusFilter;
      }).toList();
    }

    // Apply department filter
    if (_departmentFilter != null) {
      _filteredEmployees = _filteredEmployees.where((employee) {
        return employee.department == _departmentFilter;
      }).toList();
    }

    notifyListeners();
  }

  // Get employee statistics
  Map<String, int> getEmployeeStats() {
    final total = _employees.length;
    final active = _employees.where((e) => e.isActive).length;
    final terminated = _employees.where((e) => e.isTerminated).length;
    
    return {
      'total': total,
      'active': active,
      'terminated': terminated,
    };
  }

  // Get departments list
  List<String> getDepartments() {
    return _employees
        .map((e) => e.department)
        .where((dept) => dept != null && dept.isNotEmpty)
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
    _employees.clear();
    _filteredEmployees.clear();
    _selectedEmployee = null;
    _searchQuery = '';
    _statusFilter = null;
    _departmentFilter = null;
    _currentPage = 1;
    _hasMoreData = true;
    _error = null;
    notifyListeners();
  }
}
