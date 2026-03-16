import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConfig {
  static String get host {
    if (kIsWeb) return 'localhost';
    if (Platform.isAndroid) return '10.0.2.2';
    return 'localhost'; // iOS simulator, macOS
  }

  static String get graphqlHttpUrl => 'http://$host:4000/graphql';
  static String get graphqlWsUrl => 'ws://$host:4000/graphql';
}
