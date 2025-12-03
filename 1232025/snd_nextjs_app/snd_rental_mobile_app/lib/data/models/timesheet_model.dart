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

  factory TimesheetModel.fromJson(Map<String, dynamic> json) {
    try {
      return TimesheetModel(
        id: json['id']?.toString() ?? '',
        employeeId: json['employee_id']?.toString() ?? '',
        employeeName: json['employee_name']?.toString() ?? 'Unknown Employee',
        projectId: json['project_id']?.toString(),
        projectName: json['project_name'] as String?,
        date: DateTime.parse(json['date'].toString()),
        hoursWorked: (json['hours_worked'] as num).toDouble(),
        overtimeHours: json['overtime_hours'] != null ? (json['overtime_hours'] as num).toDouble() : null,
        description: json['description']?.toString(),
        status: json['status']?.toString() ?? 'pending',
        approvedById: json['approved_by_id']?.toString(),
        approvedByName: json['approved_by_name']?.toString(),
        approvedAt: json['approved_at'] != null ? DateTime.parse(json['approved_at'].toString()) : null,
        rejectionReason: json['rejection_reason']?.toString(),
        createdAt: DateTime.parse(json['created_at'].toString()),
        updatedAt: DateTime.parse(json['updated_at'].toString()),
      );
    } catch (e) {
      print('Error parsing timesheet JSON: $e');
      print('JSON data: $json');
      rethrow;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employee_id': employeeId,
      'employee_name': employeeName,
      'project_id': projectId,
      'project_name': projectName,
      'date': date.toIso8601String(),
      'hours_worked': hoursWorked,
      'overtime_hours': overtimeHours,
      'description': description,
      'status': status,
      'approved_by_id': approvedById,
      'approved_by_name': approvedByName,
      'approved_at': approvedAt?.toIso8601String(),
      'rejection_reason': rejectionReason,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

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
