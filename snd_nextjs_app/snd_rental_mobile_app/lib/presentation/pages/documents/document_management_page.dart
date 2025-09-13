import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:photo_view/photo_view.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_pdfview/flutter_pdfview.dart';
import 'package:dio/dio.dart';
import 'dart:io';
import 'dart:typed_data';
import 'dart:convert';
import '../../providers/document_provider.dart';
import '../../../data/models/document_model.dart';
import '../../widgets/ui/card.dart' as ui;
import '../../widgets/ui/button.dart';
import '../../widgets/ui/badge.dart' as ui;
import '../../widgets/loading_widget.dart';
import '../../widgets/error_widget.dart' as custom;
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/app_constants.dart';

class DocumentManagementPage extends StatefulWidget {
  final int employeeId;
  final String employeeName;

  const DocumentManagementPage({
    super.key,
    required this.employeeId,
    required this.employeeName,
  });

  @override
  State<DocumentManagementPage> createState() => _DocumentManagementPageState();
}

class _DocumentManagementPageState extends State<DocumentManagementPage>
    with TickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  late TabController _tabController;
  String? _selectedCategory;
  String? _selectedFileType;

  final List<String> _categories = [
    'Contract',
    'ID Document',
    'Work Permit',
    'Medical Certificate',
    'Training Certificate',
    'Other',
  ];

  final List<String> _fileTypes = [
    'PDF',
    'Image',
    'Document',
    'Spreadsheet',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<DocumentProvider>();
      print('📄 DocumentManagementPage init - Employee ID: ${widget.employeeId}');
      provider.setEmployeeId(widget.employeeId);
      provider.loadDocuments(refresh: true, employeeId: widget.employeeId);
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text('Documents - ${widget.employeeName}'),
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(icon: Icon(Icons.folder_open), text: 'View Documents'),
            Tab(icon: Icon(Icons.upload_file), text: 'Upload Document'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildDocumentListView(),
          _buildDocumentUploadView(),
        ],
      ),
    );
  }

  Widget _buildDocumentListView() {
    return Column(
      children: [
        // Search and Filter Section
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha:0.05),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              // Search Bar
              TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search documents...',
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            _searchController.clear();
                            context.read<DocumentProvider>().searchDocuments('');
                          },
                        )
                      : null,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onChanged: (value) {
                  context.read<DocumentProvider>().searchDocuments(value);
                },
              ),
              const SizedBox(height: 12),
              
              // Filter Row - Stacked vertically to avoid overflow
              Column(
                children: [
                  DropdownButtonFormField<String>(
                    value: _selectedCategory,
                    decoration: const InputDecoration(
                      labelText: 'Category',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      isDense: true,
                    ),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('All Categories')),
                      ..._categories.map((category) => DropdownMenuItem(
                        value: category,
                        child: Text(category),
                      )),
                    ],
                    onChanged: (value) {
                      setState(() {
                        _selectedCategory = value;
                      });
                      context.read<DocumentProvider>().setCategoryFilter(value);
                    },
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _selectedFileType,
                    decoration: const InputDecoration(
                      labelText: 'File Type',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      isDense: true,
                    ),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('All Types')),
                      ..._fileTypes.map((type) => DropdownMenuItem(
                        value: type,
                        child: Text(type),
                      )),
                    ],
                    onChanged: (value) {
                      setState(() {
                        _selectedFileType = value;
                      });
                      context.read<DocumentProvider>().setFileTypeFilter(value);
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
        
        // Document List
        Expanded(
          child: Consumer<DocumentProvider>(
            builder: (context, provider, child) {
              if (provider.isLoading && provider.documents.isEmpty) {
                return const Center(child: LoadingWidget());
              }

              if (provider.hasError) {
                return Center(
                  child: custom.ErrorWidget(
                    message: provider.errorMessage ?? 'Unknown error',
                    onRetry: () => provider.refreshDocuments(),
                  ),
                );
              }

              if (provider.filteredDocuments.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.folder_open,
                        size: 64,
                        color: AppTheme.mutedForeground,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No documents found',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.mutedForeground,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Upload documents for this employee',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppTheme.mutedForeground,
                        ),
                      ),
                    ],
                  ),
                );
              }

              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: provider.filteredDocuments.length,
                itemBuilder: (context, index) {
                  final document = provider.filteredDocuments[index];
                  return _buildDocumentCard(document, provider);
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildDocumentCard(DocumentModel document, DocumentProvider provider) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: ui.UICard.default_(
        child: InkWell(
          onTap: () => _viewDocument(document),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Thumbnail/Icon
                _buildDocumentThumbnail(document),
                const SizedBox(width: 12),
                
                // Document Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        document.fileName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.foreground,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        document.fileSizeFormatted,
                        style: TextStyle(
                          fontSize: 12,
                          color: AppTheme.mutedForeground,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _formatUploadDate(document.uploadedAt),
                        style: TextStyle(
                          fontSize: 11,
                          color: AppTheme.mutedForeground,
                        ),
                      ),
                      if (document.category != null) ...[
                        const SizedBox(height: 4),
                        ui.Badge(
                          text: document.category!,
                          variant: ui.BadgeVariant.outline,
                        ),
                      ],
                    ],
                  ),
                ),
                
                // Actions
                PopupMenuButton<String>(
                  onSelected: (value) {
                    switch (value) {
                      case 'view':
                        _viewDocument(document);
                        break;
                      case 'download':
                        _downloadDocument(document);
                        break;
                      case 'delete':
                        _deleteDocument(document, provider);
                        break;
                    }
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'view',
                      child: Row(
                        children: [
                          Icon(Icons.visibility),
                          SizedBox(width: 8),
                          Text('View'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'download',
                      child: Row(
                        children: [
                          Icon(Icons.download),
                          SizedBox(width: 8),
                          Text('Download'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          Icon(Icons.delete, color: Colors.red),
                          SizedBox(width: 8),
                          Text('Delete', style: TextStyle(color: Colors.red)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDocumentUploadView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Upload Section
          ui.UICard.default_(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Upload Document',
                  style: TextStyle(
                    fontSize: AppTheme.fontSizeLg,
                    fontWeight: AppTheme.fontWeightBold,
                    color: AppTheme.foreground,
                  ),
                ),
                const SizedBox(height: 16),
                
                // File Picker Button
                Consumer<DocumentProvider>(
                  builder: (context, provider, child) {
                    return Button(
                      text: provider.isLoading ? 'Uploading...' : 'Select File',
                      onPressed: provider.isLoading ? null : _pickAndUploadFile,
                      icon: provider.isLoading ? null : Icons.upload_file,
                    );
                  },
                ),
                
                const SizedBox(height: 16),
                
                // Upload Info
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.muted.withValues(alpha:0.3),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Supported File Types:',
                        style: TextStyle(
                          fontSize: AppTheme.fontSizeSm,
                          fontWeight: AppTheme.fontWeightMedium,
                          color: AppTheme.foreground,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF',
                        style: TextStyle(
                          fontSize: AppTheme.fontSizeSm,
                          color: AppTheme.mutedForeground,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Maximum file size: 10 MB',
                        style: TextStyle(
                          fontSize: AppTheme.fontSizeSm,
                          color: AppTheme.mutedForeground,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Recent Uploads
          Consumer<DocumentProvider>(
            builder: (context, provider, child) {
              if (provider.documents.isEmpty) {
                return const SizedBox.shrink();
              }
              
              return ui.UICard.default_(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Recent Uploads',
                      style: TextStyle(
                        fontSize: AppTheme.fontSizeLg,
                        fontWeight: AppTheme.fontWeightBold,
                        color: AppTheme.foreground,
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    ...provider.documents.take(5).map((document) => 
                      ListTile(
                        leading: Icon(
                          _getFileTypeIcon(document.fileType),
                          color: _getFileTypeColor(document.fileType),
                        ),
                        title: Text(
                          document.fileName,
                          style: const TextStyle(fontSize: 14),
                        ),
                        subtitle: Text(
                          '${document.fileSizeFormatted} • ${_formatDate(document.uploadedAt)}',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppTheme.mutedForeground,
                          ),
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          onPressed: () => _deleteDocument(document, provider),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Future<void> _pickAndUploadFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif'],
        allowMultiple: false,
      );

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        
        if (file.path != null) {
          // Show category selection dialog
          final category = await _showCategoryDialog();
          if (category != null) {
            await context.read<DocumentProvider>().uploadDocument(
              fileName: file.name,
              filePath: file.path!,
              fileType: file.extension ?? 'unknown',
              fileSize: file.size,
              category: category,
            );
            
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Document "${file.name}" uploaded successfully'),
                  backgroundColor: AppTheme.success,
                ),
              );
            }
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error uploading file: $e'),
            backgroundColor: AppTheme.destructive,
          ),
        );
      }
    }
  }

  Future<String?> _showCategoryDialog() async {
    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Category'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: _categories.map((category) => 
            ListTile(
              title: Text(category),
              onTap: () => Navigator.pop(context, category),
            ),
          ).toList(),
        ),
      ),
    );
  }

  void _viewDocument(DocumentModel document) {
    // Show inline preview instead of navigating to separate page
    _showInlinePreview(document);
  }

  void _downloadDocument(DocumentModel document) {
    // Implement document download
    _performDownload(document);
  }

  void _showInlinePreview(DocumentModel document) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle bar
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        document.fileName,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
              ),
              const Divider(),
              // Preview content
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(20),
                  child: _buildDocumentPreview(document),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDocumentPreview(DocumentModel document) {
    return Column(
      children: [
        // Document preview content
        Container(
          width: double.infinity,
          height: 400,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[300]!),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: _buildDocumentContent(document),
          ),
        ),
        const SizedBox(height: 16),
        // Action buttons
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => _performDownload(document),
                icon: const Icon(Icons.download),
                label: const Text('Download'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => _shareDocument(document),
                icon: const Icon(Icons.share),
                label: const Text('Share'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.secondary,
                  foregroundColor: AppTheme.secondaryForeground,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        // Document information
        _buildDocumentInfo(document),
      ],
    );
  }

  Widget _buildDocumentContent(DocumentModel document) {
    if (document.isPdf) {
      return _buildPdfPreview(document);
    } else if (document.isImage) {
      return _buildImagePreview(document);
    } else if (document.isDocument) {
      return _buildOfficeDocumentPreview(document);
    } else {
      return _buildGenericPreview(document);
    }
  }

  Widget _buildPdfPreview(DocumentModel document) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.red[50]!,
            Colors.red[100]!,
          ],
        ),
      ),
      child: Column(
        children: [
          // PDF Preview Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.red[600],
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: Row(
              children: [
                const Icon(Icons.picture_as_pdf, color: Colors.white, size: 24),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'PDF Document',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    'PDF',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // PDF Content Preview
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // PDF Viewer
                  Expanded(
                    child: Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: _buildPdfViewer(document),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: () => _openPdfViewer(document),
                    icon: const Icon(Icons.fullscreen),
                    label: const Text('Open Full PDF'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red[600],
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImagePreview(DocumentModel document) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.blue[50]!,
            Colors.blue[100]!,
          ],
        ),
      ),
      child: Column(
        children: [
          // Image Preview Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue[600],
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: Row(
              children: [
                const Icon(Icons.image, color: Colors.white, size: 24),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Image File',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    document.fileExtension.toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Image Content Preview
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  // Image Viewer
                  Expanded(
                    child: Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.blue[200]!),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: _buildImageViewer(document),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () => _openImageViewer(document),
                    icon: const Icon(Icons.fullscreen),
                    label: const Text('View Full Image'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue[600],
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOfficeDocumentPreview(DocumentModel document) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.green[50]!,
            Colors.green[100]!,
          ],
        ),
      ),
      child: Column(
        children: [
          // Document Preview Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.green[600],
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: Row(
              children: [
                const Icon(Icons.description, color: Colors.white, size: 24),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Document File',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    document.fileExtension.toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Document Content Preview
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Document Preview Placeholder
                  Container(
                    width: 200,
                    height: 250,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.green[200]!),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.description,
                          size: 60,
                          color: Colors.green[400],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          document.fileName,
                          style: const TextStyle(
                            fontSize: 14,
                            color: Colors.black87,
                            fontWeight: FontWeight.w500,
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    onPressed: () => _openDocumentViewer(document),
                    icon: const Icon(Icons.visibility),
                    label: const Text('Open Document'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green[600],
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGenericPreview(DocumentModel document) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.grey[50]!,
            Colors.grey[100]!,
          ],
        ),
      ),
      child: Column(
        children: [
          // Generic Preview Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[600],
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: Row(
              children: [
                const Icon(Icons.insert_drive_file, color: Colors.white, size: 24),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'File',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    document.fileExtension.toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Generic Content Preview
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.insert_drive_file,
                    size: 80,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    document.fileName,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    document.fileSizeFormatted,
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.mutedForeground,
                    ),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    onPressed: () => _performDownload(document),
                    icon: const Icon(Icons.download),
                    label: const Text('Download File'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.grey[600],
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _openPdfViewer(DocumentModel document) {
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Opening PDF viewer for ${document.fileName}'),
        action: SnackBarAction(
          label: 'View',
          onPressed: () {
            // TODO: Implement actual PDF viewer
          },
        ),
      ),
    );
  }

  void _openImageViewer(DocumentModel document) {
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Opening image viewer for ${document.fileName}'),
        action: SnackBarAction(
          label: 'View',
          onPressed: () {
            // TODO: Implement actual image viewer
          },
        ),
      ),
    );
  }

  void _openDocumentViewer(DocumentModel document) {
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Opening document viewer for ${document.fileName}'),
        action: SnackBarAction(
          label: 'View',
          onPressed: () {
            // TODO: Implement actual document viewer
          },
        ),
      ),
    );
  }

  Future<void> _openPdfInBrowser(String pdfUrl) async {
    try {
      final Uri url = Uri.parse(pdfUrl);
      if (await canLaunchUrl(url)) {
        await launchUrl(url, mode: LaunchMode.externalApplication);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not open PDF: $pdfUrl'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error opening PDF: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Widget _buildPdfViewer(DocumentModel document) {
    final pdfUrl = _getDocumentUrl(document);
    
    return Container(
      color: Colors.grey[100],
      child: pdfUrl.isNotEmpty 
        ? _buildRealPdfPreview(pdfUrl, document)
        : _buildPdfPlaceholder(document),
    );
  }

  Widget _buildRealPdfPreview(String pdfUrl, DocumentModel document) {
    return FutureBuilder<Uint8List>(
      future: _downloadPdfBytes(pdfUrl),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text('Loading PDF...'),
              ],
            ),
          );
        }
        
        if (snapshot.hasError) {
          return _buildPdfError(document, snapshot.error.toString());
        }
        
        if (snapshot.hasData) {
          return _buildPdfRender(snapshot.data!, document);
        }
        
        return _buildPdfPlaceholder(document);
      },
    );
  }

  Widget _buildPdfRender(Uint8List pdfBytes, DocumentModel document) {
    return Column(
      children: [
        // PDF Info
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.red[600],
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            'PDF Document',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        const SizedBox(height: 8),
        // PDF Preview using flutter_pdfview
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: FutureBuilder<String>(
                future: _savePdfToTempFile(pdfBytes),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  
                  if (snapshot.hasError) {
                    return _buildPdfError(document, snapshot.error.toString());
                  }
                  
                  if (snapshot.hasData) {
                    return PDFView(
                      filePath: snapshot.data!,
                      enableSwipe: true,
                      swipeHorizontal: false,
                      autoSpacing: false,
                      pageFling: false,
                      pageSnap: false,
                      onRender: (pages) {
                        // PDF rendered successfully
                      },
                      onViewCreated: (PDFViewController controller) {
                        // PDF view created
                      },
                      onPageChanged: (page, total) {
                        // Page changed
                      },
                      onError: (error) {
                        // Handle PDF error
                      },
                      onPageError: (page, error) {
                        // Handle page error
                      },
                    );
                  }
                  
                  return _buildPdfPlaceholder(document);
                },
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        // PDF Actions
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => _openPdfInBrowser(_getDocumentUrl(document)),
                icon: const Icon(Icons.open_in_browser, size: 16),
                label: const Text('Open Full PDF', style: TextStyle(fontSize: 12)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red[600],
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPdfPlaceholder(DocumentModel document) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.picture_as_pdf,
          size: 60,
          color: Colors.red[400],
        ),
        const SizedBox(height: 12),
        Text(
          'PDF Document',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.red[600],
          ),
        ),
        const SizedBox(height: 6),
        Text(
          document.fileName,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.black87,
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 12),
        Text(
          'PDF preview not available',
          style: TextStyle(
            fontSize: 10,
            color: Colors.grey[600],
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildPdfError(DocumentModel document, String error) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.error,
          size: 60,
          color: Colors.red[400],
        ),
        const SizedBox(height: 12),
        Text(
          'PDF Error',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.red[600],
          ),
        ),
        const SizedBox(height: 6),
        Text(
          document.fileName,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.black87,
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 12),
        Text(
          'Failed to load PDF',
          style: TextStyle(
            fontSize: 10,
            color: Colors.grey[600],
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Future<Uint8List> _downloadPdfBytes(String url) async {
    final dio = Dio();
    final response = await dio.get<List<int>>(
      url,
      options: Options(responseType: ResponseType.bytes),
    );
    return Uint8List.fromList(response.data!);
  }

  Future<String> _savePdfToTempFile(Uint8List pdfBytes) async {
    final tempDir = Directory.systemTemp;
    final tempFile = File('${tempDir.path}/temp_pdf_${DateTime.now().millisecondsSinceEpoch}.pdf');
    await tempFile.writeAsBytes(pdfBytes);
    return tempFile.path;
  }

  Widget _buildImageViewer(DocumentModel document) {
    final imageUrl = _getDocumentUrl(document);
    
    return Container(
      color: Colors.grey[100],
      child: imageUrl.isNotEmpty 
        ? _buildPhotoView(imageUrl, document)
        : _buildNoImagePlaceholder(document),
    );
  }

  Widget _buildPhotoView(String imageUrl, DocumentModel document) {
    // Check if it's a base64 data URL
    if (imageUrl.startsWith('data:')) {
      try {
        final base64String = imageUrl.split(',')[1];
        final bytes = base64Decode(base64String);
        return PhotoView(
          imageProvider: MemoryImage(bytes),
          minScale: PhotoViewComputedScale.contained * 0.8,
          maxScale: PhotoViewComputedScale.covered * 2.0,
          backgroundDecoration: const BoxDecoration(color: Colors.transparent),
          loadingBuilder: (context, event) => const Center(
            child: CircularProgressIndicator(),
          ),
          errorBuilder: (context, error, stackTrace) => _buildImageError(document),
        );
      } catch (e) {
        return _buildImageError(document);
      }
    }
    
    // Regular network image with PhotoView
    return PhotoView(
      imageProvider: CachedNetworkImageProvider(imageUrl),
      minScale: PhotoViewComputedScale.contained * 0.8,
      maxScale: PhotoViewComputedScale.covered * 2.0,
      backgroundDecoration: const BoxDecoration(color: Colors.transparent),
      loadingBuilder: (context, event) => const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading image...'),
          ],
        ),
      ),
      errorBuilder: (context, error, stackTrace) => _buildImageError(document),
    );
  }

  Widget _buildNoImagePlaceholder(DocumentModel document) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.image,
          size: 60,
          color: Colors.blue[400],
        ),
        const SizedBox(height: 12),
        Text(
          'Image Preview',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.blue[600],
          ),
        ),
        const SizedBox(height: 6),
        Text(
          document.fileName,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.black87,
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 12),
        Text(
          'Image URL not available',
          style: TextStyle(
            fontSize: 10,
            color: Colors.grey[600],
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildImageError(DocumentModel document) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.error,
          size: 60,
          color: Colors.red[400],
        ),
        const SizedBox(height: 12),
        Text(
          'Failed to load image',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.red[600],
          ),
        ),
        const SizedBox(height: 6),
        Text(
          document.fileName,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.black87,
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 12),
        ElevatedButton.icon(
          onPressed: () {
            // Trigger rebuild to retry loading
            setState(() {});
          },
          icon: const Icon(Icons.refresh, size: 16),
          label: const Text('Retry', style: TextStyle(fontSize: 12)),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blue[600],
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          ),
        ),
      ],
    );
  }

  String _getDocumentUrl(DocumentModel document) {
    print('🖼️ Getting URL for document: ${document.fileName}');
    print('🖼️ Document filePath: "${document.filePath}"');
    
    // Construct the full URL for the document
    if (document.filePath.isNotEmpty) {
      // If filePath is already a full URL, use it
      if (document.filePath.startsWith('http')) {
        print('🖼️ Using direct URL: ${document.filePath}');
        return document.filePath;
      }
      
      // Try different URL construction patterns
      final baseUrl = AppConstants.baseUrl.replaceAll('/api', '');
      
      // Pattern 1: Direct uploads path
      String constructedUrl = '$baseUrl/uploads/${document.filePath}';
      print('🖼️ Constructed URL (pattern 1): $constructedUrl');
      
      // Pattern 2: If it's a relative path, try different base paths
      if (!document.filePath.startsWith('/')) {
        constructedUrl = '$baseUrl/${document.filePath}';
        print('🖼️ Constructed URL (pattern 2): $constructedUrl');
      }
      
      // Pattern 3: Try with storage prefix
      if (!document.filePath.contains('storage') && !document.filePath.contains('uploads')) {
        constructedUrl = '$baseUrl/storage/${document.filePath}';
        print('🖼️ Constructed URL (pattern 3): $constructedUrl');
      }
      
      return constructedUrl;
    }
    
    print('🖼️ No file path available for document: ${document.fileName}');
    print('🖼️ Document details: ID=${document.id}, Type=${document.fileType}, Size=${document.fileSize}');
    return '';
  }

  Widget _buildDocumentInfo(DocumentModel document) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Document Information',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppTheme.foreground,
            ),
          ),
          const SizedBox(height: 12),
          _buildInfoRow('File Name', document.fileName),
          _buildInfoRow('File Type', document.fileType.toUpperCase()),
          _buildInfoRow('File Size', document.fileSizeFormatted),
          if (document.category != null)
            _buildInfoRow('Category', document.category!),
          if (document.description != null)
            _buildInfoRow('Description', document.description!),
          _buildInfoRow('Uploaded By', document.uploadedBy ?? 'Unknown'),
          _buildInfoRow('Upload Date', _formatDate(document.uploadedAt)),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.mutedForeground,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _performDownload(DocumentModel document) {
    // Close the preview modal first
    Navigator.pop(context);
    
    // Show download progress
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            ),
            const SizedBox(width: 12),
            Text('Downloading ${document.fileName}...'),
          ],
        ),
        duration: const Duration(seconds: 2),
      ),
    );

    // Simulate download completion
    Future.delayed(const Duration(seconds: 2), () {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${document.fileName} downloaded successfully!'),
          backgroundColor: Colors.green,
          action: SnackBarAction(
            label: 'Open',
            textColor: Colors.white,
            onPressed: () {
              // TODO: Open downloaded file
            },
          ),
        ),
      );
    });
  }

  void _shareDocument(DocumentModel document) {
    // Close the preview modal first
    Navigator.pop(context);
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Sharing ${document.fileName}...'),
        action: SnackBarAction(
          label: 'Share',
          onPressed: () {
            // TODO: Implement actual sharing
          },
        ),
      ),
    );
  }

  void _deleteDocument(DocumentModel document, DocumentProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Document'),
        content: Text('Are you sure you want to delete "${document.fileName}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              provider.deleteDocument(document.id);
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  IconData _getFileTypeIcon(String fileType) {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return Icons.picture_as_pdf;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
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

  Color _getFileTypeColor(String fileType) {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return Colors.red;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return Colors.green;
      case 'doc':
      case 'docx':
        return Colors.blue;
      case 'xls':
      case 'xlsx':
        return Colors.orange;
      default:
        return AppTheme.mutedForeground;
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  Widget _buildDocumentThumbnail(DocumentModel document) {
    return Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: _buildThumbnailContent(document),
      ),
    );
  }

  Widget _buildThumbnailContent(DocumentModel document) {
    if (document.isImage) {
      return _buildImageThumbnail(document);
    } else if (document.isPdf) {
      return _buildPdfThumbnail(document);
    } else {
      return _buildGenericThumbnail(document);
    }
  }

  Widget _buildImageThumbnail(DocumentModel document) {
    final imageUrl = _getDocumentUrl(document);
    
    if (imageUrl.isEmpty) {
      return _buildGenericThumbnail(document);
    }

    return CachedNetworkImage(
      imageUrl: imageUrl,
      fit: BoxFit.cover,
      placeholder: (context, url) => Container(
        color: Colors.grey[200],
        child: const Center(
          child: SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      ),
      errorWidget: (context, url, error) => _buildGenericThumbnail(document),
    );
  }

  Widget _buildPdfThumbnail(DocumentModel document) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.red[50],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Stack(
        children: [
          // PDF icon background
          Center(
            child: Icon(
              Icons.picture_as_pdf,
              color: Colors.red[400],
              size: 24,
            ),
          ),
          // PDF text overlay
          Positioned(
            bottom: 2,
            left: 2,
            right: 2,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 1),
              decoration: BoxDecoration(
                color: Colors.red[600],
                borderRadius: BorderRadius.circular(2),
              ),
              child: const Text(
                'PDF',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 8,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGenericThumbnail(DocumentModel document) {
    return Container(
      decoration: BoxDecoration(
        color: _getFileTypeColor(document.fileType).withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Stack(
        children: [
          // Main icon
          Center(
            child: Icon(
              _getFileTypeIcon(document.fileType),
              color: _getFileTypeColor(document.fileType),
              size: 28,
            ),
          ),
          // File extension badge
          Positioned(
            top: 4,
            right: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              decoration: BoxDecoration(
                color: _getFileTypeColor(document.fileType),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                document.fileExtension.toUpperCase(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 8,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatUploadDate(DateTime date) {
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
}
