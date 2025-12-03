class DocumentModel {
  final int id;
  final String fileName;
  final String filePath;
  final String fileType;
  final int fileSize;
  final String? description;
  final int employeeId;
  final String? uploadedBy;
  final DateTime uploadedAt;
  final DateTime? updatedAt;
  final String status;
  final String? category;

  const DocumentModel({
    required this.id,
    required this.fileName,
    required this.filePath,
    required this.fileType,
    required this.fileSize,
    this.description,
    required this.employeeId,
    this.uploadedBy,
    required this.uploadedAt,
    this.updatedAt,
    required this.status,
    this.category,
  });

  factory DocumentModel.fromJson(Map<String, dynamic> json) {
    return DocumentModel(
      id: _parseInt(json['id']),
      fileName: json['file_name'] as String? ?? '',
      filePath: json['file_path'] as String? ?? '',
      fileType: json['file_type'] as String? ?? '',
      fileSize: _parseInt(json['file_size']),
      description: json['description'] as String?,
      employeeId: _parseInt(json['employee_id']),
      uploadedBy: json['uploaded_by'] as String?,
      uploadedAt: DateTime.tryParse(json['uploaded_at'] as String? ?? '') ?? DateTime.now(),
      updatedAt: json['updated_at'] != null 
          ? DateTime.tryParse(json['updated_at'] as String) 
          : null,
      status: json['status'] as String? ?? 'active',
      category: json['category'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'file_name': fileName,
      'file_path': filePath,
      'file_type': fileType,
      'file_size': fileSize,
      'description': description,
      'employee_id': employeeId,
      'uploaded_by': uploadedBy,
      'uploaded_at': uploadedAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'status': status,
      'category': category,
    };
  }

  String get displayName => fileName;
  String get fileSizeFormatted => _formatFileSize(fileSize);
  String get fileExtension => fileName.split('.').last.toLowerCase();
  
  bool get isImage => ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].contains(fileExtension);
  bool get isPdf => fileExtension == 'pdf';
  bool get isDocument => ['doc', 'docx', 'txt', 'rtf'].contains(fileExtension);
  bool get isSpreadsheet => ['xls', 'xlsx', 'csv'].contains(fileExtension);

  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    if (value is double) return value.toInt();
    return 0;
  }

  static String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }
}
