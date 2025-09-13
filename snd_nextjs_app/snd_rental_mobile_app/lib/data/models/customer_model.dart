class CustomerModel {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? address;
  final String? city;
  final String? state;
  final String? country;
  final String? postalCode;
  final String? company;
  final String? contactPerson;
  final double? creditLimit;
  final String status;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  const CustomerModel({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.address,
    this.city,
    this.state,
    this.country,
    this.postalCode,
    this.company,
    this.contactPerson,
    this.creditLimit,
    required this.status,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory CustomerModel.fromJson(Map<String, dynamic> json) {
    return CustomerModel(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      address: json['address'] as String?,
      city: json['city'] as String?,
      state: json['state'] as String?,
      country: json['country'] as String?,
      postalCode: json['postalCode'] as String?,
      company: json['company'] as String?,
      contactPerson: json['contactPerson'] as String?,
      creditLimit: json['creditLimit'] != null ? (json['creditLimit'] as num).toDouble() : null,
      status: json['status'] as String,
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'address': address,
      'city': city,
      'state': state,
      'country': country,
      'postalCode': postalCode,
      'company': company,
      'contactPerson': contactPerson,
      'creditLimit': creditLimit,
      'status': status,
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  CustomerModel copyWith({
    String? id,
    String? name,
    String? email,
    String? phone,
    String? address,
    String? city,
    String? state,
    String? country,
    String? postalCode,
    String? company,
    String? contactPerson,
    double? creditLimit,
    String? status,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return CustomerModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      city: city ?? this.city,
      state: state ?? this.state,
      country: country ?? this.country,
      postalCode: postalCode ?? this.postalCode,
      company: company ?? this.company,
      contactPerson: contactPerson ?? this.contactPerson,
      creditLimit: creditLimit ?? this.creditLimit,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  String toString() {
    return 'CustomerModel(id: $id, name: $name, email: $email, status: $status)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is CustomerModel && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
