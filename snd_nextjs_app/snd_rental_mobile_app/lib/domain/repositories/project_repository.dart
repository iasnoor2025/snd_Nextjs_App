import '../../data/models/project_model.dart';

abstract class ProjectRepository {
  // Get all projects with pagination
  Future<List<ProjectModel>> getProjects({
    int page = 1,
    int limit = 20,
    String? search,
    String? status,
    String? priority,
    String? clientName,
  });

  // Get project by ID
  Future<ProjectModel?> getProjectById(String id);

  // Create new project
  Future<ProjectModel> createProject(ProjectModel project);

  // Update project
  Future<ProjectModel> updateProject(String id, ProjectModel project);

  // Delete project
  Future<void> deleteProject(String id);

  // Get project tasks
  Future<List<Map<String, dynamic>>> getProjectTasks(String projectId);

  // Add task to project
  Future<Map<String, dynamic>> addProjectTask(
    String projectId,
    Map<String, dynamic> taskData,
  );

  // Update project task
  Future<Map<String, dynamic>> updateProjectTask(
    String projectId,
    String taskId,
    Map<String, dynamic> taskData,
  );

  // Get project milestones
  Future<List<Map<String, dynamic>>> getProjectMilestones(String projectId);

  // Add milestone to project
  Future<Map<String, dynamic>> addProjectMilestone(
    String projectId,
    Map<String, dynamic> milestoneData,
  );

  // Get project resources
  Future<List<Map<String, dynamic>>> getProjectResources(String projectId);

  // Assign resource to project
  Future<void> assignResourceToProject(
    String projectId,
    String resourceId,
    String resourceType, // 'employee' or 'equipment'
  );

  // Remove resource from project
  Future<void> removeResourceFromProject(
    String projectId,
    String resourceId,
    String resourceType,
  );

  // Get project timesheets
  Future<List<Map<String, dynamic>>> getProjectTimesheets(String projectId);

  // Get project budget summary
  Future<Map<String, dynamic>> getProjectBudgetSummary(String projectId);

  // Update project status
  Future<void> updateProjectStatus(String projectId, String status);

  // Search projects
  Future<List<ProjectModel>> searchProjects(String query);

  // Get projects by status
  Future<List<ProjectModel>> getProjectsByStatus(String status);

  // Get active projects
  Future<List<ProjectModel>> getActiveProjects();

  // Get projects by client
  Future<List<ProjectModel>> getProjectsByClient(String clientName);
}
