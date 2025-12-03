import 'package:flutter/foundation.dart';
import '../../domain/repositories/rental_repository.dart';
import '../../data/repositories/rental_repository_impl.dart';
import '../../data/models/rental_model.dart';
import '../../core/errors/api_exception.dart';

class RentalProvider extends ChangeNotifier {
  final RentalRepository _rentalRepository = RentalRepositoryImpl();

  List<RentalModel> _rentals = [];
  List<RentalModel> _filteredRentals = [];
  RentalModel? _selectedRental;
  bool _isLoading = false;
  String? _error;
  String _searchQuery = '';
  String? _statusFilter;
  String? _customerFilter;
  String? _projectFilter;
  int _currentPage = 1;
  bool _hasMoreData = true;

  // Getters
  List<RentalModel> get rentals => _filteredRentals;
  RentalModel? get selectedRental => _selectedRental;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get searchQuery => _searchQuery;
  String? get statusFilter => _statusFilter;
  String? get customerFilter => _customerFilter;
  String? get projectFilter => _projectFilter;
  bool get hasMoreData => _hasMoreData;

  // Load rentals
  Future<void> loadRentals({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _hasMoreData = true;
      _rentals.clear();
      _filteredRentals.clear();
    }

    if (_isLoading || !_hasMoreData) return;

    _setLoading(true);
    _clearError();

    try {
      final newRentals = await _rentalRepository.getRentals(
        page: _currentPage,
        limit: 20,
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
        status: _statusFilter,
        customerId: _customerFilter,
        projectId: _projectFilter,
      );

      if (refresh) {
        _rentals = newRentals;
      } else {
        _rentals.addAll(newRentals);
      }

      _hasMoreData = newRentals.length == 20;
      _currentPage++;

      _applyFilters();
    } on ApiException catch (e) {
      _setError(e.message);
    } catch (e) {
      _setError('Failed to load rentals: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Load more rentals (pagination)
  Future<void> loadMoreRentals() async {
    await loadRentals();
  }

  // Refresh rentals
  Future<void> refreshRentals() async {
    await loadRentals(refresh: true);
  }

  // Get rental by ID
  Future<void> getRentalById(String id) async {
    _setLoading(true);
    _clearError();

    try {
      _selectedRental = await _rentalRepository.getRentalById(id);
      if (_selectedRental == null) {
        _setError('Rental not found');
      }
    } on ApiException catch (e) {
      _setError(e.message);
    } catch (e) {
      _setError('Failed to load rental: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Create rental
  Future<bool> createRental(RentalModel rental) async {
    _setLoading(true);
    _clearError();

    try {
      final newRental = await _rentalRepository.createRental(rental);
      _rentals.insert(0, newRental);
      _applyFilters();
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to create rental: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update rental
  Future<bool> updateRental(String id, RentalModel rental) async {
    _setLoading(true);
    _clearError();

    try {
      final updatedRental = await _rentalRepository.updateRental(id, rental);
      
      // Update in local list
      final index = _rentals.indexWhere((r) => r.id == id);
      if (index != -1) {
        _rentals[index] = updatedRental;
        _applyFilters();
      }

      // Update selected rental if it's the same
      if (_selectedRental?.id == id) {
        _selectedRental = updatedRental;
      }

      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to update rental: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Delete rental
  Future<bool> deleteRental(String id) async {
    _setLoading(true);
    _clearError();

    try {
      await _rentalRepository.deleteRental(id);
      
      // Remove from local list
      _rentals.removeWhere((r) => r.id == id);
      _applyFilters();

      // Clear selected rental if it's the same
      if (_selectedRental?.id == id) {
        _selectedRental = null;
      }

      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to delete rental: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update rental status
  Future<bool> updateRentalStatus(String id, String status) async {
    _setLoading(true);
    _clearError();

    try {
      await _rentalRepository.updateRentalStatus(id, status);
      
      // Update in local list
      final index = _rentals.indexWhere((r) => r.id == id);
      if (index != -1) {
        _rentals[index] = _rentals[index].copyWith(status: status);
        _applyFilters();
      }

      // Update selected rental if it's the same
      if (_selectedRental?.id == id) {
        _selectedRental = _selectedRental!.copyWith(status: status);
      }

      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to update rental status: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Approve rental
  Future<bool> approveRental(String id) async {
    _setLoading(true);
    _clearError();

    try {
      await _rentalRepository.approveRental(id);
      await updateRentalStatus(id, 'approved');
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to approve rental: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Activate rental
  Future<bool> activateRental(String id) async {
    _setLoading(true);
    _clearError();

    try {
      await _rentalRepository.activateRental(id);
      await updateRentalStatus(id, 'active');
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to activate rental: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Complete rental
  Future<bool> completeRental(String id) async {
    _setLoading(true);
    _clearError();

    try {
      await _rentalRepository.completeRental(id);
      await updateRentalStatus(id, 'completed');
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to complete rental: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Cancel rental
  Future<bool> cancelRental(String id) async {
    _setLoading(true);
    _clearError();

    try {
      await _rentalRepository.cancelRental(id);
      await updateRentalStatus(id, 'cancelled');
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to cancel rental: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Search rentals
  void searchRentals(String query) {
    _searchQuery = query;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data with search query
    loadRentals(refresh: true);
  }

  // Filter rentals by status
  void filterByStatus(String? status) {
    _statusFilter = status;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data with status filter
    loadRentals(refresh: true);
  }

  // Filter rentals by customer
  void filterByCustomer(String? customer) {
    _customerFilter = customer;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data with customer filter
    loadRentals(refresh: true);
  }

  // Filter rentals by project
  void filterByProject(String? project) {
    _projectFilter = project;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data with project filter
    loadRentals(refresh: true);
  }

  // Clear all filters
  void clearFilters() {
    _searchQuery = '';
    _statusFilter = null;
    _customerFilter = null;
    _projectFilter = null;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data without filters
    loadRentals(refresh: true);
  }

  // Apply filters to rentals list
  void _applyFilters() {
    _filteredRentals = List.from(_rentals);

    // Apply search filter
    if (_searchQuery.isNotEmpty) {
      _filteredRentals = _filteredRentals.where((rental) {
        final rentalNumber = rental.rentalNumber.toLowerCase();
        final customerName = rental.customerName.toLowerCase();
        final query = _searchQuery.toLowerCase();
        return rentalNumber.contains(query) || customerName.contains(query);
      }).toList();
    }

    // Apply status filter
    if (_statusFilter != null) {
      _filteredRentals = _filteredRentals.where((rental) {
        return rental.status == _statusFilter;
      }).toList();
    }

    // Apply customer filter
    if (_customerFilter != null) {
      _filteredRentals = _filteredRentals.where((rental) {
        return rental.customerId == _customerFilter;
      }).toList();
    }

    // Apply project filter
    if (_projectFilter != null) {
      _filteredRentals = _filteredRentals.where((rental) {
        return rental.projectId == _projectFilter;
      }).toList();
    }

    notifyListeners();
  }

  // Get rental statistics
  Map<String, int> getRentalStats() {
    final total = _rentals.length;
    final pending = _rentals.where((r) => r.isPending).length;
    final active = _rentals.where((r) => r.isActive).length;
    final completed = _rentals.where((r) => r.isCompleted).length;
    final cancelled = _rentals.where((r) => r.isCancelled).length;
    
    return {
      'total': total,
      'pending': pending,
      'active': active,
      'completed': completed,
      'cancelled': cancelled,
    };
  }

  // Get customers list
  List<String> getCustomers() {
    return _rentals
        .map((r) => r.customerName)
        .where((customer) => customer.isNotEmpty)
        .toSet()
        .toList()
      ..sort();
  }

  // Get projects list
  List<String> getProjects() {
    return _rentals
        .map((r) => r.projectName)
        .where((project) => project != null && project.isNotEmpty)
        .cast<String>()
        .toSet()
        .toList()
      ..sort();
  }

  // Get total revenue
  double getTotalRevenue() {
    return _rentals
        .where((r) => r.totalAmount != null)
        .fold(0.0, (sum, rental) => sum + (rental.totalAmount ?? 0));
  }

  // Get pending revenue
  double getPendingRevenue() {
    return _rentals
        .where((r) => r.balanceAmount != null && r.balanceAmount! > 0)
        .fold(0.0, (sum, rental) => sum + (rental.balanceAmount ?? 0));
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
    _rentals.clear();
    _filteredRentals.clear();
    _selectedRental = null;
    _searchQuery = '';
    _statusFilter = null;
    _customerFilter = null;
    _projectFilter = null;
    _currentPage = 1;
    _hasMoreData = true;
    _error = null;
    notifyListeners();
  }
}
