import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class EquipmentDocumentModel {
  final int id;
  final int equipmentId;
  final String documentType;
  final String filePath;
  final String fileName;
  final int? fileSize;
  final String? mimeType;
  final String? description;
  final DateTime createdAt;
  final DateTime updatedAt;

  const EquipmentDocumentModel({
    required this.id,
    required this.equipmentId,
    required this.documentType,
    required this.filePath,
    required this.fileName,
    this.fileSize,
    this.mimeType,
    this.description,
    required this.createdAt,
    required this.updatedAt,
  });

  factory EquipmentDocumentModel.fromJson(Map<String, dynamic> json, {int? equipmentId}) {
    try {
      return EquipmentDocumentModel(
        id: json['id']?.toString() != null ? int.tryParse(json['id'].toString()) ?? 0 : 0,
        equipmentId: equipmentId ?? (json['equipmentId']?.toString() != null ? int.tryParse(json['equipmentId'].toString()) ?? 0 : 0),
        documentType: json['documentType']?.toString() ?? '',
        filePath: json['filePath']?.toString() ?? '',
        fileName: json['fileName']?.toString() ?? '',
        fileSize: json['fileSize']?.toString() != null ? int.tryParse(json['fileSize'].toString()) : null,
        mimeType: json['mimeType']?.toString(),
        description: json['description']?.toString(),
        createdAt: _parseDateTime(json['createdAt']),
        updatedAt: _parseDateTime(json['updatedAt']),
      );
    } catch (e) {
      print('Error parsing EquipmentDocumentModel: $e');
      print('JSON data: $json');
      rethrow;
    }
  }

  static DateTime _parseDateTime(dynamic value) {
    if (value == null) return DateTime.now();
    if (value is DateTime) return value;
    if (value is String) {
      try {
        return DateTime.parse(value);
      } catch (e) {
        print('Error parsing date string: $value');
        return DateTime.now();
      }
    }
    return DateTime.now();
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'equipmentId': equipmentId,
      'documentType': documentType,
      'filePath': filePath,
      'fileName': fileName,
      'fileSize': fileSize,
      'mimeType': mimeType,
      'description': description,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  EquipmentDocumentModel copyWith({
    int? id,
    int? equipmentId,
    String? documentType,
    String? filePath,
    String? fileName,
    int? fileSize,
    String? mimeType,
    String? description,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return EquipmentDocumentModel(
      id: id ?? this.id,
      equipmentId: equipmentId ?? this.equipmentId,
      documentType: documentType ?? this.documentType,
      filePath: filePath ?? this.filePath,
      fileName: fileName ?? this.fileName,
      fileSize: fileSize ?? this.fileSize,
      mimeType: mimeType ?? this.mimeType,
      description: description ?? this.description,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  String get displayName => fileName;
  String get displayType => documentType.toUpperCase();
  String get displaySize {
    if (fileSize == null) return 'N/A';
    if (fileSize! < 1024) return '$fileSize B';
    if (fileSize! < 1024 * 1024) return '${(fileSize! / 1024).toStringAsFixed(1)} KB';
    return '${(fileSize! / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
  String get displayDescription => description ?? 'No description';
  String get displayCreatedAt => DateFormat('MMM dd, yyyy').format(createdAt);
  String get displayUpdatedAt => DateFormat('MMM dd, yyyy').format(updatedAt);
}
