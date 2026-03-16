import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('MaterialApp renders a Scaffold without crashing',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Center(child: Text('ProjectMgmt')),
        ),
      ),
    );

    expect(find.text('ProjectMgmt'), findsOneWidget);
    expect(find.byType(Scaffold), findsOneWidget);
  });
}
