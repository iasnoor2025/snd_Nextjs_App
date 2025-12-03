class EmployeeModel {
  final int id;
  final String firstName;
  final String? middleName;
  final String lastName;
  final int employeeId;
  final int fileNumber;
  final String? email;
  final String? phone;
  final String status;
  final String fullName;
  final String? department;
  final String? designation;
  final String? hireDate;
  final String? iqamaNumber;
  final String? iqamaExpiry;
  final String? nationality;
  final int? basicSalary;
  final double? hourlyRate;
  final int? overtimeRateMultiplier;
  final int? overtimeFixedRate;
  final int? supervisor;
  final String? currentLocation;
  final String? currentAssignment;
  final dynamic user;

  const EmployeeModel({
    required this.id,
    required this.firstName,
    this.middleName,
    required this.lastName,
    required this.employeeId,
    required this.fileNumber,
    this.email,
    this.phone,
    required this.status,
    required this.fullName,
    this.department,
    this.designation,
    this.hireDate,
    this.iqamaNumber,
    this.iqamaExpiry,
    this.nationality,
    this.basicSalary,
    this.hourlyRate,
    this.overtimeRateMultiplier,
    this.overtimeFixedRate,
    this.supervisor,
    this.currentLocation,
    this.currentAssignment,
    this.user,
  });

  factory EmployeeModel.fromJson(Map<String, dynamic> json) {
    try {
      print('🔍 Parsing employee JSON: ${json.keys.toList()}');
      
      return EmployeeModel(
        id: _parseInt(json['id']),
        firstName: _parseString(json['first_name']) ?? '',
        middleName: _parseString(json['middle_name']),
        lastName: _parseString(json['last_name']) ?? '',
        employeeId: _parseInt(json['employee_id']),
        fileNumber: _parseInt(json['file_number']),
        email: _parseString(json['email']),
        phone: _parseString(json['phone']),
        status: _parseString(json['status']) ?? 'unknown',
        fullName: _parseString(json['full_name']) ?? '',
        department: _parseString(json['department']),
        designation: _parseString(json['designation']),
        hireDate: _parseString(json['hire_date']),
        iqamaNumber: _parseString(json['iqama_number']),
        iqamaExpiry: _parseString(json['iqama_expiry']),
        nationality: _parseString(json['nationality']),
        basicSalary: _parseInt(json['basic_salary']),
        hourlyRate: _parseDouble(json['hourly_rate']),
        overtimeRateMultiplier: _parseInt(json['overtime_rate_multiplier']),
        overtimeFixedRate: _parseInt(json['overtime_fixed_rate']),
        supervisor: _parseInt(json['supervisor']),
        currentLocation: _parseString(json['current_location']),
        currentAssignment: _parseString(json['current_assignment']),
        user: json['user'] is Map<String, dynamic> ? json['user'] as Map<String, dynamic> : null,
      );
    } catch (e) {
      print('❌ Error parsing employee JSON: $e');
      print('📄 JSON data: $json');
      rethrow;
    }
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
    if (value is Map) {
      print('⚠️ Found Map instead of String: $value');
      return value.toString();
    }
    if (value is List) {
      print('⚠️ Found List instead of String: $value');
      return value.toString();
    }
    return value.toString();
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'first_name': firstName,
      'middle_name': middleName,
      'last_name': lastName,
      'employee_id': employeeId,
      'file_number': fileNumber,
      'email': email,
      'phone': phone,
      'status': status,
      'full_name': fullName,
      'department': department,
      'designation': designation,
      'hire_date': hireDate,
      'iqama_number': iqamaNumber,
      'iqama_expiry': iqamaExpiry,
      'nationality': nationality,
      'basic_salary': basicSalary,
      'hourly_rate': hourlyRate,
      'overtime_rate_multiplier': overtimeRateMultiplier,
      'overtime_fixed_rate': overtimeFixedRate,
      'supervisor': supervisor,
      'current_location': currentLocation,
      'current_assignment': currentAssignment,
      'user': user,
    };
  }

  String get displayName => '$firstName $lastName';
  
  bool get isActive => status == 'active';
  
  bool get isTerminated => status == 'terminated';

  EmployeeModel copyWith({
    int? id,
    String? firstName,
    String? middleName,
    String? lastName,
    int? employeeId,
    int? fileNumber,
    String? email,
    String? phone,
    String? status,
    String? fullName,
    String? department,
    String? designation,
    String? hireDate,
    String? iqamaNumber,
    String? iqamaExpiry,
    String? nationality,
    int? basicSalary,
    double? hourlyRate,
    int? overtimeRateMultiplier,
    int? overtimeFixedRate,
    int? supervisor,
    String? currentLocation,
    String? currentAssignment,
    dynamic user,
  }) {
    return EmployeeModel(
      id: id ?? this.id,
      firstName: firstName ?? this.firstName,
      middleName: middleName ?? this.middleName,
      lastName: lastName ?? this.lastName,
      employeeId: employeeId ?? this.employeeId,
      fileNumber: fileNumber ?? this.fileNumber,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      status: status ?? this.status,
      fullName: fullName ?? this.fullName,
      department: department ?? this.department,
      designation: designation ?? this.designation,
      hireDate: hireDate ?? this.hireDate,
      iqamaNumber: iqamaNumber ?? this.iqamaNumber,
      iqamaExpiry: iqamaExpiry ?? this.iqamaExpiry,
      nationality: nationality ?? this.nationality,
      basicSalary: basicSalary ?? this.basicSalary,
      hourlyRate: hourlyRate ?? this.hourlyRate,
      overtimeRateMultiplier: overtimeRateMultiplier ?? this.overtimeRateMultiplier,
      overtimeFixedRate: overtimeFixedRate ?? this.overtimeFixedRate,
      supervisor: supervisor ?? this.supervisor,
      currentLocation: currentLocation ?? this.currentLocation,
      currentAssignment: currentAssignment ?? this.currentAssignment,
      user: user ?? this.user,
    );
  }
}
