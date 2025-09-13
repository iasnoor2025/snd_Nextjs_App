import 'package:json_annotation/json_annotation.dart';

part 'timesheet_model.g.dart';

@JsonSerializable()
class TimesheetModel {
  final String id;
  final String employeeId;
  final String employeeName;
  final String? projectId;
  final String? projectName;
  final DateTime date;
  final double hoursWorked;
  final double? overtimeHours;
  final String? description;
  final String status; // pending, approved, rejected
  final String? approvedById;
  final String? approvedByName;
  final DateTime? approvedAt;
  final String? rejectionReason;
  final DateTime createdAt;
  final DateTime updatedAt;

  const TimesheetModel({
    required this.id,
    required this.employeeId,
    required this.employeeName,
    this.projectId,
    this.projectName,
    required this.date,
    required this.hoursWorked,
    this.overtimeHours,
    this.description,
    required this.status,
    this.approvedById,
    this.approvedByName,
    this.approvedAt,
    this.rejectionReason,
    required this.createdAt,
    required this.updatedAt,
  });

  factory TimesheetModel.fromJson(Map<String, dynamic> json) =>
      _$TimesheetModelFromJson(json);

  Map<String, dynamic> toJson() => _$TimesheetModelToJson(this);

  TimesheetModel copyWith({
    String? id,
    String? employeeId,
    String? employeeName,
    String? projectId,
    String? projectName,
    DateTime? date,
    double? hoursWorked,
    double? overtimeHours,
    String? description,
    String? status,
    String? approvedById,
    String? approvedByName,
    DateTime? approvedAt,
    String? rejectionReason,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return TimesheetModel(
      id: id ?? this.id,
      employeeId: employeeId ?? this.employeeId,
      employeeName: employeeName ?? this.employeeName,
      projectId: projectId ?? this.projectId,
      projectName: projectName ?? this.projectName,
      date: date ?? this.date,
      hoursWorked: hoursWorked ?? this.hoursWorked,
      overtimeHours: overtimeHours ?? this.overtimeHours,
      description: description ?? this.description,
      status: status ?? this.status,
      approvedById: approvedById ?? this.approvedById,
      approvedByName: approvedByName ?? this.approvedByName,
      approvedAt: approvedAt ?? this.approvedAt,
      rejectionReason: rejectionReason ?? this.rejectionReason,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // Helper getters
  bool get isPending => status == 'pending';
  bool get isApproved => status == 'approved';
  bool get isRejected => status == 'rejected';
  
  double get totalHours => hoursWorked + (overtimeHours ?? 0);
  
  String get displayDate => '${date.day}/${date.month}/${date.year}';
  
  String get displayHours => '${hoursWorked.toStringAsFixed(1)}h';
  
  String get displayTotalHours => '${totalHours.toStringAsFixed(1)}h';
}
