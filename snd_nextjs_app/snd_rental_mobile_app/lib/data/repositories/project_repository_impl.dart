import '../../core/network/api_client.dart';
import '../../core/errors/api_exception.dart';
import '../../domain/repositories/project_repository.dart';
import '../models/project_model.dart';

class ProjectRepositoryImpl implements ProjectRepository {
  final ApiClient _apiClient = ApiClient();

  @override
  Future<List<ProjectModel>> getProjects({
    int page = 1,
    int limit = 20,
    String? search,
    String? status,
    String? priority,
    String? clientName,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };

      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }
      if (status != null && status.isNotEmpty) {
        queryParams['status'] = status;
      }
      if (priority != null && priority.isNotEmpty) {
        queryParams['priority'] = priority;
      }
      if (clientName != null && clientName.isNotEmpty) {
        queryParams['clientName'] = clientName;
      }

      final response = await _apiClient.get('/projects', queryParameters: queryParams);
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.map((json) => ProjectModel.fromJson(json)).toList();
      } else {
        throw ApiException(
          message: 'Failed to fetch projects',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<ProjectModel?> getProjectById(String id) async {
    try {
      final response = await _apiClient.get('/projects/$id');
      
      if (response.statusCode == 200) {
        return ProjectModel.fromJson(response.data);
      } else if (response.statusCode == 404) {
        return null;
      } else {
        throw ApiException(
          message: 'Failed to fetch project',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<ProjectModel> createProject(ProjectModel project) async {
    try {
      final response = await _apiClient.post('/projects', data: project.toJson());
      
      if (response.statusCode == 201 || response.statusCode == 200) {
        return ProjectModel.fromJson(response.data);
      } else {
        throw ApiException(
          message: 'Failed to create project',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<ProjectModel> updateProject(String id, ProjectModel project) async {
    try {
      final response = await _apiClient.put('/projects/$id', data: project.toJson());
      
      if (response.statusCode == 200) {
        return ProjectModel.fromJson(response.data);
      } else {
        throw ApiException(
          message: 'Failed to update project',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<void> deleteProject(String id) async {
    try {
      final response = await _apiClient.delete('/projects/$id');
      
      if (response.statusCode != 200 && response.statusCode != 204) {
        throw ApiException(
          message: 'Failed to delete project',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getProjectTasks(String projectId) async {
    try {
      final response = await _apiClient.get('/projects/$projectId/tasks');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.cast<Map<String, dynamic>>();
      } else {
        throw ApiException(
          message: 'Failed to fetch project tasks',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<Map<String, dynamic>> addProjectTask(
    String projectId,
    Map<String, dynamic> taskData,
  ) async {
    try {
      final response = await _apiClient.post(
        '/projects/$projectId/tasks',
        data: taskData,
      );
      
      if (response.statusCode == 201 || response.statusCode == 200) {
        return response.data;
      } else {
        throw ApiException(
          message: 'Failed to add task',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<Map<String, dynamic>> updateProjectTask(
    String projectId,
    String taskId,
    Map<String, dynamic> taskData,
  ) async {
    try {
      final response = await _apiClient.put(
        '/projects/$projectId/tasks/$taskId',
        data: taskData,
      );
      
      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw ApiException(
          message: 'Failed to update task',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getProjectMilestones(String projectId) async {
    try {
      final response = await _apiClient.get('/projects/$projectId/milestones');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.cast<Map<String, dynamic>>();
      } else {
        throw ApiException(
          message: 'Failed to fetch project milestones',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<Map<String, dynamic>> addProjectMilestone(
    String projectId,
    Map<String, dynamic> milestoneData,
  ) async {
    try {
      final response = await _apiClient.post(
        '/projects/$projectId/milestones',
        data: milestoneData,
      );
      
      if (response.statusCode == 201 || response.statusCode == 200) {
        return response.data;
      } else {
        throw ApiException(
          message: 'Failed to add milestone',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getProjectResources(String projectId) async {
    try {
      final response = await _apiClient.get('/projects/$projectId/resources');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.cast<Map<String, dynamic>>();
      } else {
        throw ApiException(
          message: 'Failed to fetch project resources',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<void> assignResourceToProject(
    String projectId,
    String resourceId,
    String resourceType,
  ) async {
    try {
      final response = await _apiClient.post(
        '/projects/$projectId/resources',
        data: {
          'resourceId': resourceId,
          'resourceType': resourceType,
        },
      );
      
      if (response.statusCode != 201 && response.statusCode != 200) {
        throw ApiException(
          message: 'Failed to assign resource',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<void> removeResourceFromProject(
    String projectId,
    String resourceId,
    String resourceType,
  ) async {
    try {
      final response = await _apiClient.delete(
        '/projects/$projectId/resources/$resourceId',
        queryParameters: {'resourceType': resourceType},
      );
      
      if (response.statusCode != 200 && response.statusCode != 204) {
        throw ApiException(
          message: 'Failed to remove resource',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getProjectTimesheets(String projectId) async {
    try {
      final response = await _apiClient.get('/projects/$projectId/timesheets');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.cast<Map<String, dynamic>>();
      } else {
        throw ApiException(
          message: 'Failed to fetch project timesheets',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<Map<String, dynamic>> getProjectBudgetSummary(String projectId) async {
    try {
      final response = await _apiClient.get('/projects/$projectId/budget-summary');
      
      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw ApiException(
          message: 'Failed to fetch budget summary',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<void> updateProjectStatus(String projectId, String status) async {
    try {
      final response = await _apiClient.put(
        '/projects/$projectId/status',
        data: {'status': status},
      );
      
      if (response.statusCode != 200) {
        throw ApiException(
          message: 'Failed to update project status',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<List<ProjectModel>> searchProjects(String query) async {
    try {
      final response = await _apiClient.get('/projects/search', queryParameters: {'q': query});
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.map((json) => ProjectModel.fromJson(json)).toList();
      } else {
        throw ApiException(
          message: 'Failed to search projects',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<List<ProjectModel>> getProjectsByStatus(String status) async {
    return getProjects(status: status);
  }

  @override
  Future<List<ProjectModel>> getActiveProjects() async {
    return getProjects(status: 'active');
  }

  @override
  Future<List<ProjectModel>> getProjectsByClient(String clientName) async {
    return getProjects(clientName: clientName);
  }
}
