import 'package:flutter/material.dart';
import '../../../data/models/document_model.dart';
import '../../../core/theme/app_theme.dart';

class DocumentPreviewPage extends StatefulWidget {
  final DocumentModel document;

  const DocumentPreviewPage({
    super.key,
    required this.document,
  });

  @override
  State<DocumentPreviewPage> createState() => _DocumentPreviewPageState();
}

class _DocumentPreviewPageState extends State<DocumentPreviewPage> {
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDocument();
  }

  Future<void> _loadDocument() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Simulate loading document
      await Future.delayed(const Duration(seconds: 1));
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(widget.document.fileName),
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.download),
            onPressed: _downloadDocument,
            tooltip: 'Download',
          ),
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: _shareDocument,
            tooltip: 'Share',
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading document...'),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: AppTheme.destructive,
            ),
            const SizedBox(height: 16),
            Text(
              'Error loading document',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppTheme.destructive,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.mutedForeground,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadDocument,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    return _buildDocumentPreview();
  }

  Widget _buildDocumentPreview() {
    if (widget.document.isPdf) {
      return _buildPdfPreview();
    } else if (widget.document.isImage) {
      return _buildImagePreview();
    } else {
      return _buildUnsupportedPreview();
    }
  }

  Widget _buildPdfPreview() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // PDF Thumbnail/Preview
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.picture_as_pdf,
                    size: 80,
                    color: AppTheme.destructive,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    widget.document.fileName,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.document.fileSizeFormatted,
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.mutedForeground,
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: _openPdfViewer,
                    icon: const Icon(Icons.visibility),
                    label: const Text('Open PDF Viewer'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Document Info
          _buildDocumentInfo(),
        ],
      ),
    );
  }

  Widget _buildImagePreview() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Image Preview
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
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
                child: Container(
                  color: AppTheme.muted,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.image,
                        size: 80,
                        color: AppTheme.mutedForeground,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        widget.document.fileName,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        widget.document.fileSizeFormatted,
                        style: TextStyle(
                          fontSize: 14,
                          color: AppTheme.mutedForeground,
                        ),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: _openImageViewer,
                        icon: const Icon(Icons.visibility),
                        label: const Text('View Image'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Document Info
          _buildDocumentInfo(),
        ],
      ),
    );
  }

  Widget _buildUnsupportedPreview() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.insert_drive_file,
                    size: 80,
                    color: AppTheme.mutedForeground,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    widget.document.fileName,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.document.fileSizeFormatted,
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.mutedForeground,
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: _downloadDocument,
                    icon: const Icon(Icons.download),
                    label: const Text('Download File'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Document Info
          _buildDocumentInfo(),
        ],
      ),
    );
  }

  Widget _buildDocumentInfo() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
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
          _buildInfoRow('File Name', widget.document.fileName),
          _buildInfoRow('File Type', widget.document.fileType.toUpperCase()),
          _buildInfoRow('File Size', widget.document.fileSizeFormatted),
          if (widget.document.category != null)
            _buildInfoRow('Category', widget.document.category!),
          if (widget.document.description != null)
            _buildInfoRow('Description', widget.document.description!),
          _buildInfoRow('Uploaded By', widget.document.uploadedBy ?? 'Unknown'),
          _buildInfoRow('Upload Date', _formatDate(widget.document.uploadedAt)),
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

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  void _openPdfViewer() {
    // TODO: Implement PDF viewer
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('PDF viewer will be implemented'),
      ),
    );
  }

  void _openImageViewer() {
    // TODO: Implement image viewer
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Image viewer will be implemented'),
      ),
    );
  }

  void _downloadDocument() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Downloading ${widget.document.fileName}...'),
      ),
    );
  }

  void _shareDocument() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Sharing ${widget.document.fileName}...'),
      ),
    );
  }
}
