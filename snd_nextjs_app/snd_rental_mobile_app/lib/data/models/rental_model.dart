import 'package:json_annotation/json_annotation.dart';

part 'rental_model.g.dart';

@JsonSerializable()
class RentalModel {
  final String id;
  final String rentalNumber;
  final String customerId;
  final String customerName;
  final String customerEmail;
  final String customerPhone;
  final String? projectId;
  final String? projectName;
  final String? address;
  final String? city;
  final String? state;
  final String? postalCode;
  final String? country;
  final String status;
  final String? priority;
  final DateTime? startDate;
  final DateTime? endDate;
  final DateTime? actualStartDate;
  final DateTime? actualEndDate;
  final double? totalAmount;
  final double? paidAmount;
  final double? balanceAmount;
  final String? currency;
  final String? paymentStatus;
  final String? paymentMethod;
  final String? notes;
  final String? terms;
  final String? createdById;
  final String? createdByName;
  final DateTime createdAt;
  final DateTime updatedAt;

  const RentalModel({
    required this.id,
    required this.rentalNumber,
    required this.customerId,
    required this.customerName,
    required this.customerEmail,
    required this.customerPhone,
    this.projectId,
    this.projectName,
    this.address,
    this.city,
    this.state,
    this.postalCode,
    this.country,
    required this.status,
    this.priority,
    this.startDate,
    this.endDate,
    this.actualStartDate,
    this.actualEndDate,
    this.totalAmount,
    this.paidAmount,
    this.balanceAmount,
    this.currency,
    this.paymentStatus,
    this.paymentMethod,
    this.notes,
    this.terms,
    this.createdById,
    this.createdByName,
    required this.createdAt,
    required this.updatedAt,
  });

  factory RentalModel.fromJson(Map<String, dynamic> json) => _$RentalModelFromJson(json);
  Map<String, dynamic> toJson() => _$RentalModelToJson(this);

  bool get isPending => status == 'pending';
  bool get isActive => status == 'active';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';

  bool get isHighPriority => priority == 'high';
  bool get isMediumPriority => priority == 'medium';
  bool get isLowPriority => priority == 'low';

  bool get isFullyPaid => paymentStatus == 'paid';
  bool get isPartiallyPaid => paymentStatus == 'partial';
  bool get isUnpaid => paymentStatus == 'unpaid';

  int? get durationInDays {
    if (startDate == null || endDate == null) return null;
    return endDate!.difference(startDate!).inDays;
  }

  int? get actualDurationInDays {
    if (actualStartDate == null || actualEndDate == null) return null;
    return actualEndDate!.difference(actualStartDate!).inDays;
  }

  bool get isOverdue {
    if (endDate == null) return false;
    return DateTime.now().isAfter(endDate!) && !isCompleted;
  }

  int? get daysUntilEnd {
    if (endDate == null) return null;
    return endDate!.difference(DateTime.now()).inDays;
  }

  double get paymentProgress {
    if (totalAmount == null || totalAmount == 0) return 0.0;
    return (paidAmount ?? 0.0) / totalAmount!;
  }

  String get displayName => 'Rental #$rentalNumber - $customerName';
  String get fullAddress => [address, city, state, postalCode, country]
      .where((element) => element != null && element.isNotEmpty)
      .join(', ');

  RentalModel copyWith({
    String? id,
    String? rentalNumber,
    String? customerId,
    String? customerName,
    String? customerEmail,
    String? customerPhone,
    String? projectId,
    String? projectName,
    String? address,
    String? city,
    String? state,
    String? postalCode,
    String? country,
    String? status,
    String? priority,
    DateTime? startDate,
    DateTime? endDate,
    DateTime? actualStartDate,
    DateTime? actualEndDate,
    double? totalAmount,
    double? paidAmount,
    double? balanceAmount,
    String? currency,
    String? paymentStatus,
    String? paymentMethod,
    String? notes,
    String? terms,
    String? createdById,
    String? createdByName,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return RentalModel(
      id: id ?? this.id,
      rentalNumber: rentalNumber ?? this.rentalNumber,
      customerId: customerId ?? this.customerId,
      customerName: customerName ?? this.customerName,
      customerEmail: customerEmail ?? this.customerEmail,
      customerPhone: customerPhone ?? this.customerPhone,
      projectId: projectId ?? this.projectId,
      projectName: projectName ?? this.projectName,
      address: address ?? this.address,
      city: city ?? this.city,
      state: state ?? this.state,
      postalCode: postalCode ?? this.postalCode,
      country: country ?? this.country,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      actualStartDate: actualStartDate ?? this.actualStartDate,
      actualEndDate: actualEndDate ?? this.actualEndDate,
      totalAmount: totalAmount ?? this.totalAmount,
      paidAmount: paidAmount ?? this.paidAmount,
      balanceAmount: balanceAmount ?? this.balanceAmount,
      currency: currency ?? this.currency,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      notes: notes ?? this.notes,
      terms: terms ?? this.terms,
      createdById: createdById ?? this.createdById,
      createdByName: createdByName ?? this.createdByName,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
