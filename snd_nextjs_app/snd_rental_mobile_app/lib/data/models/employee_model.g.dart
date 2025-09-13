// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'employee_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

EmployeeModel _$EmployeeModelFromJson(Map<String, dynamic> json) =>
    EmployeeModel(
      id: json['id'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      middleName: json['middleName'] as String?,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      mobile: json['mobile'] as String?,
      address: json['address'] as String?,
      city: json['city'] as String?,
      state: json['state'] as String?,
      postalCode: json['postalCode'] as String?,
      country: json['country'] as String?,
      nationality: json['nationality'] as String?,
      passportNumber: json['passportNumber'] as String?,
      iqamaNumber: json['iqamaNumber'] as String?,
      drivingLicenseNumber: json['drivingLicenseNumber'] as String?,
      dateOfBirth: json['dateOfBirth'] == null
          ? null
          : DateTime.parse(json['dateOfBirth'] as String),
      gender: json['gender'] as String?,
      maritalStatus: json['maritalStatus'] as String?,
      bloodType: json['bloodType'] as String?,
      emergencyContactName: json['emergencyContactName'] as String?,
      emergencyContactPhone: json['emergencyContactPhone'] as String?,
      emergencyContactRelationship:
          json['emergencyContactRelationship'] as String?,
      profileImageUrl: json['profileImageUrl'] as String?,
      position: json['position'] as String?,
      department: json['department'] as String?,
      employmentType: json['employmentType'] as String?,
      hireDate: json['hireDate'] == null
          ? null
          : DateTime.parse(json['hireDate'] as String),
      terminationDate: json['terminationDate'] == null
          ? null
          : DateTime.parse(json['terminationDate'] as String),
      status: json['status'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$EmployeeModelToJson(EmployeeModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'firstName': instance.firstName,
      'lastName': instance.lastName,
      'middleName': instance.middleName,
      'email': instance.email,
      'phone': instance.phone,
      'mobile': instance.mobile,
      'address': instance.address,
      'city': instance.city,
      'state': instance.state,
      'postalCode': instance.postalCode,
      'country': instance.country,
      'nationality': instance.nationality,
      'passportNumber': instance.passportNumber,
      'iqamaNumber': instance.iqamaNumber,
      'drivingLicenseNumber': instance.drivingLicenseNumber,
      'dateOfBirth': instance.dateOfBirth?.toIso8601String(),
      'gender': instance.gender,
      'maritalStatus': instance.maritalStatus,
      'bloodType': instance.bloodType,
      'emergencyContactName': instance.emergencyContactName,
      'emergencyContactPhone': instance.emergencyContactPhone,
      'emergencyContactRelationship': instance.emergencyContactRelationship,
      'profileImageUrl': instance.profileImageUrl,
      'position': instance.position,
      'department': instance.department,
      'employmentType': instance.employmentType,
      'hireDate': instance.hireDate?.toIso8601String(),
      'terminationDate': instance.terminationDate?.toIso8601String(),
      'status': instance.status,
      'notes': instance.notes,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };
