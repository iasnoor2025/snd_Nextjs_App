import 'package:flutter/material.dart';
import '../../widgets/ui/card.dart' as ui;
import '../../widgets/ui/badge.dart' as ui;
import '../../../core/theme/app_theme.dart';

class DocumentListPage extends StatefulWidget {
  final String? employeeId;
  final String? projectId;

  const DocumentListPage({
    super.key,
    this.employeeId,
    this.projectId,
  });

  @override
  State<DocumentListPage> createState() => _DocumentListPageState();
}

class _DocumentListPageState extends State<DocumentListPage> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDocuments();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadDocuments() async {
    // TODO: Load documents from provider
    // For now, we'll show placeholder data
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.employeeId != null 
            ? 'Employee Documents' 
            : 'All Documents'),
        backgroundColor: AppTheme.primary,
        foregroundColor: AppTheme.primaryForeground,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => AddDocumentPage(
                    employeeId: widget.employeeId,
                    projectId: widget.projectId,
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Section
          Container(
            padding: const EdgeInsets.all(AppTheme.spacingMd),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search documents...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {});
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radius),
                ),
              ),
              onChanged: (value) {
                setState(() {});
              },
            ),
          ),
          
          // Documents List
          Expanded(
            child: _buildDocumentsList(),
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentsList() {
    // TODO: Replace with actual data from provider
    final documents = _getPlaceholderDocuments();
    
    if (documents.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.folder_open,
              size: 64,
              color: AppTheme.mutedForeground,
            ),
            const SizedBox(height: AppTheme.spacingMd),
            Text(
              'No documents found',
              style: const TextStyle(
                fontSize: AppTheme.fontSizeLg,
                fontWeight: AppTheme.fontWeightBold,
                color: AppTheme.mutedForeground,
              ),
            ),
            const SizedBox(height: AppTheme.spacingSm),
            Text(
              'Upload your first document to get started',
              style: const TextStyle(
                fontSize: AppTheme.fontSizeSm,
                color: AppTheme.mutedForeground,
              ),
            ),
          ],
        ),
      );
    }
    
    return ListView.builder(
      padding: const EdgeInsets.all(AppTheme.spacingMd),
      itemCount: documents.length,
      itemBuilder: (context, index) {
        final document = documents[index];
        return DocumentCard(
          document: document,
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => DocumentDetailsPage(
                  document: document,
                ),
              ),
            );
          },
        );
      },
    );
  }

  List<DocumentModel> _getPlaceholderDocuments() {
    return [
      DocumentModel(
        id: '1',
        fileName: 'Employee Contract.pdf',
        fileType: 'pdf',
        fileSize: 1024000,
        uploadedBy: 'John Doe',
        uploadedAt: DateTime.now().subtract(const Duration(days: 5)),
        category: 'Contract',
        status: 'active',
        url: 'https://example.com/contract.pdf',
      ),
      DocumentModel(
        id: '2',
        fileName: 'ID Copy.jpg',
        fileType: 'jpg',
        fileSize: 512000,
        uploadedBy: 'Jane Smith',
        uploadedAt: DateTime.now().subtract(const Duration(days: 3)),
        category: 'Identity',
        status: 'active',
        url: 'https://example.com/id.jpg',
      ),
      DocumentModel(
        id: '3',
        fileName: 'Training Certificate.pdf',
        fileType: 'pdf',
        fileSize: 256000,
        uploadedBy: 'Mike Johnson',
        uploadedAt: DateTime.now().subtract(const Duration(days: 1)),
        category: 'Certificate',
        status: 'pending',
        url: 'https://example.com/certificate.pdf',
      ),
    ];
  }
}

class DocumentCard extends StatelessWidget {
  final DocumentModel document;
  final VoidCallback? onTap;

