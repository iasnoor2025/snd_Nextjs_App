import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:snd_rental_mobile_app/app/app.dart';

void main() {
  testWidgets('App loads without crashing', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const SndRentalApp());

    // Verify that the app loads
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}