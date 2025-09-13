// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'project_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ProjectModel _$ProjectModelFromJson(Map<String, dynamic> json) => ProjectModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      clientName: json['clientName'] as String?,
      clientContact: json['clientContact'] as String?,
      clientEmail: json['clientEmail'] as String?,
      clientPhone: json['clientPhone'] as String?,
      address: json['address'] as String?,
      city: json['city'] as String?,
      state: json['state'] as String?,
      postalCode: json['postalCode'] as String?,
      country: json['country'] as String?,
      status: json['status'] as String?,
      priority: json['priority'] as String?,
      startDate: json['startDate'] == null
          ? null
          : DateTime.parse(json['startDate'] as String),
      endDate: json['endDate'] == null
          ? null
          : DateTime.parse(json['endDate'] as String),
      actualStartDate: json['actualStartDate'] == null
          ? null
          : DateTime.parse(json['actualStartDate'] as String),
      actualEndDate: json['actualEndDate'] == null
          ? null
          : DateTime.parse(json['actualEndDate'] as String),
      budget: (json['budget'] as num?)?.toDouble(),
      actualCost: (json['actualCost'] as num?)?.toDouble(),
      currency: json['currency'] as String?,
      projectManagerId: json['projectManagerId'] as String?,
      projectManagerName: json['projectManagerName'] as String?,
      teamMemberIds: (json['teamMemberIds'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      teamMemberNames: (json['teamMemberNames'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      equipmentIds: (json['equipmentIds'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$ProjectModelToJson(ProjectModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'description': instance.description,
      'clientName': instance.clientName,
      'clientContact': instance.clientContact,
      'clientEmail': instance.clientEmail,
      'clientPhone': instance.clientPhone,
      'address': instance.address,
      'city': instance.city,
      'state': instance.state,
      'postalCode': instance.postalCode,
      'country': instance.country,
      'status': instance.status,
      'priority': instance.priority,
      'startDate': instance.startDate?.toIso8601String(),
      'endDate': instance.endDate?.toIso8601String(),
      'actualStartDate': instance.actualStartDate?.toIso8601String(),
      'actualEndDate': instance.actualEndDate?.toIso8601String(),
      'budget': instance.budget,
      'actualCost': instance.actualCost,
      'currency': instance.currency,
      'projectManagerId': instance.projectManagerId,
      'projectManagerName': instance.projectManagerName,
      'teamMemberIds': instance.teamMemberIds,
      'teamMemberNames': instance.teamMemberNames,
      'equipmentIds': instance.equipmentIds,
      'notes': instance.notes,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };
