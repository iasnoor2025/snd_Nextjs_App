class PermissionModel {
  final int id;
  final String name;
  final String? description;
  final String category;
  final String? resource;
  final String? action;
  final bool isActive;
  final String createdAt;
  final String? updatedAt;

  const PermissionModel({
    required this.id,
    required this.name,
    this.description,
    required this.category,
    this.resource,
    this.action,
    required this.isActive,
    required this.createdAt,
    this.updatedAt,
  });

  factory PermissionModel.fromJson(Map<String, dynamic> json) {
    return PermissionModel(
      id: _parseInt(json['id']),
      name: _parseString(json['name']) ?? '',
      description: _parseString(json['description']),
      category: _parseString(json['category']) ?? '',
      resource: _parseString(json['resource']),
      action: _parseString(json['action']),
      isActive: _parseBool(json['is_active']),
      createdAt: _parseString(json['created_at']) ?? '',
      updatedAt: _parseString(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'category': category,
      'resource': resource,
      'action': action,
      'is_active': isActive,
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

  PermissionModel copyWith({
    int? id,
    String? name,
    String? description,
    String? category,
    String? resource,
    String? action,
    bool? isActive,
    String? createdAt,
    String? updatedAt,
  }) {
    return PermissionModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      category: category ?? this.category,
      resource: resource ?? this.resource,
      action: action ?? this.action,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
