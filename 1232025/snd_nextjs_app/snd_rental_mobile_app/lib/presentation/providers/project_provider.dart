import 'package:flutter/foundation.dart';
import '../../domain/repositories/project_repository.dart';
import '../../data/repositories/project_repository_impl.dart';
import '../../data/models/project_model.dart';
import '../../core/errors/api_exception.dart';

class ProjectProvider extends ChangeNotifier {
  final ProjectRepository _projectRepository = ProjectRepositoryImpl();

  List<ProjectModel> _projects = [];
  List<ProjectModel> _filteredProjects = [];
  ProjectModel? _selectedProject;
  bool _isLoading = false;
  String? _error;
  String _searchQuery = '';
  String? _statusFilter;
  String? _priorityFilter;
  String? _clientFilter;
  int _currentPage = 1;
  bool _hasMoreData = true;

  // Getters
  List<ProjectModel> get projects => _filteredProjects;
  ProjectModel? get selectedProject => _selectedProject;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get searchQuery => _searchQuery;
  String? get statusFilter => _statusFilter;
  String? get priorityFilter => _priorityFilter;
  String? get clientFilter => _clientFilter;
  bool get hasMoreData => _hasMoreData;

  // Load projects
  Future<void> loadProjects({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _hasMoreData = true;
      _projects.clear();
      _filteredProjects.clear();
    }

    if (_isLoading || !_hasMoreData) return;

    _setLoading(true);
    _clearError();

    try {
      final newProjects = await _projectRepository.getProjects(
        page: _currentPage,
        limit: 20,
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
        status: _statusFilter,
        priority: _priorityFilter,
        clientName: _clientFilter,
      );

      if (refresh) {
        _projects = newProjects;
      } else {
        _projects.addAll(newProjects);
      }

      _hasMoreData = newProjects.length == 20;
      _currentPage++;

      _applyFilters();
    } on ApiException catch (e) {
      _setError(e.message);
    } catch (e) {
      _setError('Failed to load projects: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Load more projects (pagination)
  Future<void> loadMoreProjects() async {
    await loadProjects();
  }

  // Refresh projects
  Future<void> refreshProjects() async {
    await loadProjects(refresh: true);
  }

  // Get project by ID
  Future<void> getProjectById(String id) async {
    _setLoading(true);
    _clearError();

    try {
      _selectedProject = await _projectRepository.getProjectById(id);
      if (_selectedProject == null) {
        _setError('Project not found');
      }
    } on ApiException catch (e) {
      _setError(e.message);
    } catch (e) {
      _setError('Failed to load project: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Create project
  Future<bool> createProject(ProjectModel project) async {
    _setLoading(true);
    _clearError();

    try {
      final newProject = await _projectRepository.createProject(project);
      _projects.insert(0, newProject);
      _applyFilters();
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to create project: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update project
  Future<bool> updateProject(String id, ProjectModel project) async {
    _setLoading(true);
    _clearError();

    try {
      final updatedProject = await _projectRepository.updateProject(id, project);
      
      // Update in local list
      final index = _projects.indexWhere((p) => p.id == id);
      if (index != -1) {
        _projects[index] = updatedProject;
        _applyFilters();
      }

      // Update selected project if it's the same
      if (_selectedProject?.id == id) {
        _selectedProject = updatedProject;
      }

      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to update project: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Delete project
  Future<bool> deleteProject(String id) async {
    _setLoading(true);
    _clearError();

    try {
      await _projectRepository.deleteProject(id);
      
      // Remove from local list
      _projects.removeWhere((p) => p.id == id);
      _applyFilters();

      // Clear selected project if it's the same
      if (_selectedProject?.id == id) {
        _selectedProject = null;
      }

      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to delete project: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update project status
  Future<bool> updateProjectStatus(String id, String status) async {
    _setLoading(true);
    _clearError();

    try {
      await _projectRepository.updateProjectStatus(id, status);
      
      // Update in local list
      final index = _projects.indexWhere((p) => p.id == id);
      if (index != -1) {
        _projects[index] = _projects[index].copyWith(status: status);
        _applyFilters();
      }

      // Update selected project if it's the same
      if (_selectedProject?.id == id) {
        _selectedProject = _selectedProject!.copyWith(status: status);
      }

      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _setError(e.message);
      return false;
    } catch (e) {
      _setError('Failed to update project status: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Search projects
  void searchProjects(String query) {
    _searchQuery = query;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data with search query
    loadProjects(refresh: true);
  }

  // Filter projects by status
  void filterByStatus(String? status) {
    _statusFilter = status;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data with status filter
    loadProjects(refresh: true);
  }

  // Filter projects by priority
  void filterByPriority(String? priority) {
    _priorityFilter = priority;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data with priority filter
    loadProjects(refresh: true);
  }

  // Filter projects by client
  void filterByClient(String? client) {
    _clientFilter = client;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data with client filter
    loadProjects(refresh: true);
  }

  // Clear all filters
  void clearFilters() {
    _searchQuery = '';
    _statusFilter = null;
    _priorityFilter = null;
    _clientFilter = null;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data without filters
    loadProjects(refresh: true);
  }

  // Apply filters to projects list
  void _applyFilters() {
    _filteredProjects = List.from(_projects);

    // Apply search filter
    if (_searchQuery.isNotEmpty) {
      _filteredProjects = _filteredProjects.where((project) {
        final name = project.name.toLowerCase();
        final client = (project.clientName ?? '').toLowerCase();
        final query = _searchQuery.toLowerCase();
        return name.contains(query) || client.contains(query);
      }).toList();
    }

    // Apply status filter
    if (_statusFilter != null) {
      _filteredProjects = _filteredProjects.where((project) {
        return project.status == _statusFilter;
      }).toList();
    }

    // Apply priority filter
    if (_priorityFilter != null) {
      _filteredProjects = _filteredProjects.where((project) {
        return project.priority == _priorityFilter;
      }).toList();
    }

    // Apply client filter
    if (_clientFilter != null) {
      _filteredProjects = _filteredProjects.where((project) {
        return project.clientName == _clientFilter;
      }).toList();
    }

    notifyListeners();
  }

  // Get project statistics
  Map<String, int> getProjectStats() {
    final total = _projects.length;
    final active = _projects.where((p) => p.isActive).length;
    final completed = _projects.where((p) => p.isCompleted).length;
    final cancelled = _projects.where((p) => p.isCancelled).length;
    
    return {
      'total': total,
      'active': active,
      'completed': completed,
      'cancelled': cancelled,
    };
  }

  // Get clients list
  List<String> getClients() {
    return _projects
        .map((p) => p.clientName)
        .where((client) => client != null && client.isNotEmpty)
        .cast<String>()
        .toSet()
        .toList()
      ..sort();
  }

  // Get project budget summary
  double getTotalBudget() {
    return _projects
        .where((p) => p.budget != null)
        .fold(0.0, (sum, project) => sum + (project.budget ?? 0));
  }

  // Get project actual cost
  double getTotalActualCost() {
    return _projects
        .where((p) => p.actualCost != null)
        .fold(0.0, (sum, project) => sum + (project.actualCost ?? 0));
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
    _projects.clear();
    _filteredProjects.clear();
    _selectedProject = null;
    _searchQuery = '';
    _statusFilter = null;
    _priorityFilter = null;
    _clientFilter = null;
    _currentPage = 1;
    _hasMoreData = true;
    _error = null;
    notifyListeners();
  }
}
