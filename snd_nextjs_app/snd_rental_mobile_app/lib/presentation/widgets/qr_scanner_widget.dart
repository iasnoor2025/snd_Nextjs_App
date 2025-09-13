import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';

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
  MobileScannerController controller = MobileScannerController();
  bool _isScanning = true;
  String? _lastScannedCode;

  @override
  void initState() {
    super.initState();
    _requestCameraPermission();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  Future<void> _requestCameraPermission() async {
    final status = await Permission.camera.request();
    if (status != PermissionStatus.granted) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Camera permission is required to scan QR codes'),
            backgroundColor: Colors.red,
          ),
        );
        Navigator.of(context).pop();
      }
    }
  }

  void _onDetect(BarcodeCapture capture) {
    if (!_isScanning) return;

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isNotEmpty) {
      final String? code = barcodes.first.rawValue;
      if (code != null && code != _lastScannedCode) {
        _lastScannedCode = code;
        setState(() {
          _isScanning = false;
        });

        // Add a small delay to prevent multiple scans
        Future.delayed(const Duration(milliseconds: 500), () {
          widget.onScanResult(code);
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title ?? 'Scan QR Code'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: ValueListenableBuilder(
              valueListenable: controller.torchState,
              builder: (context, state, child) {
                switch (state) {
                  case TorchState.off:
                    return const Icon(Icons.flash_off, color: Colors.grey);
                  case TorchState.on:
                    return const Icon(Icons.flash_on, color: Colors.yellow);
                }
              },
            ),
            onPressed: () => controller.toggleTorch(),
          ),
          IconButton(
            icon: ValueListenableBuilder(
              valueListenable: controller.cameraFacingState,
              builder: (context, state, child) {
                switch (state) {
                  case CameraFacing.front:
                    return const Icon(Icons.camera_front);
                  case CameraFacing.back:
                    return const Icon(Icons.camera_rear);
                }
              },
            ),
            onPressed: () => controller.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          // Camera view
          MobileScanner(
            controller: controller,
            onDetect: _onDetect,
          ),
          
          // Overlay
          Container(
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.5),
            ),
            child: Column(
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Expanded(child: Container()),
                      Container(
                        width: 250,
                        height: 250,
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: Colors.white,
                            width: 2,
                          ),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            color: Colors.transparent,
                          ),
                        ),
                      ),
                      Expanded(child: Container()),
                    ],
                  ),
                ),
                
                // Instructions
                Container(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      if (widget.subtitle != null) ...[
                        Text(
                          widget.subtitle!,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                      ],
                      const Text(
                        'Position the QR code within the frame',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      
                      // Manual input button
                      ElevatedButton.icon(
                        onPressed: () {
                          _showManualInputDialog();
                        },
                        icon: const Icon(Icons.keyboard),
                        label: const Text('Enter Manually'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: Colors.black,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
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
