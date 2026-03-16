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

  Future<void> _onCheckRequested(
    AuthCheckRequested event,
    Emitter<AuthState> emit,
  ) async {
    final hasToken = await _tokenStorage.hasValidToken();
    if (!hasToken) {
      emit(AuthUnauthenticated());
    }
    // If token valid, keep current state (app will fetch user on dashboard)
  }

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

      if (result.hasException) {
        throw Exception(result.exception.toString());
      }

      final data = result.data!['login'] as Map<String, dynamic>;
      await _tokenStorage.saveTokens(
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
      );

      final user = AuthUser.fromJson(data['user'] as Map<String, dynamic>);
      emit(AuthAuthenticated(user: user));
    } catch (e) {
      emit(AuthError(message: _parseError(e.toString())));
    }
  }

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

      if (result.hasException) {
        throw Exception(result.exception.toString());
      }

      final data = result.data!['register'] as Map<String, dynamic>;
      await _tokenStorage.saveTokens(
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
      );

      final user = AuthUser.fromJson(data['user'] as Map<String, dynamic>);
      emit(AuthAuthenticated(user: user));
    } catch (e) {
      emit(AuthError(message: _parseError(e.toString())));
    }
  }

  Future<void> _onLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    await _tokenStorage.clearTokens();
    emit(AuthUnauthenticated());
  }

  String _parseError(String raw) {
    if (raw.contains('Invalid credentials')) return 'Invalid email or password';
    if (raw.contains('Email already in use')) return 'This email is already registered';
    return 'Something went wrong. Please try again.';
  }
}
