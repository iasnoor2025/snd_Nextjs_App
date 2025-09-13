import 'package:flutter/foundation.dart';
import '../../domain/repositories/equipment_repository.dart';
import '../../data/repositories/equipment_repository_impl.dart';
import '../../data/models/equipment_model.dart';
import '../../core/errors/api_exception.dart';

class EquipmentProvider extends ChangeNotifier {
  final EquipmentRepository _equipmentRepository = EquipmentRepositoryImpl();

  List<EquipmentModel> _equipment = [];
  List<EquipmentModel> _filteredEquipment = [];
  EquipmentModel? _selectedEquipment;
  bool _isLoading = false;
  String? _error;
  String _searchQuery = '';
  String? _statusFilter;
  String? _categoryFilter;
  String? _locationFilter;
  int _currentPage = 1;
  bool _hasMoreData = true;

  // Getters
  List<EquipmentModel> get equipment => _filteredEquipment;
  EquipmentModel? get selectedEquipment => _selectedEquipment;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get searchQuery => _searchQuery;
  String? get statusFilter => _statusFilter;
  String? get categoryFilter => _categoryFilter;
  String? get locationFilter => _locationFilter;
  bool get hasMoreData => _hasMoreData;

  // Load equipment
  Future<void> loadEquipment({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _hasMoreData = true;
      _equipment.clear();
      _filteredEquipment.clear();
    }

    if (_isLoading || !_hasMoreData) return;

    _setLoading(true);
    _clearError();

    try {
      final newEquipment = await _equipmentRepository.getEquipment(
        page: _currentPage,
        limit: 20,
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
        status: _statusFilter,
        category: _categoryFilter,
        location: _locationFilter,
      );

      if (refresh) {
        _equipment = newEquipment;
      } else {
        _equipment.addAll(newEquipment);
      }

      _hasMoreData = newEquipment.length == 20;
      _currentPage++;

      _applyFilters();
    } on ApiException catch (e) {
      _setError(e.message);
    } catch (e) {
      _setError('Failed to load equipment: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Load more equipment (pagination)
  Future<void> loadMoreEquipment() async {
    await loadEquipment();
  }

  // Refresh equipment
  Future<void> refreshEquipment() async {
    await loadEquipment(refresh: true);
  }

  // Get equipment by ID
  Future<void> getEquipmentById(String id) async {
    _setLoading(true);
    _clearError();

    try {
      _selectedEquipment = await _equipmentRepository.getEquipmentById(id);
      if (_selectedEquipment == null) {
        _setError('Equipment not found');
      }
    } on ApiException catch (e) {
      _setError(e.message);
    } catch (e) {
      _setError('Failed to load equipment: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Create equipment
  Future<bool> createEquipment(EquipmentModel equipment) async {
    _setLoading(true);
    _clearError();

    try {
      final newEquipment = await _equipmentRepository.createEquipment(equipment);
      _equipment.insert(0, newEquipment);
      _applyFilters();
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to create equipment: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update equipment
  Future<bool> updateEquipment(String id, EquipmentModel equipment) async {
    _setLoading(true);
    _clearError();

    try {
      final updatedEquipment = await _equipmentRepository.updateEquipment(id, equipment);
      
      // Update in local list
      final index = _equipment.indexWhere((e) => e.id == id);
      if (index != -1) {
        _equipment[index] = updatedEquipment;
        _applyFilters();
      }

      // Update selected equipment if it's the same
      if (_selectedEquipment?.id == id) {
        _selectedEquipment = updatedEquipment;
      }

      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to update equipment: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Delete equipment
  Future<bool> deleteEquipment(String id) async {
    _setLoading(true);
    _clearError();

    try {
      await _equipmentRepository.deleteEquipment(id);
      
      // Remove from local list
      _equipment.removeWhere((e) => e.id == id);
      _applyFilters();

      // Clear selected equipment if it's the same
      if (_selectedEquipment?.id == id) {
        _selectedEquipment = null;
      }

      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to delete equipment: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update equipment status
  Future<bool> updateEquipmentStatus(String id, String status) async {
    _setLoading(true);
    _clearError();

    try {
      await _equipmentRepository.updateEquipmentStatus(id, status);
      
      // Update in local list
      final index = _equipment.indexWhere((e) => e.id == id);
      if (index != -1) {
        _equipment[index] = _equipment[index].copyWith(status: status);
        _applyFilters();
      }

      // Update selected equipment if it's the same
      if (_selectedEquipment?.id == id) {
        _selectedEquipment = _selectedEquipment!.copyWith(status: status);
      }

      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to update equipment status: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Search equipment
  void searchEquipment(String query) {
    _searchQuery = query;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data with search query
    loadEquipment(refresh: true);
  }

  // Filter equipment by status
  void filterByStatus(String? status) {
    _statusFilter = status;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data with status filter
    loadEquipment(refresh: true);
  }

  // Filter equipment by category
  void filterByCategory(String? category) {
    _categoryFilter = category;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data with category filter
    loadEquipment(refresh: true);
  }

  // Filter equipment by location
  void filterByLocation(String? location) {
    _locationFilter = location;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data with location filter
    loadEquipment(refresh: true);
  }

  // Clear all filters
  void clearFilters() {
    _searchQuery = '';
    _statusFilter = null;
    _categoryFilter = null;
    _locationFilter = null;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data without filters
    loadEquipment(refresh: true);
  }

  // Apply filters to equipment list
  void _applyFilters() {
    _filteredEquipment = List.from(_equipment);

    // Apply search filter
    if (_searchQuery.isNotEmpty) {
      _filteredEquipment = _filteredEquipment.where((equipment) {
        final name = equipment.name.toLowerCase();
        final model = (equipment.model ?? '').toLowerCase();
        final serialNumber = (equipment.serialNumber ?? '').toLowerCase();
        final query = _searchQuery.toLowerCase();
        return name.contains(query) || 
               model.contains(query) || 
               serialNumber.contains(query);
      }).toList();
    }

    // Apply status filter
    if (_statusFilter != null) {
      _filteredEquipment = _filteredEquipment.where((equipment) {
        return equipment.status == _statusFilter;
      }).toList();
    }

    // Apply category filter
    if (_categoryFilter != null) {
      _filteredEquipment = _filteredEquipment.where((equipment) {
        return equipment.category == _categoryFilter;
      }).toList();
    }

    // Apply location filter
    if (_locationFilter != null) {
      _filteredEquipment = _filteredEquipment.where((equipment) {
        return equipment.location == _locationFilter;
      }).toList();
    }

    notifyListeners();
  }

  // Get equipment statistics
  Map<String, int> getEquipmentStats() {
    final total = _equipment.length;
    final available = _equipment.where((e) => e.isAvailable).length;
    final inUse = _equipment.where((e) => e.isInUse).length;
    final maintenance = _equipment.where((e) => e.isMaintenance).length;
    final retired = _equipment.where((e) => e.isRetired).length;
    
    return {
      'total': total,
      'available': available,
      'inUse': inUse,
      'maintenance': maintenance,
      'retired': retired,
    };
  }

  // Get categories list
  List<String> getCategories() {
    return _equipment
        .map((e) => e.category)
        .where((category) => category != null && category.isNotEmpty)
        .cast<String>()
        .toSet()
        .toList()
      ..sort();
  }

  // Get locations list
  List<String> getLocations() {
    return _equipment
        .map((e) => e.location)
        .where((location) => location != null && location.isNotEmpty)
        .cast<String>()
        .toSet()
        .toList()
      ..sort();
  }

  // Get maintenance due equipment
  Future<void> loadMaintenanceDueEquipment() async {
    _setLoading(true);
    _clearError();

    try {
      final maintenanceDueEquipment = await _equipmentRepository.getMaintenanceDueEquipment();
      _equipment = maintenanceDueEquipment;
      _applyFilters();
    } on ApiException catch (e) {
      _setError(e.message);
    } catch (e) {
      _setError('Failed to load maintenance due equipment: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
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
    _equipment.clear();
    _filteredEquipment.clear();
    _selectedEquipment = null;
    _searchQuery = '';
    _statusFilter = null;
    _categoryFilter = null;
    _locationFilter = null;
    _currentPage = 1;
    _hasMoreData = true;
    _error = null;
    notifyListeners();
  }
}
