import 'package:json_annotation/json_annotation.dart';

part 'equipment_model.g.dart';

@JsonSerializable()
class EquipmentModel {
  final String id;
  final String name;
  final String? description;
  final String? category;
  final String? subcategory;
  final String? brand;
  final String? model;
  final String? serialNumber;
  final String? assetTag;
  final String? status;
  final String? condition;
  final String? location;
  final String? assignedProjectId;
  final String? assignedProjectName;
  final String? assignedEmployeeId;
  final String? assignedEmployeeName;
  final DateTime? purchaseDate;
  final double? purchasePrice;
  final String? currency;
  final DateTime? warrantyExpiry;
  final DateTime? lastMaintenanceDate;
  final DateTime? nextMaintenanceDate;
  final int? maintenanceIntervalDays;
  final String? maintenanceNotes;
  final String? specifications;
  final String? imageUrl;
  final String? qrCode;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  const EquipmentModel({
    required this.id,
    required this.name,
    this.description,
    this.category,
    this.subcategory,
    this.brand,
    this.model,
    this.serialNumber,
    this.assetTag,
    this.status,
    this.condition,
    this.location,
    this.assignedProjectId,
    this.assignedProjectName,
    this.assignedEmployeeId,
    this.assignedEmployeeName,
    this.purchaseDate,
    this.purchasePrice,
    this.currency,
    this.warrantyExpiry,
    this.lastMaintenanceDate,
    this.nextMaintenanceDate,
    this.maintenanceIntervalDays,
    this.maintenanceNotes,
    this.specifications,
    this.imageUrl,
    this.qrCode,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory EquipmentModel.fromJson(Map<String, dynamic> json) => _$EquipmentModelFromJson(json);
  Map<String, dynamic> toJson() => _$EquipmentModelToJson(this);

  bool get isAvailable => status == 'available';
  bool get isInUse => status == 'in_use';
  bool get isMaintenance => status == 'maintenance';
  bool get isRetired => status == 'retired';

  bool get isGoodCondition => condition == 'good';
  bool get isFairCondition => condition == 'fair';
  bool get isPoorCondition => condition == 'poor';

  bool get isUnderWarranty {
    if (warrantyExpiry == null) return false;
    return DateTime.now().isBefore(warrantyExpiry!);
  }

  bool get isMaintenanceDue {
    if (nextMaintenanceDate == null) return false;
    return DateTime.now().isAfter(nextMaintenanceDate!);
  }

  int? get daysUntilMaintenance {
    if (nextMaintenanceDate == null) return null;
    return nextMaintenanceDate!.difference(DateTime.now()).inDays;
  }

  String get displayName => '$name ${model != null ? '($model)' : ''}';
  String get fullIdentifier => '$name - $serialNumber';

  EquipmentModel copyWith({
    String? id,
    String? name,
    String? description,
    String? category,
    String? subcategory,
    String? brand,
    String? model,
    String? serialNumber,
    String? assetTag,
    String? status,
    String? condition,
    String? location,
    String? assignedProjectId,
    String? assignedProjectName,
    String? assignedEmployeeId,
    String? assignedEmployeeName,
    DateTime? purchaseDate,
    double? purchasePrice,
    String? currency,
    DateTime? warrantyExpiry,
    DateTime? lastMaintenanceDate,
    DateTime? nextMaintenanceDate,
    int? maintenanceIntervalDays,
    String? maintenanceNotes,
    String? specifications,
    String? imageUrl,
    String? qrCode,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return EquipmentModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      category: category ?? this.category,
      subcategory: subcategory ?? this.subcategory,
      brand: brand ?? this.brand,
      model: model ?? this.model,
      serialNumber: serialNumber ?? this.serialNumber,
      assetTag: assetTag ?? this.assetTag,
      status: status ?? this.status,
      condition: condition ?? this.condition,
      location: location ?? this.location,
      assignedProjectId: assignedProjectId ?? this.assignedProjectId,
      assignedProjectName: assignedProjectName ?? this.assignedProjectName,
      assignedEmployeeId: assignedEmployeeId ?? this.assignedEmployeeId,
      assignedEmployeeName: assignedEmployeeName ?? this.assignedEmployeeName,
      purchaseDate: purchaseDate ?? this.purchaseDate,
      purchasePrice: purchasePrice ?? this.purchasePrice,
      currency: currency ?? this.currency,
      warrantyExpiry: warrantyExpiry ?? this.warrantyExpiry,
      lastMaintenanceDate: lastMaintenanceDate ?? this.lastMaintenanceDate,
      nextMaintenanceDate: nextMaintenanceDate ?? this.nextMaintenanceDate,
      maintenanceIntervalDays: maintenanceIntervalDays ?? this.maintenanceIntervalDays,
      maintenanceNotes: maintenanceNotes ?? this.maintenanceNotes,
      specifications: specifications ?? this.specifications,
      imageUrl: imageUrl ?? this.imageUrl,
      qrCode: qrCode ?? this.qrCode,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
