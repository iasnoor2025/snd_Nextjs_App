class RoleModel {
  final int id;
  final String name;
  final String? description;
  final List<String> permissions;
  final String? color;
  final bool isDefault;
  final String createdAt;
  final String? updatedAt;

  const RoleModel({
    required this.id,
    required this.name,
    this.description,
    required this.permissions,
    this.color,
    required this.isDefault,
    required this.createdAt,
    this.updatedAt,
  });

  factory RoleModel.fromJson(Map<String, dynamic> json) {
    return RoleModel(
      id: _parseInt(json['id']),
      name: _parseString(json['name']) ?? '',
      description: _parseString(json['description']),
      permissions: (json['permissions'] as List<dynamic>?)
          ?.map((permission) => permission.toString())
          .toList() ?? [],
      color: _parseString(json['color']),
      isDefault: _parseBool(json['is_default']),
      createdAt: _parseString(json['created_at']) ?? '',
      updatedAt: _parseString(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'permissions': permissions,
      'color': color,
      'is_default': isDefault,
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

  static bool _parseBool(dynamic value) {
    if (value == null) return false;
    if (value is bool) return value;
    if (value is String) return value.toLowerCase() == 'true';
    if (value is int) return value != 0;
    return false;
  }

  static String? _parseString(dynamic value) {
    if (value == null) return null;
    if (value is String) return value;
    return value.toString();
  }

  bool hasPermission(String permission) {
    return permissions.contains(permission);
  }

  RoleModel copyWith({
    int? id,
    String? name,
    String? description,
    List<String>? permissions,
    String? color,
    bool? isDefault,
    String? createdAt,
    String? updatedAt,
  }) {
    return RoleModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      permissions: permissions ?? this.permissions,
      color: color ?? this.color,
      isDefault: isDefault ?? this.isDefault,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
