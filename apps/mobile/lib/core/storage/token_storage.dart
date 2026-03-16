import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class TokenStorage {
  final FlutterSecureStorage _storage;

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userKey = 'user_data';

  TokenStorage({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  // ── Token read/write ───────────────────────────────────────────────────────

  Future<String?> getAccessToken() => _storage.read(key: _accessTokenKey);
  Future<String?> getRefreshToken() => _storage.read(key: _refreshTokenKey);

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _storage.write(key: _accessTokenKey, value: accessToken),
      _storage.write(key: _refreshTokenKey, value: refreshToken),
    ]);
  }

  Future<void> clearTokens() async {
    await Future.wait([
      _storage.delete(key: _accessTokenKey),
      _storage.delete(key: _refreshTokenKey),
      _storage.delete(key: _userKey),
    ]);
  }

  // ── User data ──────────────────────────────────────────────────────────────

  Future<void> saveUser(Map<String, dynamic> userJson) =>
      _storage.write(key: _userKey, value: jsonEncode(userJson));

  Future<Map<String, dynamic>?> getUser() async {
    final raw = await _storage.read(key: _userKey);
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  // ── Token validation ───────────────────────────────────────────────────────

  Future<bool> hasValidToken() async {
    final token = await getAccessToken();
    if (token == null) return false;
    try {
      return !_isTokenExpired(token);
    } catch (_) {
      return false;
    }
  }

  bool _isTokenExpired(String token) {
    final parts = token.split('.');
    if (parts.length != 3) return true;
    final normalized = base64Url.normalize(parts[1]);
    final decoded = utf8.decode(base64Url.decode(normalized));
    final map = json.decode(decoded) as Map<String, dynamic>;
    final exp = map['exp'] as int?;
    if (exp == null) return false;
    return DateTime.fromMillisecondsSinceEpoch(exp * 1000)
        .isBefore(DateTime.now());
  }

  // ── Auto-refresh ───────────────────────────────────────────────────────────

  /// Returns a valid access token, refreshing silently if the current one is
  /// expired. Returns null if the refresh token is also expired or missing.
  Future<String?> refreshIfNeeded() async {
    final accessToken = await getAccessToken();

    if (accessToken != null && !_isTokenExpired(accessToken)) {
      return accessToken;
    }

    final refreshToken = await getRefreshToken();
    if (refreshToken == null || _isTokenExpired(refreshToken)) return null;

    try {
      final response = await http.post(
        Uri.parse(ApiConfig.graphqlHttpUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'query': r'''
            mutation RefreshToken($token: String!) {
              refreshToken(token: $token) {
                accessToken
                refreshToken
              }
            }
          ''',
          'variables': {'token': refreshToken},
        }),
      );

      final body = jsonDecode(response.body) as Map<String, dynamic>;
      final data =
          (body['data'] as Map<String, dynamic>?)?['refreshToken']
              as Map<String, dynamic>?;
      if (data == null) return null;

      final newAccess = data['accessToken'] as String;
      final newRefresh = data['refreshToken'] as String;
      await saveTokens(accessToken: newAccess, refreshToken: newRefresh);
      return newAccess;
    } catch (_) {
      return null;
    }
  }
}
