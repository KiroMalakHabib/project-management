import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:project_management/features/auth/domain/auth_bloc.dart';
import 'package:project_management/features/auth/domain/auth_event.dart';
import 'package:project_management/features/auth/domain/auth_state.dart';
import 'package:project_management/core/storage/token_storage.dart';

class MockGraphQLClient extends Mock implements GraphQLClient {}
class MockTokenStorage extends Mock implements TokenStorage {}

void main() {
  late AuthBloc authBloc;
  late MockGraphQLClient mockClient;
  late MockTokenStorage mockTokenStorage;

  setUp(() {
    mockClient = MockGraphQLClient();
    mockTokenStorage = MockTokenStorage();
    authBloc = AuthBloc(
      client: mockClient,
      tokenStorage: mockTokenStorage,
    );
  });

  tearDown(() => authBloc.close());

  group('AuthCheckRequested', () {
    blocTest<AuthBloc, AuthState>(
      'emits [AuthUnauthenticated] when no valid token',
      build: () {
        when(() => mockTokenStorage.hasValidToken())
            .thenAnswer((_) async => false);
        return authBloc;
      },
      act: (bloc) => bloc.add(AuthCheckRequested()),
      expect: () => [AuthUnauthenticated()],
    );
  });

  group('AuthLogoutRequested', () {
    blocTest<AuthBloc, AuthState>(
      'emits [AuthUnauthenticated] and clears tokens',
      build: () {
        when(() => mockTokenStorage.clearTokens()).thenAnswer((_) async {});
        return authBloc;
      },
      act: (bloc) => bloc.add(AuthLogoutRequested()),
      expect: () => [AuthUnauthenticated()],
      verify: (_) {
        verify(() => mockTokenStorage.clearTokens()).called(1);
      },
    );
  });
}
