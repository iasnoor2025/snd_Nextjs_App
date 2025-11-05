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
  List<EmployeeModel> get filteredEmployees => _filteredEmployees;
  EmployeeModel? get selectedEmployee => _selectedEmployee;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get errorMessage => _error;
  bool get hasError => _error != null;
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
      print('🔄 Loading employees - Page: $_currentPage, Limit: 100');
      final newEmployees = await _employeeRepository.getEmployees(
        page: _currentPage,
        limit: 100, // Increased limit to load more employees per page
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
        status: _statusFilter,
        department: _departmentFilter,
      );

      print('✅ Loaded ${newEmployees.length} employees');
      if (newEmployees.isNotEmpty) {
        print('👤 First employee: ${newEmployees[0].displayName}');
      }

      if (refresh) {
        _employees = newEmployees;
      } else {
        _employees.addAll(newEmployees);
      }

      _hasMoreData = newEmployees.length == 100;
      _currentPage++;

      _applyFilters();
    } on ApiException catch (e) {
      print('❌ API Exception: ${e.message}');
      _setError(e.message);
    } catch (e) {
      print('❌ General Exception: ${e.toString()}');
      _setError('Failed to load employees: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Load more employees (pagination)
  Future<void> loadMoreEmployees() async {
    await loadEmployees();
  }

  // Load all employees at once
  Future<void> loadAllEmployees() async {
    _setLoading(true);
    _clearError();

    try {
      print('🔄 Loading ALL employees - Limit: 5000');
      // Load with a very high limit to get all employees
      final allEmployees = await _employeeRepository.getEmployees(
        page: 1,
        limit: 5000, // Very high limit to get all 350+ employees
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
        status: _statusFilter,
        department: _departmentFilter,
      );

      print('✅ Loaded ${allEmployees.length} employees total');
      if (allEmployees.isNotEmpty) {
        print('👤 First employee: ${allEmployees[0].displayName}');
        print('👤 Last employee: ${allEmployees.last.displayName}');
      }

      _employees = allEmployees;
      _hasMoreData = false; // No more data to load
      _currentPage = 1;

      _applyFilters();
    } on ApiException catch (e) {
      print('❌ API Exception in loadAllEmployees: ${e.message}');
      _setError(e.message);
    } catch (e) {
      print('❌ General Exception in loadAllEmployees: ${e.toString()}');
      _setError('Failed to load employees: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
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
    
    // Since we're using loadAllEmployees, just apply filters to existing data
    // The search will work on the already loaded employees
    print('🔍 Searching for: "$query" in ${_employees.length} employees');
  }

  // Filter employees by status
  void filterByStatus(String? status) {
    _statusFilter = status;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Since we're using loadAllEmployees, just apply filters to existing data
    print('🔍 Filtering by status: "$status"');
  }

  // Filter employees by department
  void filterByDepartment(String? department) {
    _departmentFilter = department;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Since we're using loadAllEmployees, just apply filters to existing data
    print('🔍 Filtering by department: "$department"');
  }

  // Clear all filters
  void clearFilters() {
    _searchQuery = '';
    _statusFilter = null;
    _departmentFilter = null;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Since we're using loadAllEmployees, just apply filters to existing data
    print('🔍 Clearing all filters');
  }

  // Set status filter
  void setStatusFilter(String? status) {
    _statusFilter = status;
    _applyFilters();
    notifyListeners();
  }

  // Set department filter
  void setDepartmentFilter(String? department) {
    _departmentFilter = department;
    _applyFilters();
    notifyListeners();
  }

  // Apply filters to employees list
  void _applyFilters() {
    _filteredEmployees = List.from(_employees);

    // Apply search filter
    if (_searchQuery.isNotEmpty) {
      _filteredEmployees = _filteredEmployees.where((employee) {
        final fullName = employee.fullName.toLowerCase();
        final email = employee.email?.toLowerCase() ?? '';
        final employeeId = employee.employeeId.toString() ?? '';
        final fileNumber = employee.fileNumber.toString() ?? '';
        final department = employee.department?.toLowerCase() ?? '';
        final designation = employee.designation?.toLowerCase() ?? '';
        final query = _searchQuery.toLowerCase();
        
        return fullName.contains(query) || 
               email.contains(query) ||
               employeeId.contains(query) ||
               fileNumber.contains(query) ||
               department.contains(query) ||
               designation.contains(query);
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
