class QuotationModel {
  final int id;
  final String quotationNumber;
  final int customerId;
  final String customerName;
  final String customerEmail;
  final String customerPhone;
  final String projectName;
  final String description;
  final double totalAmount;
  final String currency;
  final String status; // draft, sent, approved, rejected, expired
  final String validUntil;
  final String createdAt;
  final String? sentDate;
  final String? approvedDate;
  final String? rejectedDate;
  final String? notes;
  final List<QuotationItemModel> items;

  const QuotationModel({
    required this.id,
    required this.quotationNumber,
    required this.customerId,
    required this.customerName,
    required this.customerEmail,
    required this.customerPhone,
    required this.projectName,
    required this.description,
    required this.totalAmount,
    required this.currency,
    required this.status,
    required this.validUntil,
    required this.createdAt,
    this.sentDate,
    this.approvedDate,
    this.rejectedDate,
    this.notes,
    required this.items,
  });

  factory QuotationModel.fromJson(Map<String, dynamic> json) {
    return QuotationModel(
      id: _parseInt(json['id']),
      quotationNumber: _parseString(json['quotation_number']) ?? '',
      customerId: _parseInt(json['customer_id']),
      customerName: _parseString(json['customer_name']) ?? '',
      customerEmail: _parseString(json['customer_email']) ?? '',
      customerPhone: _parseString(json['customer_phone']) ?? '',
      projectName: _parseString(json['project_name']) ?? '',
      description: _parseString(json['description']) ?? '',
      totalAmount: _parseDouble(json['total_amount']) ?? 0.0,
      currency: _parseString(json['currency']) ?? 'SAR',
      status: _parseString(json['status']) ?? 'draft',
      validUntil: _parseString(json['valid_until']) ?? '',
      createdAt: _parseString(json['created_at']) ?? '',
      sentDate: _parseString(json['sent_date']),
      approvedDate: _parseString(json['approved_date']),
      rejectedDate: _parseString(json['rejected_date']),
      notes: _parseString(json['notes']),
      items: (json['items'] as List<dynamic>?)
          ?.map((item) => QuotationItemModel.fromJson(item))
          .toList() ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'quotation_number': quotationNumber,
      'customer_id': customerId,
      'customer_name': customerName,
      'customer_email': customerEmail,
      'customer_phone': customerPhone,
      'project_name': projectName,
      'description': description,
      'total_amount': totalAmount,
      'currency': currency,
      'status': status,
      'valid_until': validUntil,
      'created_at': createdAt,
      'sent_date': sentDate,
      'approved_date': approvedDate,
      'rejected_date': rejectedDate,
      'notes': notes,
      'items': items.map((item) => item.toJson()).toList(),
    };
  }

  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    if (value is double) return value.toInt();
    return 0;
  }

  static double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }

  static String? _parseString(dynamic value) {
    if (value == null) return null;
    if (value is String) return value;
    return value.toString();
  }

  bool get isDraft => status == 'draft';
  bool get isSent => status == 'sent';
  bool get isApproved => status == 'approved';
  bool get isRejected => status == 'rejected';
  bool get isExpired => status == 'expired';

  QuotationModel copyWith({
    int? id,
    String? quotationNumber,
    int? customerId,
    String? customerName,
    String? customerEmail,
    String? customerPhone,
    String? projectName,
    String? description,
    double? totalAmount,
    String? currency,
    String? status,
    String? validUntil,
    String? createdAt,
    String? sentDate,
    String? approvedDate,
    String? rejectedDate,
    String? notes,
    List<QuotationItemModel>? items,
  }) {
    return QuotationModel(
      id: id ?? this.id,
      quotationNumber: quotationNumber ?? this.quotationNumber,
      customerId: customerId ?? this.customerId,
      customerName: customerName ?? this.customerName,
      customerEmail: customerEmail ?? this.customerEmail,
      customerPhone: customerPhone ?? this.customerPhone,
      projectName: projectName ?? this.projectName,
      description: description ?? this.description,
      totalAmount: totalAmount ?? this.totalAmount,
      currency: currency ?? this.currency,
      status: status ?? this.status,
      validUntil: validUntil ?? this.validUntil,
      createdAt: createdAt ?? this.createdAt,
      sentDate: sentDate ?? this.sentDate,
      approvedDate: approvedDate ?? this.approvedDate,
      rejectedDate: rejectedDate ?? this.rejectedDate,
      notes: notes ?? this.notes,
      items: items ?? this.items,
    );
  }
}

class QuotationItemModel {
  final int id;
  final String itemName;
  final String description;
  final int quantity;
  final double unitPrice;
  final double totalPrice;
  final String? category;

  const QuotationItemModel({
    required this.id,
    required this.itemName,
    required this.description,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    this.category,
  });

  factory QuotationItemModel.fromJson(Map<String, dynamic> json) {
    return QuotationItemModel(
      id: _parseInt(json['id']),
      itemName: _parseString(json['item_name']) ?? '',
      description: _parseString(json['description']) ?? '',
      quantity: _parseInt(json['quantity']),
      unitPrice: _parseDouble(json['unit_price']) ?? 0.0,
      totalPrice: _parseDouble(json['total_price']) ?? 0.0,
      category: _parseString(json['category']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'item_name': itemName,
      'description': description,
      'quantity': quantity,
      'unit_price': unitPrice,
      'total_price': totalPrice,
      'category': category,
    };
  }

  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    if (value is double) return value.toInt();
    return 0;
  }

  static double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }

  static String? _parseString(dynamic value) {
    if (value == null) return null;
    if (value is String) return value;
    return value.toString();
  }
}
