class SafetyIncidentModel {
  final int id;
  final String incidentNumber;
  final String title;
  final String description;
  final String severity; // low, medium, high, critical
  final String status; // open, investigating, resolved, closed
  final String location;
  final String? projectName;
  final int? employeeId;
  final String? employeeName;
  final String incidentDate;
  final String reportedDate;
  final String? reportedBy;
  final String? assignedTo;
  final String? assignedDate;
  final String? resolvedDate;
  final String? resolution;
  final double? estimatedCost;
  final double? actualCost;
  final List<String>? photos;
  final String? notes;

  const SafetyIncidentModel({
    required this.id,
    required this.incidentNumber,
    required this.title,
    required this.description,
    required this.severity,
    required this.status,
    required this.location,
    this.projectName,
    this.employeeId,
    this.employeeName,
    required this.incidentDate,
    required this.reportedDate,
    this.reportedBy,
    this.assignedTo,
    this.assignedDate,
    this.resolvedDate,
    this.resolution,
    this.estimatedCost,
    this.actualCost,
    this.photos,
    this.notes,
  });

  factory SafetyIncidentModel.fromJson(Map<String, dynamic> json) {
    return SafetyIncidentModel(
      id: _parseInt(json['id']),
      incidentNumber: _parseString(json['incident_number']) ?? '',
      title: _parseString(json['title']) ?? '',
      description: _parseString(json['description']) ?? '',
      severity: _parseString(json['severity']) ?? 'low',
      status: _parseString(json['status']) ?? 'open',
      location: _parseString(json['location']) ?? '',
      projectName: _parseString(json['project_name']),
      employeeId: _parseInt(json['employee_id']),
      employeeName: _parseString(json['employee_name']),
      incidentDate: _parseString(json['incident_date']) ?? '',
      reportedDate: _parseString(json['reported_date']) ?? '',
      reportedBy: _parseString(json['reported_by']),
      assignedTo: _parseString(json['assigned_to']),
      assignedDate: _parseString(json['assigned_date']),
      resolvedDate: _parseString(json['resolved_date']),
      resolution: _parseString(json['resolution']),
      estimatedCost: _parseDouble(json['estimated_cost']),
      actualCost: _parseDouble(json['actual_cost']),
      photos: (json['photos'] as List<dynamic>?)
          ?.map((photo) => photo.toString())
          .toList(),
      notes: _parseString(json['notes']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'incident_number': incidentNumber,
      'title': title,
      'description': description,
      'severity': severity,
      'status': status,
      'location': location,
      'project_name': projectName,
      'employee_id': employeeId,
      'employee_name': employeeName,
      'incident_date': incidentDate,
      'reported_date': reportedDate,
      'reported_by': reportedBy,
      'assigned_to': assignedTo,
      'assigned_date': assignedDate,
      'resolved_date': resolvedDate,
      'resolution': resolution,
      'estimated_cost': estimatedCost,
      'actual_cost': actualCost,
      'photos': photos,
      'notes': notes,
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

  bool get isOpen => status == 'open';
  bool get isInvestigating => status == 'investigating';
  bool get isResolved => status == 'resolved';
  bool get isClosed => status == 'closed';

  bool get isLow => severity == 'low';
  bool get isMedium => severity == 'medium';
  bool get isHigh => severity == 'high';
  bool get isCritical => severity == 'critical';

  SafetyIncidentModel copyWith({
    int? id,
    String? incidentNumber,
    String? title,
    String? description,
    String? severity,
    String? status,
    String? location,
    String? projectName,
    int? employeeId,
    String? employeeName,
    String? incidentDate,
    String? reportedDate,
    String? reportedBy,
    String? assignedTo,
    String? assignedDate,
    String? resolvedDate,
    String? resolution,
    double? estimatedCost,
    double? actualCost,
    List<String>? photos,
    String? notes,
  }) {
    return SafetyIncidentModel(
      id: id ?? this.id,
      incidentNumber: incidentNumber ?? this.incidentNumber,
      title: title ?? this.title,
      description: description ?? this.description,
      severity: severity ?? this.severity,
      status: status ?? this.status,
      location: location ?? this.location,
      projectName: projectName ?? this.projectName,
      employeeId: employeeId ?? this.employeeId,
      employeeName: employeeName ?? this.employeeName,
      incidentDate: incidentDate ?? this.incidentDate,
      reportedDate: reportedDate ?? this.reportedDate,
      reportedBy: reportedBy ?? this.reportedBy,
      assignedTo: assignedTo ?? this.assignedTo,
      assignedDate: assignedDate ?? this.assignedDate,
      resolvedDate: resolvedDate ?? this.resolvedDate,
      resolution: resolution ?? this.resolution,
      estimatedCost: estimatedCost ?? this.estimatedCost,
      actualCost: actualCost ?? this.actualCost,
      photos: photos ?? this.photos,
      notes: notes ?? this.notes,
    );
  }
}
