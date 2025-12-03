class LeaveModel {
  final int id;
  final int employeeId;
  final String employeeName;
  final String leaveType; // annual, sick, personal, maternity, study
  final String startDate;
  final String endDate;
  final int totalDays;
  final String reason;
  final String status; // pending, approved, rejected, cancelled
  final String? approvedBy;
  final String? approvedDate;
  final String? rejectionReason;
  final String? appliedDate;
  final String? notes;

  const LeaveModel({
    required this.id,
    required this.employeeId,
    required this.employeeName,
    required this.leaveType,
    required this.startDate,
    required this.endDate,
    required this.totalDays,
    required this.reason,
    required this.status,
    this.approvedBy,
    this.approvedDate,
    this.rejectionReason,
    this.appliedDate,
    this.notes,
  });

  factory LeaveModel.fromJson(Map<String, dynamic> json) {
    return LeaveModel(
      id: _parseInt(json['id']),
      employeeId: _parseInt(json['employee_id']),
      employeeName: _parseString(json['employee_name']) ?? '',
      leaveType: _parseString(json['leave_type']) ?? '',
      startDate: _parseString(json['start_date']) ?? '',
      endDate: _parseString(json['end_date']) ?? '',
      totalDays: _parseInt(json['total_days']),
      reason: _parseString(json['reason']) ?? '',
      status: _parseString(json['status']) ?? 'pending',
      approvedBy: _parseString(json['approved_by']),
      approvedDate: _parseString(json['approved_date']),
      rejectionReason: _parseString(json['rejection_reason']),
      appliedDate: _parseString(json['applied_date']),
      notes: _parseString(json['notes']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employee_id': employeeId,
      'employee_name': employeeName,
      'leave_type': leaveType,
      'start_date': startDate,
      'end_date': endDate,
      'total_days': totalDays,
      'reason': reason,
      'status': status,
      'approved_by': approvedBy,
      'approved_date': approvedDate,
      'rejection_reason': rejectionReason,
      'applied_date': appliedDate,
      'notes': notes,
    };
  }

  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    if (value is double) return value.toInt();
    return 0;
  }

  static String? _parseString(dynamic value) {
    if (value == null) return null;
    if (value is String) return value;
    return value.toString();
  }

  bool get isPending => status == 'pending';
  bool get isApproved => status == 'approved';
  bool get isRejected => status == 'rejected';
  bool get isCancelled => status == 'cancelled';

  LeaveModel copyWith({
    int? id,
    int? employeeId,
    String? employeeName,
    String? leaveType,
    String? startDate,
    String? endDate,
    int? totalDays,
    String? reason,
    String? status,
    String? approvedBy,
    String? approvedDate,
    String? rejectionReason,
    String? appliedDate,
    String? notes,
  }) {
    return LeaveModel(
      id: id ?? this.id,
      employeeId: employeeId ?? this.employeeId,
      employeeName: employeeName ?? this.employeeName,
      leaveType: leaveType ?? this.leaveType,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      totalDays: totalDays ?? this.totalDays,
      reason: reason ?? this.reason,
      status: status ?? this.status,
      approvedBy: approvedBy ?? this.approvedBy,
      approvedDate: approvedDate ?? this.approvedDate,
      rejectionReason: rejectionReason ?? this.rejectionReason,
      appliedDate: appliedDate ?? this.appliedDate,
      notes: notes ?? this.notes,
    );
  }
}
