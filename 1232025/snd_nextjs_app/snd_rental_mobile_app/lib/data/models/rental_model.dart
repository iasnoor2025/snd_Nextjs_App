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

  factory RentalModel.fromJson(Map<String, dynamic> json) {
    try {
      return RentalModel(
        id: json['id']?.toString() ?? '',
        rentalNumber: json['rental_number']?.toString() ?? '',
        customerId: json['customer_id']?.toString() ?? '',
        customerName: json['customer_name']?.toString() ?? 'Unknown Customer',
        customerEmail: json['customer_email']?.toString() ?? '',
        customerPhone: json['customer_phone']?.toString() ?? '',
        projectId: json['project_id']?.toString(),
        projectName: json['project_name'] as String?,
        address: json['address'] as String?,
        city: json['city'] as String?,
        state: json['state'] as String?,
        postalCode: json['postal_code'] as String?,
        country: json['country'] as String?,
        status: json['status']?.toString() ?? 'pending',
        priority: json['priority']?.toString(),
        startDate: json['start_date'] != null ? DateTime.parse(json['start_date'].toString()) : null,
        endDate: json['end_date'] != null ? DateTime.parse(json['end_date'].toString()) : null,
        actualStartDate: json['actual_start_date'] != null ? DateTime.parse(json['actual_start_date'].toString()) : null,
        actualEndDate: json['actual_end_date'] != null ? DateTime.parse(json['actual_end_date'].toString()) : null,
        totalAmount: json['total_amount'] != null ? (json['total_amount'] as num).toDouble() : null,
        paidAmount: json['paid_amount'] != null ? (json['paid_amount'] as num).toDouble() : null,
        balanceAmount: json['balance_amount'] != null ? (json['balance_amount'] as num).toDouble() : null,
        currency: json['currency'] as String?,
        paymentStatus: json['payment_status'] as String?,
        paymentMethod: json['payment_method'] as String?,
        notes: json['notes'] as String?,
        terms: json['terms'] as String?,
        createdById: json['created_by_id'] as String?,
        createdByName: json['created_by_name'] as String?,
        createdAt: DateTime.parse(json['created_at'].toString()),
        updatedAt: DateTime.parse(json['updated_at'].toString()),
      );
    } catch (e) {
      print('Error parsing rental JSON: $e');
      print('JSON data: $json');
      rethrow;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'rental_number': rentalNumber,
      'customer_id': customerId,
      'customer_name': customerName,
      'customer_email': customerEmail,
      'customer_phone': customerPhone,
      'project_id': projectId,
      'project_name': projectName,
      'address': address,
      'city': city,
      'state': state,
      'postal_code': postalCode,
      'country': country,
      'status': status,
      'priority': priority,
      'start_date': startDate?.toIso8601String(),
      'end_date': endDate?.toIso8601String(),
      'actual_start_date': actualStartDate?.toIso8601String(),
      'actual_end_date': actualEndDate?.toIso8601String(),
      'total_amount': totalAmount,
      'paid_amount': paidAmount,
      'balance_amount': balanceAmount,
      'currency': currency,
      'payment_status': paymentStatus,
      'payment_method': paymentMethod,
      'notes': notes,
      'terms': terms,
      'created_by_id': createdById,
      'created_by_name': createdByName,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

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
