class UserProfileModel {
  final int id;
  final String email;
  final String? name;
  final String role;
  final String? firstName;
  final String? lastName;
  final String? image;
  final String? phone;
  final String? department;
  final String? designation;
  final String? status;
  final List<String>? permissions;
  final String? lastLogin;
  final String? createdAt;
  final String? updatedAt;
  final Map<String, dynamic>? employee;

  const UserProfileModel({
    required this.id,
    required this.email,
    this.name,
    required this.role,
    this.firstName,
    this.lastName,
    this.image,
    this.phone,
    this.department,
    this.designation,
    this.status,
    this.permissions,
    this.lastLogin,
    this.createdAt,
    this.updatedAt,
    this.employee,
  });

  factory UserProfileModel.fromJson(Map<String, dynamic> json) {
    return UserProfileModel(
      id: _parseInt(json['id']),
      email: _parseString(json['email']) ?? '',
      name: _parseString(json['name']),
      role: _parseString(json['role']) ?? 'USER',
      firstName: _parseString(json['first_name']),
      lastName: _parseString(json['last_name']),
      image: _parseString(json['image']),
      phone: _parseString(json['phone']),
      department: _parseString(json['department']),
      designation: _parseString(json['designation']),
      status: _parseString(json['status']),
      permissions: (json['permissions'] as List<dynamic>?)
          ?.map((permission) => permission.toString())
          .toList(),
      lastLogin: _parseString(json['last_login']),
      createdAt: _parseString(json['created_at']),
      updatedAt: _parseString(json['updated_at']),
      employee: json['employee'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role,
      'first_name': firstName,
      'last_name': lastName,
      'image': image,
      'phone': phone,
      'department': department,
      'designation': designation,
      'status': status,
      'permissions': permissions,
      'last_login': lastLogin,
      'created_at': createdAt,
      'updated_at': updatedAt,
      'employee': employee,
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

  String get displayName {
    if (name != null && name!.isNotEmpty) {
      return name!;
    }
    if (firstName != null && lastName != null) {
      return '$firstName $lastName';
    }
    if (firstName != null) {
      return firstName!;
    }
    return email.split('@').first;
  }

  bool get isActive => status == 'active';
  
  bool get isAdmin => role.toUpperCase() == 'ADMIN' || role.toUpperCase() == 'SUPER_ADMIN';
  
  bool get isEmployee => role.toUpperCase() == 'EMPLOYEE';
  
  bool get isManager => role.toUpperCase() == 'MANAGER';

  UserProfileModel copyWith({
    int? id,
    String? email,
    String? name,
    String? role,
    String? firstName,
    String? lastName,
    String? image,
    String? phone,
    String? department,
    String? designation,
    String? status,
    List<String>? permissions,
    String? lastLogin,
    String? createdAt,
    String? updatedAt,
  }) {
    return UserProfileModel(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      role: role ?? this.role,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      image: image ?? this.image,
      phone: phone ?? this.phone,
      department: department ?? this.department,
      designation: designation ?? this.designation,
      status: status ?? this.status,
      permissions: permissions ?? this.permissions,
      lastLogin: lastLogin ?? this.lastLogin,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
