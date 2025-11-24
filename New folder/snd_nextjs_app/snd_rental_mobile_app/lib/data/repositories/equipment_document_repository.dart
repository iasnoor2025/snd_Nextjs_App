import '../models/equipment_document_model.dart';

abstract class EquipmentDocumentRepository {
  Future<List<EquipmentDocumentModel>> getDocumentsByEquipmentId(int equipmentId);
  Future<EquipmentDocumentModel> uploadDocument({
    required int equipmentId,
    required String filePath,
    required String fileName,
    required String documentType,
    String? description,
  });
  Future<void> deleteDocument(int documentId);
}
