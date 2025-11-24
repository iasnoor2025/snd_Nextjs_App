import '../../data/models/employee_model.dart';

abstract class EmployeeRepository {
  // Get all employees with pagination
  Future<List<EmployeeModel>> getEmployees({
    int page = 1,
    int limit = 20,
    String? search,
    String? status,
    String? department,
  });

  // Get employee by ID
  Future<EmployeeModel?> getEmployeeById(String id);

  // Create new employee
  Future<EmployeeModel> createEmployee(EmployeeModel employee);

  // Update employee
  Future<EmployeeModel> updateEmployee(String id, EmployeeModel employee);

  // Delete employee
  Future<void> deleteEmployee(String id);

  // Get employee documents
  Future<List<Map<String, dynamic>>> getEmployeeDocuments(String employeeId);

  // Upload employee document
  Future<Map<String, dynamic>> uploadEmployeeDocument(
    String employeeId,
    String filePath,
    String documentType,
  );

  // Get employee skills
  Future<List<Map<String, dynamic>>> getEmployeeSkills(String employeeId);

  // Add skill to employee
  Future<void> addEmployeeSkill(
    String employeeId,
    String skillId,
    String proficiencyLevel,
  );

  // Get employee training
  Future<List<Map<String, dynamic>>> getEmployeeTraining(String employeeId);

  // Get employee performance reviews
  Future<List<Map<String, dynamic>>> getEmployeePerformanceReviews(String employeeId);

  // Search employees
  Future<List<EmployeeModel>> searchEmployees(String query);

  // Get employees by department
  Future<List<EmployeeModel>> getEmployeesByDepartment(String department);

  // Get active employees
  Future<List<EmployeeModel>> getActiveEmployees();
}
