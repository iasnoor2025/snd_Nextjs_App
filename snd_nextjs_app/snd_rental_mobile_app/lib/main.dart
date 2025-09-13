import 'package:flutter/material.dart';
import 'app/app.dart';
import 'core/network/api_client.dart';

void main() {
  // Initialize API client
  ApiClient().initialize();
  
  runApp(const SndRentalApp());
}
