import 'package:json_annotation/json_annotation.dart';

part 'employee_model.g.dart';

@JsonSerializable()
class EmployeeModel {
  final String id;
  final String firstName;
  final String lastName;
  final String? middleName;
  final String email;
  final String? phone;
  final String? mobile;
  final String? address;
  final String? city;
  final String? state;
  final String? postalCode;
  final String? country;
  final String? nationality;
  final String? passportNumber;
  final String? iqamaNumber;
  final String? drivingLicenseNumber;
  final DateTime? dateOfBirth;
  final String? gender;
  final String? maritalStatus;
  final String? bloodType;
  final String? emergencyContactName;
  final String? emergencyContactPhone;
  final String? emergencyContactRelationship;
  final String? profileImageUrl;
  final String? position;
  final String? department;
  final String? employmentType;
  final DateTime? hireDate;
  final DateTime? terminationDate;
  final String? status;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  const EmployeeModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.middleName,
    required this.email,
    this.phone,
    this.mobile,
    this.address,
    this.city,
    this.state,
    this.postalCode,
    this.country,
    this.nationality,
    this.passportNumber,
    this.iqamaNumber,
    this.drivingLicenseNumber,
    this.dateOfBirth,
    this.gender,
    this.maritalStatus,
    this.bloodType,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.emergencyContactRelationship,
    this.profileImageUrl,
    this.position,
    this.department,
    this.employmentType,
    this.hireDate,
    this.terminationDate,
    this.status,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory EmployeeModel.fromJson(Map<String, dynamic> json) => _$EmployeeModelFromJson(json);
  Map<String, dynamic> toJson() => _$EmployeeModelToJson(this);

  String get fullName => '$firstName ${middleName ?? ''} $lastName'.trim();
  
  String get displayName => '$firstName $lastName';
  
  bool get isActive => status == 'active';
  
  bool get isTerminated => status == 'terminated';
  
  int? get age {
    if (dateOfBirth == null) return null;
    final now = DateTime.now();
    int age = now.year - dateOfBirth!.year;
    if (now.month < dateOfBirth!.month || 
        (now.month == dateOfBirth!.month && now.day < dateOfBirth!.day)) {
      age--;
    }
    return age;
  }

  EmployeeModel copyWith({
    String? id,
    String? firstName,
    String? lastName,
    String? middleName,
    String? email,
    String? phone,
    String? mobile,
    String? address,
    String? city,
    String? state,
    String? postalCode,
    String? country,
    String? nationality,
    String? passportNumber,
    String? iqamaNumber,
    String? drivingLicenseNumber,
    DateTime? dateOfBirth,
    String? gender,
    String? maritalStatus,
    String? bloodType,
    String? emergencyContactName,
    String? emergencyContactPhone,
    String? emergencyContactRelationship,
    String? profileImageUrl,
    String? position,
    String? department,
    String? employmentType,
    DateTime? hireDate,
    DateTime? terminationDate,
    String? status,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return EmployeeModel(
      id: id ?? this.id,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      middleName: middleName ?? this.middleName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      mobile: mobile ?? this.mobile,
      address: address ?? this.address,
      city: city ?? this.city,
      state: state ?? this.state,
      postalCode: postalCode ?? this.postalCode,
      country: country ?? this.country,
      nationality: nationality ?? this.nationality,
      passportNumber: passportNumber ?? this.passportNumber,
      iqamaNumber: iqamaNumber ?? this.iqamaNumber,
      drivingLicenseNumber: drivingLicenseNumber ?? this.drivingLicenseNumber,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      gender: gender ?? this.gender,
      maritalStatus: maritalStatus ?? this.maritalStatus,
      bloodType: bloodType ?? this.bloodType,
      emergencyContactName: emergencyContactName ?? this.emergencyContactName,
      emergencyContactPhone: emergencyContactPhone ?? this.emergencyContactPhone,
      emergencyContactRelationship: emergencyContactRelationship ?? this.emergencyContactRelationship,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      position: position ?? this.position,
      department: department ?? this.department,
      employmentType: employmentType ?? this.employmentType,
      hireDate: hireDate ?? this.hireDate,
      terminationDate: terminationDate ?? this.terminationDate,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
