import '../../data/models/equipment_model.dart';

abstract class EquipmentRepository {
  // Get all equipment with pagination
  Future<List<EquipmentModel>> getEquipment({
    int page = 1,
    int limit = 20,
    String? search,
    String? status,
    String? category,
    String? location,
  });

  // Get equipment by ID
  Future<EquipmentModel?> getEquipmentById(String id);

  // Create new equipment
  Future<EquipmentModel> createEquipment(EquipmentModel equipment);

  // Update equipment
  Future<EquipmentModel> updateEquipment(String id, EquipmentModel equipment);

  // Delete equipment
  Future<void> deleteEquipment(String id);

  // Get equipment documents
  Future<List<Map<String, dynamic>>> getEquipmentDocuments(String equipmentId);

  // Upload equipment document
  Future<Map<String, dynamic>> uploadEquipmentDocument(
    String equipmentId,
    String filePath,
    String documentType,
  );

  // Get equipment maintenance history
  Future<List<Map<String, dynamic>>> getEquipmentMaintenanceHistory(String equipmentId);

  // Add maintenance record
  Future<Map<String, dynamic>> addMaintenanceRecord(
    String equipmentId,
    Map<String, dynamic> maintenanceData,
  );

  // Get equipment rental history
  Future<List<Map<String, dynamic>>> getEquipmentRentalHistory(String equipmentId);

  // Assign equipment to project
  Future<void> assignEquipmentToProject(String equipmentId, String projectId);

  // Unassign equipment from project
  Future<void> unassignEquipmentFromProject(String equipmentId);

  // Assign equipment to employee
  Future<void> assignEquipmentToEmployee(String equipmentId, String employeeId);

  // Unassign equipment from employee
  Future<void> unassignEquipmentFromEmployee(String equipmentId);

  // Update equipment status
  Future<void> updateEquipmentStatus(String equipmentId, String status);

  // Update equipment location
  Future<void> updateEquipmentLocation(String equipmentId, String location);

  // Search equipment
  Future<List<EquipmentModel>> searchEquipment(String query);

  // Get equipment by status
  Future<List<EquipmentModel>> getEquipmentByStatus(String status);

  // Get available equipment
  Future<List<EquipmentModel>> getAvailableEquipment();

  // Get equipment by category
  Future<List<EquipmentModel>> getEquipmentByCategory(String category);

  // Get equipment by location
  Future<List<EquipmentModel>> getEquipmentByLocation(String location);

  // Get maintenance due equipment
  Future<List<EquipmentModel>> getMaintenanceDueEquipment();

  // Get equipment statistics
  Future<Map<String, dynamic>> getEquipmentStatistics();
}
