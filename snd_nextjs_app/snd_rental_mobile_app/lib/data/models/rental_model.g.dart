// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'rental_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

RentalModel _$RentalModelFromJson(Map<String, dynamic> json) => RentalModel(
      id: json['id'] as String,
      rentalNumber: json['rentalNumber'] as String,
      customerId: json['customerId'] as String,
      customerName: json['customerName'] as String,
      customerEmail: json['customerEmail'] as String,
      customerPhone: json['customerPhone'] as String,
      projectId: json['projectId'] as String?,
      projectName: json['projectName'] as String?,
      address: json['address'] as String?,
      city: json['city'] as String?,
      state: json['state'] as String?,
      postalCode: json['postalCode'] as String?,
      country: json['country'] as String?,
      status: json['status'] as String,
      priority: json['priority'] as String?,
      startDate: json['startDate'] == null
          ? null
          : DateTime.parse(json['startDate'] as String),
      endDate: json['endDate'] == null
          ? null
          : DateTime.parse(json['endDate'] as String),
      actualStartDate: json['actualStartDate'] == null
          ? null
          : DateTime.parse(json['actualStartDate'] as String),
      actualEndDate: json['actualEndDate'] == null
          ? null
          : DateTime.parse(json['actualEndDate'] as String),
      totalAmount: (json['totalAmount'] as num?)?.toDouble(),
      paidAmount: (json['paidAmount'] as num?)?.toDouble(),
      balanceAmount: (json['balanceAmount'] as num?)?.toDouble(),
      currency: json['currency'] as String?,
      paymentStatus: json['paymentStatus'] as String?,
      paymentMethod: json['paymentMethod'] as String?,
      notes: json['notes'] as String?,
      terms: json['terms'] as String?,
      createdById: json['createdById'] as String?,
      createdByName: json['createdByName'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$RentalModelToJson(RentalModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'rentalNumber': instance.rentalNumber,
      'customerId': instance.customerId,
      'customerName': instance.customerName,
      'customerEmail': instance.customerEmail,
      'customerPhone': instance.customerPhone,
      'projectId': instance.projectId,
      'projectName': instance.projectName,
      'address': instance.address,
      'city': instance.city,
      'state': instance.state,
      'postalCode': instance.postalCode,
      'country': instance.country,
      'status': instance.status,
      'priority': instance.priority,
      'startDate': instance.startDate?.toIso8601String(),
      'endDate': instance.endDate?.toIso8601String(),
      'actualStartDate': instance.actualStartDate?.toIso8601String(),
      'actualEndDate': instance.actualEndDate?.toIso8601String(),
      'totalAmount': instance.totalAmount,
      'paidAmount': instance.paidAmount,
      'balanceAmount': instance.balanceAmount,
      'currency': instance.currency,
      'paymentStatus': instance.paymentStatus,
      'paymentMethod': instance.paymentMethod,
      'notes': instance.notes,
      'terms': instance.terms,
      'createdById': instance.createdById,
      'createdByName': instance.createdByName,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };
