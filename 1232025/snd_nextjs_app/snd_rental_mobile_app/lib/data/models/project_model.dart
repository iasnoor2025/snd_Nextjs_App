class ProjectModel {
  final String id;
  final String name;
  final String? description;
  final String? clientName;
  final String? clientContact;
  final String? clientEmail;
  final String? clientPhone;
  final String? address;
  final String? city;
  final String? state;
  final String? postalCode;
  final String? country;
  final String? status;
  final String? priority;
  final DateTime? startDate;
  final DateTime? endDate;
  final DateTime? actualStartDate;
  final DateTime? actualEndDate;
  final double? budget;
  final double? actualCost;
  final String? currency;
  final String? projectManagerId;
  final String? projectManagerName;
  final List<String>? teamMemberIds;
  final List<String>? teamMemberNames;
  final List<String>? equipmentIds;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  const ProjectModel({
    required this.id,
    required this.name,
    this.description,
    this.clientName,
    this.clientContact,
    this.clientEmail,
    this.clientPhone,
    this.address,
    this.city,
    this.state,
    this.postalCode,
    this.country,
    this.status,
    this.priority,
    this.startDate,
    this.endDate,
    this.actualStartDate,
    this.actualEndDate,
    this.budget,
    this.actualCost,
    this.currency,
    this.projectManagerId,
    this.projectManagerName,
    this.teamMemberIds,
    this.teamMemberNames,
    this.equipmentIds,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ProjectModel.fromJson(Map<String, dynamic> json) {
    try {
      return ProjectModel(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? 'Unknown Project',
        description: json['description']?.toString(),
        clientName: json['client_name']?.toString(),
        clientContact: json['client_contact']?.toString(),
        clientEmail: json['client_email']?.toString(),
        clientPhone: json['client_phone']?.toString(),
        address: json['address']?.toString(),
        city: json['city'] as String?,
        state: json['state'] as String?,
        postalCode: json['postal_code'] as String?,
        country: json['country'] as String?,
        status: json['status'] as String?,
        priority: json['priority'] as String?,
        startDate: json['start_date'] != null ? DateTime.parse(json['start_date'].toString()) : null,
        endDate: json['end_date'] != null ? DateTime.parse(json['end_date'].toString()) : null,
        actualStartDate: json['actual_start_date'] != null ? DateTime.parse(json['actual_start_date'].toString()) : null,
        actualEndDate: json['actual_end_date'] != null ? DateTime.parse(json['actual_end_date'].toString()) : null,
        budget: json['budget'] != null ? (json['budget'] as num).toDouble() : null,
        actualCost: json['actual_cost'] != null ? (json['actual_cost'] as num).toDouble() : null,
        currency: json['currency'] as String?,
        projectManagerId: json['project_manager_id'] as String?,
        projectManagerName: json['project_manager_name'] as String?,
        teamMemberIds: json['team_member_ids'] != null ? List<String>.from(json['team_member_ids']) : null,
        teamMemberNames: json['team_member_names'] != null ? List<String>.from(json['team_member_names']) : null,
        equipmentIds: json['equipment_ids'] != null ? List<String>.from(json['equipment_ids']) : null,
        notes: json['notes'] as String?,
        createdAt: DateTime.parse(json['created_at'].toString()),
        updatedAt: DateTime.parse(json['updated_at'].toString()),
      );
    } catch (e) {
      print('Error parsing project JSON: $e');
      print('JSON data: $json');
      rethrow;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'client_name': clientName,
      'client_contact': clientContact,
      'client_email': clientEmail,
      'client_phone': clientPhone,
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
      'budget': budget,
      'actual_cost': actualCost,
      'currency': currency,
      'project_manager_id': projectManagerId,
      'project_manager_name': projectManagerName,
      'team_member_ids': teamMemberIds,
      'team_member_names': teamMemberNames,
      'equipment_ids': equipmentIds,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  bool get isActive => status == 'active';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';
  bool get isOnHold => status == 'on_hold';

  bool get isHighPriority => priority == 'high';
  bool get isMediumPriority => priority == 'medium';
  bool get isLowPriority => priority == 'low';

  int? get durationInDays {
    if (startDate == null || endDate == null) return null;
    return endDate!.difference(startDate!).inDays;
  }

  int? get actualDurationInDays {
    if (actualStartDate == null || actualEndDate == null) return null;
    return actualEndDate!.difference(actualStartDate!).inDays;
  }

  double? get budgetVariance {
    if (budget == null || actualCost == null) return null;
    return actualCost! - budget!;
  }

  double? get budgetVariancePercentage {
    if (budget == null || actualCost == null || budget == 0) return null;
    return ((actualCost! - budget!) / budget!) * 100;
  }

  bool get isOverBudget => budgetVariance != null && budgetVariance! > 0;

  ProjectModel copyWith({
    String? id,
    String? name,
    String? description,
    String? clientName,
    String? clientContact,
    String? clientEmail,
    String? clientPhone,
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
    double? budget,
    double? actualCost,
    String? currency,
    String? projectManagerId,
    String? projectManagerName,
    List<String>? teamMemberIds,
    List<String>? teamMemberNames,
    List<String>? equipmentIds,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ProjectModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      clientName: clientName ?? this.clientName,
      clientContact: clientContact ?? this.clientContact,
      clientEmail: clientEmail ?? this.clientEmail,
      clientPhone: clientPhone ?? this.clientPhone,
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
      budget: budget ?? this.budget,
      actualCost: actualCost ?? this.actualCost,
      currency: currency ?? this.currency,
      projectManagerId: projectManagerId ?? this.projectManagerId,
      projectManagerName: projectManagerName ?? this.projectManagerName,
      teamMemberIds: teamMemberIds ?? this.teamMemberIds,
      teamMemberNames: teamMemberNames ?? this.teamMemberNames,
      equipmentIds: equipmentIds ?? this.equipmentIds,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