  const DocumentCard({
    super.key,
    required this.document,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ui.UICard.default_(
      margin: const EdgeInsets.only(bottom: AppTheme.spacingSm),
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: _getFileTypeColor(document.fileType).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppTheme.radius),
            ),
            child: Icon(
              _getFileTypeIcon(document.fileType),
              color: _getFileTypeColor(document.fileType),
              size: 24,
            ),
          ),
          const SizedBox(width: AppTheme.spacingMd),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  document.fileName,
                  style: TextStyle(
                    fontSize: AppTheme.fontSizeSm,
                    fontWeight: AppTheme.fontWeightMedium,
                    color: AppTheme.foreground,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: AppTheme.spacingXs),
                Row(
                  children: [
                    Text(
                      document.category,
                      style: const TextStyle(
                        fontSize: AppTheme.fontSizeSm,
                        color: AppTheme.mutedForeground,
                      ),
                    ),
                    const SizedBox(width: AppTheme.spacingSm),
                    Text(
                      '•',
                      style: const TextStyle(
                        fontSize: AppTheme.fontSizeSm,
                        color: AppTheme.mutedForeground,
                      ),
                    ),
                    const SizedBox(width: AppTheme.spacingSm),
                    Text(
                      _formatFileSize(document.fileSize),
                      style: const TextStyle(
                        fontSize: AppTheme.fontSizeSm,
                        color: AppTheme.mutedForeground,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppTheme.spacingXs),
                Text(
                  'Uploaded by ${document.uploadedBy} • ${_formatDate(document.uploadedAt)}',
                  style: const TextStyle(
                    fontSize: AppTheme.fontSizeXs,
                    color: AppTheme.mutedForeground,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: AppTheme.spacingSm),
          ui.Badge(
            text: document.status.toUpperCase(),
            variant: _getStatusVariant(document.status),
          ),
        ],
      ),
    );
  }

  Color _getFileTypeColor(String fileType) {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return Colors.red;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return Colors.green;
      case 'doc':
      case 'docx':
        return Colors.blue;
      case 'xls':
      case 'xlsx':
        return Colors.green;
      default:
        return AppTheme.mutedForeground;
    }
  }

  IconData _getFileTypeIcon(String fileType) {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return Icons.picture_as_pdf;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return Icons.image;
      case 'doc':
      case 'docx':
        return Icons.description;
      case 'xls':
      case 'xlsx':
        return Icons.table_chart;
      default:
        return Icons.insert_drive_file;
    }
  }

  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inDays == 0) {
      return 'Today';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }

  ui.BadgeVariant _getStatusVariant(String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return ui.BadgeVariant.default_;
      case 'pending':
        return ui.BadgeVariant.secondary;
      case 'expired':
        return ui.BadgeVariant.destructive;
      default:
        return ui.BadgeVariant.outline;
    }
  }
}

// Placeholder Document Model
class DocumentModel {
  final String id;
  final String fileName;
  final String fileType;
  final int fileSize;
  final String uploadedBy;
  final DateTime uploadedAt;
  final String category;
  final String status;
  final String url;

  DocumentModel({
    required this.id,
    required this.fileName,
    required this.fileType,
    required this.fileSize,
    required this.uploadedBy,
    required this.uploadedAt,
    required this.category,
    required this.status,
    required this.url,
  });
}

// Placeholder pages - will be implemented next
class AddDocumentPage extends StatelessWidget {
  final String? employeeId;
  final String? projectId;

  const AddDocumentPage({
    super.key,
    this.employeeId,
    this.projectId,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Upload Document'),
        backgroundColor: AppTheme.primary,
        foregroundColor: AppTheme.primaryForeground,
      ),
      body: const Center(
        child: Text('Document upload functionality coming soon...'),
      ),
    );
  }
}

class DocumentDetailsPage extends StatelessWidget {
  final DocumentModel document;

  const DocumentDetailsPage({
    super.key,
    required this.document,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Document Details'),
        backgroundColor: AppTheme.primary,
        foregroundColor: AppTheme.primaryForeground,
      ),
      body: const Center(
        child: Text('Document details functionality coming soon...'),
      ),
    );
  }
}
