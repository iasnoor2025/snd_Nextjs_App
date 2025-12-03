import 'package:flutter/foundation.dart';
import '../../data/models/safety_incident_model.dart';
import '../../data/repositories/safety_incident_repository_impl.dart';

class SafetyIncidentProvider extends ChangeNotifier {
  final SafetyIncidentRepositoryImpl _repository = SafetyIncidentRepositoryImpl();
  
  List<SafetyIncidentModel> _incidents = [];
  bool _isLoading = false;
  String? _errorMessage;
  int _currentPage = 1;
  bool _hasMore = true;
  String? _statusFilter;
  String? _severityFilter;
  int? _employeeFilter;

  // Getters
  List<SafetyIncidentModel> get incidents => _incidents;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get hasMore => _hasMore;
  String? get statusFilter => _statusFilter;
  String? get severityFilter => _severityFilter;
  int? get employeeFilter => _employeeFilter;

  List<SafetyIncidentModel> get filteredIncidents {
    if (_statusFilter == null && _severityFilter == null && _employeeFilter == null) {
      return _incidents;
    }
    
    return _incidents.where((incident) {
      bool matches = true;
      
      if (_statusFilter != null && incident.status != _statusFilter) {
        matches = false;
      }
      
      if (_severityFilter != null && incident.severity != _severityFilter) {
        matches = false;
      }
      
      if (_employeeFilter != null && incident.employeeId != _employeeFilter) {
        matches = false;
      }
      
      return matches;
    }).toList();
  }

  Map<String, int> getIncidentStats() {
    final stats = <String, int>{
      'total': _incidents.length,
      'open': _incidents.where((i) => i.status == 'open').length,
      'investigating': _incidents.where((i) => i.status == 'investigating').length,
      'resolved': _incidents.where((i) => i.status == 'resolved').length,
      'closed': _incidents.where((i) => i.status == 'closed').length,
      'low': _incidents.where((i) => i.severity == 'low').length,
      'medium': _incidents.where((i) => i.severity == 'medium').length,
      'high': _incidents.where((i) => i.severity == 'high').length,
      'critical': _incidents.where((i) => i.severity == 'critical').length,
    };
    return stats;
  }

  Future<void> loadIncidents({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
      _incidents.clear();
    }

    if (!_hasMore || _isLoading) return;

    _setLoading(true);
    _clearError();

    try {
      final newIncidents = await _repository.getSafetyIncidents(
        page: _currentPage,
        status: _statusFilter,
        severity: _severityFilter,
        employeeId: _employeeFilter,
      );

      if (newIncidents.isEmpty) {
        _hasMore = false;
      } else {
        if (refresh) {
          _incidents = newIncidents;
        } else {
          _incidents.addAll(newIncidents);
        }
        _currentPage++;
      }
    } catch (e) {
      _setError('Failed to load incidents: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadMoreIncidents() async {
    await loadIncidents();
  }

  Future<void> refreshIncidents() async {
    await loadIncidents(refresh: true);
  }

  Future<SafetyIncidentModel?> getIncidentById(int id) async {
    try {
      return await _repository.getSafetyIncidentById(id);
    } catch (e) {
      _setError('Failed to load incident: ${e.toString()}');
      return null;
    }
  }

  Future<bool> createIncident(SafetyIncidentModel incident) async {
    _setLoading(true);
    _clearError();

    try {
      final newIncident = await _repository.createSafetyIncident(incident);
      _incidents.insert(0, newIncident);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Failed to create incident: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> updateIncident(int id, SafetyIncidentModel incident) async {
    _setLoading(true);
    _clearError();

    try {
      final updatedIncident = await _repository.updateSafetyIncident(id, incident);
      final index = _incidents.indexWhere((i) => i.id == id);
      if (index != -1) {
        _incidents[index] = updatedIncident;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('Failed to update incident: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> deleteIncident(int id) async {
    _setLoading(true);
    _clearError();

    try {
      await _repository.deleteSafetyIncident(id);
      _incidents.removeWhere((i) => i.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Failed to delete incident: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> assignIncident(int id, String assignedTo) async {
    _setLoading(true);
    _clearError();

    try {
      final assignedIncident = await _repository.assignIncident(id, assignedTo);
      final index = _incidents.indexWhere((i) => i.id == id);
      if (index != -1) {
        _incidents[index] = assignedIncident;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('Failed to assign incident: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> resolveIncident(int id, String resolution) async {
    _setLoading(true);
    _clearError();

    try {
      final resolvedIncident = await _repository.resolveIncident(id, resolution);
      final index = _incidents.indexWhere((i) => i.id == id);
      if (index != -1) {
        _incidents[index] = resolvedIncident;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('Failed to resolve incident: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<List<SafetyIncidentModel>> getEmployeeIncidents(int employeeId) async {
    try {
      return await _repository.getIncidentsByEmployee(employeeId);
    } catch (e) {
      _setError('Failed to load employee incidents: ${e.toString()}');
      return [];
    }
  }

  Future<Map<String, dynamic>> fetchIncidentStats() async {
    try {
      return await _repository.getIncidentStats();
    } catch (e) {
      _setError('Failed to load incident stats: ${e.toString()}');
      return {};
    }
  }

  void setStatusFilter(String? status) {
    _statusFilter = status;
    notifyListeners();
  }

  void setSeverityFilter(String? severity) {
    _severityFilter = severity;
    notifyListeners();
  }

  void setEmployeeFilter(int? employeeId) {
    _employeeFilter = employeeId;
    notifyListeners();
  }

  void clearFilters() {
    _statusFilter = null;
    _severityFilter = null;
    _employeeFilter = null;
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
