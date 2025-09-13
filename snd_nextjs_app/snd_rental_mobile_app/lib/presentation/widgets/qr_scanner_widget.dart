import 'package:flutter/material.dart';

class QRScannerWidget extends StatefulWidget {
  final Function(String) onScanResult;
  final String? title;
  final String? subtitle;

  const QRScannerWidget({
    super.key,
    required this.onScanResult,
    this.title,
    this.subtitle,
  });

  @override
  State<QRScannerWidget> createState() => _QRScannerWidgetState();
}

class _QRScannerWidgetState extends State<QRScannerWidget> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title ?? 'QR Code Scanner'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.qr_code_scanner,
              size: 100,
              color: Colors.grey,
            ),
            const SizedBox(height: 20),
            const Text(
              'QR Scanner Temporarily Unavailable',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'The QR scanner feature is temporarily disabled due to build issues.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 30),
            
            // Manual input button
            ElevatedButton.icon(
              onPressed: () {
                _showManualInputDialog();
              },
              icon: const Icon(Icons.keyboard),
              label: const Text('Enter Code Manually'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showManualInputDialog() {
    final TextEditingController inputController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Enter Code Manually'),
        content: TextField(
          controller: inputController,
          decoration: const InputDecoration(
            hintText: 'Enter equipment ID or QR code',
            border: OutlineInputBorder(),
          ),
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final code = inputController.text.trim();
              if (code.isNotEmpty) {
                Navigator.of(context).pop();
                widget.onScanResult(code);
              }
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }
}
