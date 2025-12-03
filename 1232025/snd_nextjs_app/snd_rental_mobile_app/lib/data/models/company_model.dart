class CompanyModel {
  final int id;
  final String name;
  final String? legalName;
  final String? registrationNumber;
  final String? taxNumber;
  final String? address;
  final String? city;
  final String? country;
  final String? phone;
  final String? email;
  final String? website;
  final String? logo;
  final String? description;
  final String? industry;
  final String? status; // active, inactive
  final String createdAt;
  final String? updatedAt;

  const CompanyModel({
    required this.id,
    required this.name,
    this.legalName,
    this.registrationNumber,
    this.taxNumber,
    this.address,
    this.city,
    this.country,
    this.phone,
    this.email,
    this.website,
    this.logo,
    this.description,
    this.industry,
    required this.status,
    required this.createdAt,
    this.updatedAt,
  });

  factory CompanyModel.fromJson(Map<String, dynamic> json) {
    return CompanyModel(
      id: _parseInt(json['id']),
      name: _parseString(json['name']) ?? '',
      legalName: _parseString(json['legal_name']),
      registrationNumber: _parseString(json['registration_number']),
      taxNumber: _parseString(json['tax_number']),
      address: _parseString(json['address']),
      city: _parseString(json['city']),
      country: _parseString(json['country']),
      phone: _parseString(json['phone']),
      email: _parseString(json['email']),
      website: _parseString(json['website']),
      logo: _parseString(json['logo']),
      description: _parseString(json['description']),
      industry: _parseString(json['industry']),
      status: _parseString(json['status']) ?? 'active',
      createdAt: _parseString(json['created_at']) ?? '',
      updatedAt: _parseString(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'legal_name': legalName,
      'registration_number': registrationNumber,
      'tax_number': taxNumber,
      'address': address,
      'city': city,
      'country': country,
      'phone': phone,
      'email': email,
      'website': website,
      'logo': logo,
      'description': description,
      'industry': industry,
      'status': status,
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

  bool get isActive => status == 'active';
  bool get isInactive => status == 'inactive';

  CompanyModel copyWith({
    int? id,
    String? name,
    String? legalName,
    String? registrationNumber,
    String? taxNumber,
    String? address,
    String? city,
    String? country,
    String? phone,
    String? email,
    String? website,
    String? logo,
    String? description,
    String? industry,
    String? status,
    String? createdAt,
    String? updatedAt,
  }) {
    return CompanyModel(
      id: id ?? this.id,
      name: name ?? this.name,
      legalName: legalName ?? this.legalName,
      registrationNumber: registrationNumber ?? this.registrationNumber,
      taxNumber: taxNumber ?? this.taxNumber,
      address: address ?? this.address,
      city: city ?? this.city,
      country: country ?? this.country,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      website: website ?? this.website,
      logo: logo ?? this.logo,
      description: description ?? this.description,
      industry: industry ?? this.industry,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
