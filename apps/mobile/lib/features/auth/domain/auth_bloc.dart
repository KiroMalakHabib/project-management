import 'dart:convert';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../data/auth_mutations.dart';
import 'auth_event.dart';
import 'auth_state.dart';
import 'auth_user.dart';
import '../../../core/storage/token_storage.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final GraphQLClient _client;
  final TokenStorage _tokenStorage;

  AuthBloc({
    required GraphQLClient client,
    required TokenStorage tokenStorage,
  })  : _client = client,
        _tokenStorage = tokenStorage,
        super(AuthInitial()) {
    on<AuthCheckRequested>(_onCheckRequested);
    on<AuthLoginRequested>(_onLoginRequested);
    on<AuthRegisterRequested>(_onRegisterRequested);
    on<AuthLogoutRequested>(_onLogoutRequested);
  }

  // ── Check (app startup) ───────────────────────────────────────────────────

  Future<void> _onCheckRequested(
    AuthCheckRequested event,
    Emitter<AuthState> emit,
  ) async {
    // Silently refresh if access token is expired; null = refresh token gone too
    final token = await _tokenStorage.refreshIfNeeded();
    if (token == null) {
      emit(AuthUnauthenticated());
      return;
    }

    final userJson = await _tokenStorage.getUser();
    if (userJson == null) {
      // No cached user (e.g. first launch after an app upgrade) — re-login needed
      await _tokenStorage.clearTokens();
      emit(AuthUnauthenticated());
      return;
    }

    emit(AuthAuthenticated(user: AuthUser.fromJson(userJson)));
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  Future<void> _onLoginRequested(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final result = await _client.mutate(
        MutationOptions(
          document: gql(loginMutation),
          variables: {
            'input': {
              'email': event.email,
              'password': event.password,
            },
          },
        ),
      );

      if (result.hasException) throw Exception(result.exception.toString());

      final data = result.data!['login'] as Map<String, dynamic>;
      await _tokenStorage.saveTokens(
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
      );
      await _tokenStorage.saveUser(data['user'] as Map<String, dynamic>);

      emit(AuthAuthenticated(
        user: AuthUser.fromJson(data['user'] as Map<String, dynamic>),
      ));
    } catch (e) {
      emit(AuthError(message: _parseError(e.toString())));
    }
  }

  // ── Register ──────────────────────────────────────────────────────────────

  Future<void> _onRegisterRequested(
    AuthRegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final result = await _client.mutate(
        MutationOptions(
          document: gql(registerMutation),
          variables: {
            'input': {
              'email': event.email,
              'password': event.password,
              'fullName': event.fullName,
            },
          },
        ),
      );

      if (result.hasException) throw Exception(result.exception.toString());

      final data = result.data!['register'] as Map<String, dynamic>;
      await _tokenStorage.saveTokens(
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
      );
      await _tokenStorage.saveUser(data['user'] as Map<String, dynamic>);

      emit(AuthAuthenticated(
        user: AuthUser.fromJson(data['user'] as Map<String, dynamic>),
      ));
    } catch (e) {
      emit(AuthError(message: _parseError(e.toString())));
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  Future<void> _onLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      final refreshToken = await _tokenStorage.getRefreshToken();
      if (refreshToken != null) {
        final tokenId = _extractTokenId(refreshToken);
        if (tokenId != null) {
          await _client.mutate(
            MutationOptions(
              document: gql(logoutMutation),
              variables: {'tokenId': tokenId},
            ),
          );
        }
      }
    } catch (_) {
      // Ignore errors — always clear local state
    }

    await _tokenStorage.clearTokens();
    emit(AuthUnauthenticated());
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  String? _extractTokenId(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;
      final normalized = base64Url.normalize(parts[1]);
      final decoded = utf8.decode(base64Url.decode(normalized));
      final payload = json.decode(decoded) as Map<String, dynamic>;
      return payload['tokenId'] as String?;
    } catch (_) {
      return null;
    }
  }

  String _parseError(String raw) {
    if (raw.contains('Invalid credentials')) return 'Invalid email or password';
    if (raw.contains('Email already in use')) return 'This email is already registered';
    return 'Something went wrong. Please try again.';
  }
}
