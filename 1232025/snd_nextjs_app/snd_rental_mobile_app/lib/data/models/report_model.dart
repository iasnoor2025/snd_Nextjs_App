class ReportModel {
  final int id;
  final String name;
  final String? description;
  final String type; // financial, employee, project, equipment, rental, timesheet
  final String format; // pdf, excel, csv
  final Map<String, dynamic>? parameters;
  final String? filters;
  final String status; // pending, generating, completed, failed
  final String? fileUrl;
  final String? fileName;
  final int? fileSize;
  final String? generatedBy;
  final String? generatedAt;
  final String? expiresAt;
  final String createdAt;
  final String? updatedAt;

  const ReportModel({
    required this.id,
    required this.name,
    this.description,
    required this.type,
    required this.format,
    this.parameters,
    this.filters,
    required this.status,
    this.fileUrl,
    this.fileName,
    this.fileSize,
    this.generatedBy,
    this.generatedAt,
    this.expiresAt,
    required this.createdAt,
    this.updatedAt,
  });

  factory ReportModel.fromJson(Map<String, dynamic> json) {
    return ReportModel(
      id: _parseInt(json['id']),
      name: _parseString(json['name']) ?? '',
      description: _parseString(json['description']),
      type: _parseString(json['type']) ?? '',
      format: _parseString(json['format']) ?? 'pdf',
      parameters: json['parameters'] as Map<String, dynamic>?,
      filters: _parseString(json['filters']),
      status: _parseString(json['status']) ?? 'pending',
      fileUrl: _parseString(json['file_url']),
      fileName: _parseString(json['file_name']),
      fileSize: _parseInt(json['file_size']),
      generatedBy: _parseString(json['generated_by']),
      generatedAt: _parseString(json['generated_at']),
      expiresAt: _parseString(json['expires_at']),
      createdAt: _parseString(json['created_at']) ?? '',
      updatedAt: _parseString(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'type': type,
      'format': format,
      'parameters': parameters,
      'filters': filters,
      'status': status,
      'file_url': fileUrl,
      'file_name': fileName,
      'file_size': fileSize,
      'generated_by': generatedBy,
      'generated_at': generatedAt,
      'expires_at': expiresAt,
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

  bool get isPending => status == 'pending';
  bool get isGenerating => status == 'generating';
  bool get isCompleted => status == 'completed';
  bool get isFailed => status == 'failed';

  bool get isPdf => format == 'pdf';
  bool get isExcel => format == 'excel';
  bool get isCsv => format == 'csv';

  String get fileSizeFormatted {
    if (fileSize == null) return 'Unknown';
    if (fileSize! < 1024) return '${fileSize!} B';
    if (fileSize! < 1024 * 1024) return '${(fileSize! / 1024).toStringAsFixed(1)} KB';
    return '${(fileSize! / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  ReportModel copyWith({
    int? id,
    String? name,
    String? description,
    String? type,
    String? format,
    Map<String, dynamic>? parameters,
    String? filters,
    String? status,
    String? fileUrl,
    String? fileName,
    int? fileSize,
    String? generatedBy,
    String? generatedAt,
    String? expiresAt,
    String? createdAt,
    String? updatedAt,
  }) {
    return ReportModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      type: type ?? this.type,
      format: format ?? this.format,
      parameters: parameters ?? this.parameters,
      filters: filters ?? this.filters,
      status: status ?? this.status,
      fileUrl: fileUrl ?? this.fileUrl,
      fileName: fileName ?? this.fileName,
      fileSize: fileSize ?? this.fileSize,
      generatedBy: generatedBy ?? this.generatedBy,
      generatedAt: generatedAt ?? this.generatedAt,
      expiresAt: expiresAt ?? this.expiresAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
