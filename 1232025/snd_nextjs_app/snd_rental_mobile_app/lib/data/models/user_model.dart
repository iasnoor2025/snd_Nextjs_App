class UserModel {
  final int id;
  final String email;
  final String? name;
  final String? firstName;
  final String? lastName;
  final String? image;
  final String? phone;
  final String? department;
  final String? designation;
  final String? status; // active, inactive, suspended
  final String? role;
  final List<String>? permissions;
  final String? lastLogin;
  final String? createdAt;
  final String? updatedAt;

  const UserModel({
    required this.id,
    required this.email,
    this.name,
    this.firstName,
    this.lastName,
    this.image,
    this.phone,
    this.department,
    this.designation,
    this.status,
    this.role,
    this.permissions,
    this.lastLogin,
    required this.createdAt,
    this.updatedAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: _parseInt(json['id']),
      email: _parseString(json['email']) ?? '',
      name: _parseString(json['name']),
      firstName: _parseString(json['first_name']),
      lastName: _parseString(json['last_name']),
      image: _parseString(json['image']),
      phone: _parseString(json['phone']),
      department: _parseString(json['department']),
      designation: _parseString(json['designation']),
      status: _parseString(json['status']),
      role: _parseString(json['role']),
      permissions: (json['permissions'] as List<dynamic>?)
          ?.map((permission) => permission.toString())
          .toList(),
      lastLogin: _parseString(json['last_login']),
      createdAt: _parseString(json['created_at']) ?? '',
      updatedAt: _parseString(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'first_name': firstName,
      'last_name': lastName,
      'image': image,
      'phone': phone,
      'department': department,
      'designation': designation,
      'status': status,
      'role': role,
      'permissions': permissions,
      'last_login': lastLogin,
      'created_at': createdAt,
      'updated_at': updatedAt,
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

  String get displayName {
    if (name != null && name!.isNotEmpty) return name!;
    if (firstName != null && lastName != null) return '$firstName $lastName';
    return email;
  }

  bool get isActive => status == 'active';
  bool get isInactive => status == 'inactive';
  bool get isSuspended => status == 'suspended';

  bool hasPermission(String permission) {
    return permissions?.contains(permission) ?? false;
  }

  UserModel copyWith({
    int? id,
    String? email,
    String? name,
    String? firstName,
    String? lastName,
    String? image,
    String? phone,
    String? department,
    String? designation,
    String? status,
    String? role,
    List<String>? permissions,
    String? lastLogin,
    String? createdAt,
    String? updatedAt,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      image: image ?? this.image,
      phone: phone ?? this.phone,
      department: department ?? this.department,
      designation: designation ?? this.designation,
      status: status ?? this.status,
      role: role ?? this.role,
      permissions: permissions ?? this.permissions,
      lastLogin: lastLogin ?? this.lastLogin,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
