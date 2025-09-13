// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'timesheet_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TimesheetModel _$TimesheetModelFromJson(Map<String, dynamic> json) =>
    TimesheetModel(
      id: json['id'] as String,
      employeeId: json['employeeId'] as String,
      employeeName: json['employeeName'] as String,
      projectId: json['projectId'] as String?,
      projectName: json['projectName'] as String?,
      date: DateTime.parse(json['date'] as String),
      hoursWorked: (json['hoursWorked'] as num).toDouble(),
      overtimeHours: (json['overtimeHours'] as num?)?.toDouble(),
      description: json['description'] as String?,
      status: json['status'] as String,
      approvedById: json['approvedById'] as String?,
      approvedByName: json['approvedByName'] as String?,
      approvedAt: json['approvedAt'] == null
          ? null
          : DateTime.parse(json['approvedAt'] as String),
      rejectionReason: json['rejectionReason'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$TimesheetModelToJson(TimesheetModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'employeeId': instance.employeeId,
      'employeeName': instance.employeeName,
      'projectId': instance.projectId,
      'projectName': instance.projectName,
      'date': instance.date.toIso8601String(),
      'hoursWorked': instance.hoursWorked,
      'overtimeHours': instance.overtimeHours,
      'description': instance.description,
      'status': instance.status,
      'approvedById': instance.approvedById,
      'approvedByName': instance.approvedByName,
      'approvedAt': instance.approvedAt?.toIso8601String(),
      'rejectionReason': instance.rejectionReason,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };
