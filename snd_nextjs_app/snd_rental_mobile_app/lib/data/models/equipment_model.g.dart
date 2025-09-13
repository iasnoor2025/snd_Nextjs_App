// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'equipment_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

EquipmentModel _$EquipmentModelFromJson(Map<String, dynamic> json) =>
    EquipmentModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      category: json['category'] as String?,
      subcategory: json['subcategory'] as String?,
      brand: json['brand'] as String?,
      model: json['model'] as String?,
      serialNumber: json['serialNumber'] as String?,
      assetTag: json['assetTag'] as String?,
      status: json['status'] as String?,
      condition: json['condition'] as String?,
      location: json['location'] as String?,
      assignedProjectId: json['assignedProjectId'] as String?,
      assignedProjectName: json['assignedProjectName'] as String?,
      assignedEmployeeId: json['assignedEmployeeId'] as String?,
      assignedEmployeeName: json['assignedEmployeeName'] as String?,
      purchaseDate: json['purchaseDate'] == null
          ? null
          : DateTime.parse(json['purchaseDate'] as String),
      purchasePrice: (json['purchasePrice'] as num?)?.toDouble(),
      currency: json['currency'] as String?,
      warrantyExpiry: json['warrantyExpiry'] == null
          ? null
          : DateTime.parse(json['warrantyExpiry'] as String),
      lastMaintenanceDate: json['lastMaintenanceDate'] == null
          ? null
          : DateTime.parse(json['lastMaintenanceDate'] as String),
      nextMaintenanceDate: json['nextMaintenanceDate'] == null
          ? null
          : DateTime.parse(json['nextMaintenanceDate'] as String),
      maintenanceIntervalDays:
          (json['maintenanceIntervalDays'] as num?)?.toInt(),
      maintenanceNotes: json['maintenanceNotes'] as String?,
      specifications: json['specifications'] as String?,
      imageUrl: json['imageUrl'] as String?,
      qrCode: json['qrCode'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$EquipmentModelToJson(EquipmentModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'description': instance.description,
      'category': instance.category,
      'subcategory': instance.subcategory,
      'brand': instance.brand,
      'model': instance.model,
      'serialNumber': instance.serialNumber,
      'assetTag': instance.assetTag,
      'status': instance.status,
      'condition': instance.condition,
      'location': instance.location,
      'assignedProjectId': instance.assignedProjectId,
      'assignedProjectName': instance.assignedProjectName,
      'assignedEmployeeId': instance.assignedEmployeeId,
      'assignedEmployeeName': instance.assignedEmployeeName,
      'purchaseDate': instance.purchaseDate?.toIso8601String(),
      'purchasePrice': instance.purchasePrice,
      'currency': instance.currency,
      'warrantyExpiry': instance.warrantyExpiry?.toIso8601String(),
      'lastMaintenanceDate': instance.lastMaintenanceDate?.toIso8601String(),
      'nextMaintenanceDate': instance.nextMaintenanceDate?.toIso8601String(),
      'maintenanceIntervalDays': instance.maintenanceIntervalDays,
      'maintenanceNotes': instance.maintenanceNotes,
      'specifications': instance.specifications,
      'imageUrl': instance.imageUrl,
      'qrCode': instance.qrCode,
      'notes': instance.notes,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };
