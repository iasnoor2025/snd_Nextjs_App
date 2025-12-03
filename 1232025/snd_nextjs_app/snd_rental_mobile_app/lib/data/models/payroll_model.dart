class PayrollModel {
  final int id;
  final int employeeId;
  final String employeeName;
  final String period; // e.g., "2024-01"
  final int basicSalary;
  final double overtimeHours;
  final double overtimeRate;
  final double overtimeAmount;
  final double allowances;
  final double deductions;
  final double grossSalary;
  final double netSalary;
  final String status; // pending, approved, processed
  final String? processedDate;
  final String? approvedBy;
  final String? notes;

  const PayrollModel({
    required this.id,
    required this.employeeId,
    required this.employeeName,
    required this.period,
    required this.basicSalary,
    required this.overtimeHours,
    required this.overtimeRate,
    required this.overtimeAmount,
    required this.allowances,
    required this.deductions,
    required this.grossSalary,
    required this.netSalary,
    required this.status,
    this.processedDate,
    this.approvedBy,
    this.notes,
  });

  factory PayrollModel.fromJson(Map<String, dynamic> json) {
    return PayrollModel(
      id: _parseInt(json['id']),
      employeeId: _parseInt(json['employee_id']),
      employeeName: _parseString(json['employee_name']) ?? '',
      period: _parseString(json['period']) ?? '',
      basicSalary: _parseInt(json['basic_salary']),
      overtimeHours: _parseDouble(json['overtime_hours']) ?? 0.0,
      overtimeRate: _parseDouble(json['overtime_rate']) ?? 0.0,
      overtimeAmount: _parseDouble(json['overtime_amount']) ?? 0.0,
      allowances: _parseDouble(json['allowances']) ?? 0.0,
      deductions: _parseDouble(json['deductions']) ?? 0.0,
      grossSalary: _parseDouble(json['gross_salary']) ?? 0.0,
      netSalary: _parseDouble(json['net_salary']) ?? 0.0,
      status: _parseString(json['status']) ?? 'pending',
      processedDate: _parseString(json['processed_date']),
      approvedBy: _parseString(json['approved_by']),
      notes: _parseString(json['notes']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employee_id': employeeId,
      'employee_name': employeeName,
      'period': period,
      'basic_salary': basicSalary,
      'overtime_hours': overtimeHours,
      'overtime_rate': overtimeRate,
      'overtime_amount': overtimeAmount,
      'allowances': allowances,
      'deductions': deductions,
      'gross_salary': grossSalary,
      'net_salary': netSalary,
      'status': status,
      'processed_date': processedDate,
      'approved_by': approvedBy,
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

  static double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }

  static String? _parseString(dynamic value) {
    if (value == null) return null;
    if (value is String) return value;
    return value.toString();
  }

  PayrollModel copyWith({
    int? id,
    int? employeeId,
    String? employeeName,
    String? period,
    int? basicSalary,
    double? overtimeHours,
    double? overtimeRate,
    double? overtimeAmount,
    double? allowances,
    double? deductions,
    double? grossSalary,
    double? netSalary,
    String? status,
    String? processedDate,
    String? approvedBy,
    String? notes,
  }) {
    return PayrollModel(
      id: id ?? this.id,
      employeeId: employeeId ?? this.employeeId,
      employeeName: employeeName ?? this.employeeName,
      period: period ?? this.period,
      basicSalary: basicSalary ?? this.basicSalary,
      overtimeHours: overtimeHours ?? this.overtimeHours,
      overtimeRate: overtimeRate ?? this.overtimeRate,
      overtimeAmount: overtimeAmount ?? this.overtimeAmount,
      allowances: allowances ?? this.allowances,
      deductions: deductions ?? this.deductions,
      grossSalary: grossSalary ?? this.grossSalary,
      netSalary: netSalary ?? this.netSalary,
      status: status ?? this.status,
      processedDate: processedDate ?? this.processedDate,
      approvedBy: approvedBy ?? this.approvedBy,
      notes: notes ?? this.notes,
    );
  }
}
