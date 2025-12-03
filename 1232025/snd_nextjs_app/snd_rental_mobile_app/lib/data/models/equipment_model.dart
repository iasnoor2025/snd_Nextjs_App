class EquipmentModel {
  final String id;
  final String name;
  final String? description;
  final String? status;
  final String? modelNumber;
  final String? manufacturer;
  final String? dailyRate;
  final String? weeklyRate;
  final String? monthlyRate;
  final String? serialNumber;
  final String? chassisNumber;
  final String? doorNumber;
  final String? erpnextId;
  final String? istimara;
  final String? istimaraExpiryDate;
  final String? insurance;
  final String? insuranceExpiryDate;
  final String? tuvCard;
  final String? tuvCardExpiryDate;
  final String? categoryId;
  final String? assignedTo;

  const EquipmentModel({
    required this.id,
    required this.name,
    this.description,
    this.status,
    this.modelNumber,
    this.manufacturer,
    this.dailyRate,
    this.weeklyRate,
    this.monthlyRate,
    this.serialNumber,
    this.chassisNumber,
    this.doorNumber,
    this.erpnextId,
    this.istimara,
    this.istimaraExpiryDate,
    this.insurance,
    this.insuranceExpiryDate,
    this.tuvCard,
    this.tuvCardExpiryDate,
    this.categoryId,
    this.assignedTo,
  });

  factory EquipmentModel.fromJson(Map<String, dynamic> json) {
    try {
      return EquipmentModel(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? 'Unknown Equipment',
        description: json['description']?.toString(),
        status: json['status']?.toString(),
        modelNumber: json['model_number']?.toString(),
        manufacturer: json['manufacturer']?.toString(),
        dailyRate: json['daily_rate']?.toString(),
        weeklyRate: json['weekly_rate']?.toString(),
        monthlyRate: json['monthly_rate']?.toString(),
        serialNumber: json['serial_number']?.toString(),
        chassisNumber: json['chassis_number']?.toString(),
        doorNumber: json['door_number']?.toString(),
        erpnextId: json['erpnext_id']?.toString(),
        istimara: json['istimara']?.toString(),
        istimaraExpiryDate: json['istimara_expiry_date']?.toString(),
        insurance: json['insurance']?.toString(),
        insuranceExpiryDate: json['insurance_expiry_date']?.toString(),
        tuvCard: json['tuv_card']?.toString(),
        tuvCardExpiryDate: json['tuv_card_expiry_date']?.toString(),
        categoryId: json['category_id']?.toString(),
        assignedTo: json['assigned_to']?.toString(),
      );
    } catch (e) {
      print('Error parsing equipment JSON: $e');
      print('JSON data: $json');
      rethrow;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'status': status,
      'model_number': modelNumber,
      'manufacturer': manufacturer,
      'daily_rate': dailyRate,
      'weekly_rate': weeklyRate,
      'monthly_rate': monthlyRate,
      'serial_number': serialNumber,
      'chassis_number': chassisNumber,
      'door_number': doorNumber,
      'erpnext_id': erpnextId,
      'istimara': istimara,
      'istimara_expiry_date': istimaraExpiryDate,
      'insurance': insurance,
      'insurance_expiry_date': insuranceExpiryDate,
      'tuv_card': tuvCard,
      'tuv_card_expiry_date': tuvCardExpiryDate,
      'category_id': categoryId,
      'assigned_to': assignedTo,
    };
  }

  bool get isAvailable => status == 'available';
  bool get isInUse => status == 'in_use';
  bool get isMaintenance => status == 'maintenance';
  bool get isRetired => status == 'retired';

  String get displayName => name;
  String get displayStatus => status?.toUpperCase() ?? 'UNKNOWN';
  String get displayManufacturer => manufacturer ?? 'Not Set';
  String get displayModel => modelNumber ?? 'Not Set';
  String get displaySerialNumber => serialNumber ?? 'Not Set';
  String get displayChassisNumber => chassisNumber ?? 'Not Set';
  String get displayDoorNumber => doorNumber ?? 'Not Set';
  String get displayErpnextId => erpnextId ?? 'Not Set';
  String get displayDailyRate => dailyRate ?? 'Not Set';
  String get displayWeeklyRate => weeklyRate ?? 'Not Set';
  String get displayMonthlyRate => monthlyRate ?? 'Not Set';
  String get displayIstimara => istimara ?? 'Not Set';
  String get displayIstimaraExpiry => istimaraExpiryDate ?? 'Not Set';
  String get displayInsurance => insurance ?? 'Not Set';
  String get displayInsuranceExpiry => insuranceExpiryDate ?? 'Not Set';
  String get displayTuvCard => tuvCard ?? 'Not Set';
  String get displayTuvCardExpiry => tuvCardExpiryDate ?? 'Not Set';
  String get displayAssignedTo => assignedTo ?? 'Not Assigned';
  bool get isAssigned => assignedTo != null && assignedTo!.isNotEmpty;
  String get fullIdentifier => '$name - $serialNumber';

  EquipmentModel copyWith({
    String? id,
    String? name,
    String? description,
    String? status,
    String? modelNumber,
    String? manufacturer,
    String? dailyRate,
    String? weeklyRate,
    String? monthlyRate,
    String? serialNumber,
    String? chassisNumber,
    String? doorNumber,
    String? erpnextId,
    String? istimara,
    String? istimaraExpiryDate,
    String? insurance,
    String? insuranceExpiryDate,
    String? tuvCard,
    String? tuvCardExpiryDate,
    String? categoryId,
    String? assignedTo,
  }) {
    return EquipmentModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      status: status ?? this.status,
      modelNumber: modelNumber ?? this.modelNumber,
      manufacturer: manufacturer ?? this.manufacturer,
      dailyRate: dailyRate ?? this.dailyRate,
      weeklyRate: weeklyRate ?? this.weeklyRate,
      monthlyRate: monthlyRate ?? this.monthlyRate,
      serialNumber: serialNumber ?? this.serialNumber,
      chassisNumber: chassisNumber ?? this.chassisNumber,
      doorNumber: doorNumber ?? this.doorNumber,
      erpnextId: erpnextId ?? this.erpnextId,
      istimara: istimara ?? this.istimara,
      istimaraExpiryDate: istimaraExpiryDate ?? this.istimaraExpiryDate,
      insurance: insurance ?? this.insurance,
      insuranceExpiryDate: insuranceExpiryDate ?? this.insuranceExpiryDate,
      tuvCard: tuvCard ?? this.tuvCard,
      tuvCardExpiryDate: tuvCardExpiryDate ?? this.tuvCardExpiryDate,
      categoryId: categoryId ?? this.categoryId,
      assignedTo: assignedTo ?? this.assignedTo,
    );
  }
}
