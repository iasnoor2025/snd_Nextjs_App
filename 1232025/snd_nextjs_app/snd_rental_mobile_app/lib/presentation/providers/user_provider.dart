import 'package:flutter/foundation.dart';
import '../../data/models/user_model.dart';
import '../../data/repositories/user_repository_impl.dart';

class UserProvider extends ChangeNotifier {
  final UserRepositoryImpl _repository = UserRepositoryImpl();
  
  List<UserModel> _users = [];
  List<Map<String, dynamic>> _roles = [];
  List<Map<String, dynamic>> _permissions = [];
  bool _isLoading = false;
  String? _errorMessage;
  int _currentPage = 1;
  bool _hasMore = true;
  String? _statusFilter;
  String? _roleFilter;

  // Getters
  List<UserModel> get users => _users;
  List<Map<String, dynamic>> get roles => _roles;
  List<Map<String, dynamic>> get permissions => _permissions;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get hasMore => _hasMore;
  String? get statusFilter => _statusFilter;
  String? get roleFilter => _roleFilter;

  List<UserModel> get filteredUsers {
    if (_statusFilter == null && _roleFilter == null) {
      return _users;
    }
    
    return _users.where((user) {
      bool matches = true;
      
      if (_statusFilter != null && user.status != _statusFilter) {
        matches = false;
      }
      
      if (_roleFilter != null && user.role != _roleFilter) {
        matches = false;
      }
      
      return matches;
    }).toList();
  }

  Map<String, int> getUserStats() {
    final stats = <String, int>{
      'total': _users.length,
      'active': _users.where((u) => u.status == 'active').length,
      'inactive': _users.where((u) => u.status == 'inactive').length,
      'suspended': _users.where((u) => u.status == 'suspended').length,
    };
    return stats;
  }

  Future<void> loadUsers({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
      _users.clear();
    }

    if (!_hasMore || _isLoading) return;

    _setLoading(true);
    _clearError();

    try {
      final newUsers = await _repository.getUsers(
        page: _currentPage,
        status: _statusFilter,
        role: _roleFilter,
      );

      if (newUsers.isEmpty) {
        _hasMore = false;
      } else {
        if (refresh) {
          _users = newUsers;
        } else {
          _users.addAll(newUsers);
        }
        _currentPage++;
      }
    } catch (e) {
      _setError('Failed to load users: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadMoreUsers() async {
    await loadUsers();
  }

  Future<void> refreshUsers() async {
    await loadUsers(refresh: true);
  }

  Future<UserModel?> getUserById(int id) async {
    try {
      return await _repository.getUserById(id);
    } catch (e) {
      _setError('Failed to load user: ${e.toString()}');
      return null;
    }
  }

  Future<bool> createUser(UserModel user) async {
    _setLoading(true);
    _clearError();

    try {
      final newUser = await _repository.createUser(user);
      _users.insert(0, newUser);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Failed to create user: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> updateUser(int id, UserModel user) async {
    _setLoading(true);
    _clearError();

    try {
      final updatedUser = await _repository.updateUser(id, user);
      final index = _users.indexWhere((u) => u.id == id);
      if (index != -1) {
        _users[index] = updatedUser;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('Failed to update user: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> deleteUser(int id) async {
    _setLoading(true);
    _clearError();

    try {
      await _repository.deleteUser(id);
      _users.removeWhere((u) => u.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Failed to delete user: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadRoles() async {
    _setLoading(true);
    _clearError();

    try {
      _roles = await _repository.getRoles();
    } catch (e) {
      _setError('Failed to load roles: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> createRole(Map<String, dynamic> role) async {
    _setLoading(true);
    _clearError();

    try {
      final newRole = await _repository.createRole(role);
      _roles.add(newRole);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Failed to create role: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> updateRole(int id, Map<String, dynamic> role) async {
    _setLoading(true);
    _clearError();

    try {
      final updatedRole = await _repository.updateRole(id, role);
      final index = _roles.indexWhere((r) => r['id'] == id);
      if (index != -1) {
        _roles[index] = updatedRole;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('Failed to update role: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadPermissions() async {
    _setLoading(true);
    _clearError();

    try {
      _permissions = await _repository.getPermissions();
    } catch (e) {
      _setError('Failed to load permissions: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<List<Map<String, dynamic>>> getUserPermissions(int userId) async {
    try {
      return await _repository.getUserPermissions(userId);
    } catch (e) {
      _setError('Failed to load user permissions: ${e.toString()}');
      return [];
    }
  }

  Future<bool> assignPermissions(Map<String, dynamic> assignment) async {
    _setLoading(true);
    _clearError();

    try {
      await _repository.assignPermissions(assignment);
      return true;
    } catch (e) {
      _setError('Failed to assign permissions: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  void setStatusFilter(String? status) {
    _statusFilter = status;
    notifyListeners();
  }

  void setRoleFilter(String? role) {
    _roleFilter = role;
    notifyListeners();
  }

  void clearFilters() {
    _statusFilter = null;
    _roleFilter = null;
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
