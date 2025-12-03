import 'package:flutter/foundation.dart';
import '../../data/models/user_profile_model.dart';
import '../../data/repositories/user_profile_repository_impl.dart';

class UserProfileProvider extends ChangeNotifier {
  final UserProfileRepositoryImpl _repository = UserProfileRepositoryImpl();

  UserProfileModel? _userProfile;
  Map<String, dynamic>? _employeeData;
  Map<String, dynamic>? _sessionData;
  bool _isLoading = false;
  String? _error;

  // Getters
  UserProfileModel? get userProfile => _userProfile;
  Map<String, dynamic>? get employeeData => _employeeData;
  Map<String, dynamic>? get sessionData => _sessionData;
  bool get isLoading => _isLoading;
  String? get error => _error;

  bool get hasData => _userProfile != null;
  bool get hasEmployeeData => _employeeData != null;
  bool get hasError => _error != null;

  /// Load complete user profile data (user + employee)
  Future<void> loadUserProfile() async {
    _setLoading(true);
    _clearError();

    try {
      if (kDebugMode) {
        print('🔄 Loading user profile...');
      }

      // Fetch user profile data (now includes employee data)
      _userProfile = await _repository.getCurrentUserProfile();
      
      // Extract employee data from user profile
      if (_userProfile?.employee != null) {
        _employeeData = _userProfile!.employee;
        if (kDebugMode) {
          print('✅ Employee data loaded from user profile');
        }
      } else {
        // Fallback: Try to fetch employee data separately if not included in user profile
        if (_userProfile != null) {
          try {
            _employeeData = await _repository.getEmployeeData(_userProfile!.id);
            if (kDebugMode) {
              print('✅ Employee data loaded from separate API call');
            }
          } catch (e) {
            if (kDebugMode) {
              print('⚠️ Could not fetch employee data: $e');
            }
            // Don't set error for missing employee data, just continue
          }
        }
      }

      // Fetch session data
      try {
        _sessionData = await _repository.getSessionData();
      } catch (e) {
        if (kDebugMode) {
          print('⚠️ Could not fetch session data: $e');
        }
        // Don't set error for missing session data, just continue
      }

      if (kDebugMode) {
        print('✅ User profile loaded successfully');
        print('   - User: ${_userProfile?.email}');
        print('   - Role: ${_userProfile?.role}');
        print('   - Has Employee Data: ${_employeeData != null}');
        print('   - Has Session Data: ${_sessionData != null}');
      }

      notifyListeners();
    } catch (e) {
      _setError(e.toString());
      if (kDebugMode) {
        print('❌ Error loading user profile: $e');
      }
    } finally {
      _setLoading(false);
    }
  }

  /// Refresh user profile data
  Future<void> refreshProfile() async {
    await loadUserProfile();
  }

  /// Clear all data
  void clearData() {
    _userProfile = null;
    _employeeData = null;
    _sessionData = null;
    _clearError();
    notifyListeners();
  }

  /// Get employee field value safely
  String? getEmployeeField(String fieldName) {
    if (_employeeData == null) return null;
    final value = _employeeData![fieldName];
    if (value == null) return null;
    return value.toString();
  }

  /// Get employee department name
  String? get employeeDepartment {
    if (_employeeData == null) return null;
    final dept = _employeeData!['department'];
    if (dept is Map<String, dynamic>) {
      return dept['name']?.toString();
    }
    return dept?.toString();
  }

  /// Get employee designation name
  String? get employeeDesignation {
    if (_employeeData == null) return null;
    final desig = _employeeData!['designation'];
    if (desig is Map<String, dynamic>) {
      return desig['name']?.toString();
    }
    return desig?.toString();
  }

  /// Get employee full name
  String? get employeeFullName {
    if (_employeeData == null) return null;
    return _employeeData!['full_name']?.toString();
  }

  /// Get employee hire date
  String? get employeeHireDate {
    if (_employeeData == null) return null;
    return _employeeData!['hire_date']?.toString();
  }

  /// Get employee status
  String? get employeeStatus {
    if (_employeeData == null) return null;
    return _employeeData!['status']?.toString();
  }

  /// Get employee phone
  String? get employeePhone {
    if (_employeeData == null) return null;
    return _employeeData!['phone']?.toString();
  }

  /// Get employee nationality
  String? get employeeNationality {
    if (_employeeData == null) return null;
    return _employeeData!['nationality']?.toString();
  }

  /// Get employee basic salary
  String? get employeeBasicSalary {
    if (_employeeData == null) return null;
    final salary = _employeeData!['basic_salary'];
    if (salary == null) return null;
    return salary.toString();
  }

  /// Get employee current location
  String? get employeeCurrentLocation {
    if (_employeeData == null) return null;
    return _employeeData!['current_location']?.toString();
  }

  /// Get employee address
  String? get employeeAddress {
    if (_employeeData == null) return null;
    return _employeeData!['address']?.toString();
  }

  /// Get employee emergency contact
  String? get employeeEmergencyContact {
    if (_employeeData == null) return null;
    final name = _employeeData!['emergency_contact_name']?.toString();
    final phone = _employeeData!['emergency_contact_phone']?.toString();
    if (name != null && phone != null) {
      return '$name - $phone';
    }
    return name ?? phone;
  }

  /// Get employee Iqama number
  String? get employeeIqamaNumber {
    if (_employeeData == null) return null;
    return _employeeData!['iqama_number']?.toString();
  }

  /// Get employee Iqama expiry
  String? get employeeIqamaExpiry {
    if (_employeeData == null) return null;
    return _employeeData!['iqama_expiry']?.toString();
  }

  /// Get employee supervisor
  String? get employeeSupervisor {
    if (_employeeData == null) return null;
    final supervisor = _employeeData!['supervisor_details'];
    if (supervisor is Map<String, dynamic>) {
      return supervisor['name']?.toString();
    }
    return supervisor?.toString();
  }

  // Private methods
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
}
