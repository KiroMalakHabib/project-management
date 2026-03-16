import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:project_management/features/organizations/domain/organizations_bloc.dart';
import 'package:project_management/features/organizations/domain/organizations_event.dart';
import 'package:project_management/features/organizations/domain/organizations_state.dart';

class MockGraphQLClient extends Mock implements GraphQLClient {}

class FakeQueryOptions extends Fake implements QueryOptions {}
class FakeMutationOptions extends Fake implements MutationOptions {}

void main() {
  setUpAll(() {
    registerFallbackValue(FakeQueryOptions());
    registerFallbackValue(FakeMutationOptions());
  });

  late OrganizationsBloc bloc;
  late MockGraphQLClient mockClient;

  setUp(() {
    mockClient = MockGraphQLClient();
    bloc = OrganizationsBloc(client: mockClient);
  });

  tearDown(() => bloc.close());

  // ── OrganizationsLoadRequested ────────────────────────────────────────────

  group('OrganizationsLoadRequested', () {
    blocTest<OrganizationsBloc, OrganizationsState>(
      'emits [Loading, Loaded] when query succeeds',
      build: () {
        when(() => mockClient.query(any())).thenAnswer(
          (_) async => QueryResult(
            options: QueryOptions(document: gql('')),
            data: {
              'myOrganizations': [
                {
                  'id': 'org-1',
                  'name': 'Acme',
                  'slug': 'acme',
                  'description': null,
                  'logoUrl': null,
                },
              ],
            },
            source: QueryResultSource.network,
          ),
        );
        return bloc;
      },
      act: (b) => b.add(OrganizationsLoadRequested()),
      expect: () => [
        isA<OrganizationsLoading>(),
        isA<OrganizationsLoaded>()
            .having((s) => s.organizations.length, 'organizations count', 1)
            .having((s) => s.organizations.first.name, 'first org name', 'Acme'),
      ],
    );

    blocTest<OrganizationsBloc, OrganizationsState>(
      'emits [Loading, Error] when query throws',
      build: () {
        when(() => mockClient.query(any())).thenThrow(Exception('Network error'));
        return bloc;
      },
      act: (b) => b.add(OrganizationsLoadRequested()),
      expect: () => [
        isA<OrganizationsLoading>(),
        isA<OrganizationsError>(),
      ],
    );

    blocTest<OrganizationsBloc, OrganizationsState>(
      'emits [Loading, Error] when query has GraphQL exception',
      build: () {
        when(() => mockClient.query(any())).thenAnswer(
          (_) async => QueryResult(
            options: QueryOptions(document: gql('')),
            exception: OperationException(
              graphqlErrors: [const GraphQLError(message: 'Unauthorized')],
            ),
            source: QueryResultSource.network,
          ),
        );
        return bloc;
      },
      act: (b) => b.add(OrganizationsLoadRequested()),
      expect: () => [
        isA<OrganizationsLoading>(),
        isA<OrganizationsError>(),
      ],
    );
  });

  // ── OrganizationCreateRequested ───────────────────────────────────────────

  group('OrganizationCreateRequested', () {
    blocTest<OrganizationsBloc, OrganizationsState>(
      'reloads list after successful creation',
      build: () {
        when(() => mockClient.mutate(any())).thenAnswer(
          (_) async => QueryResult(
            options: QueryOptions(document: gql('')),
            data: {
              'createOrganization': {
                'id': 'org-2',
                'name': 'New Org',
                'slug': 'new-org',
                'description': null,
                'logoUrl': null,
              },
            },
            source: QueryResultSource.network,
          ),
        );
        when(() => mockClient.query(any())).thenAnswer(
          (_) async => QueryResult(
            options: QueryOptions(document: gql('')),
            data: {'myOrganizations': []},
            source: QueryResultSource.network,
          ),
        );
        return bloc;
      },
      act: (b) => b.add(const OrganizationCreateRequested(name: 'New Org', slug: 'new-org')),
      expect: () => [
        // After mutation succeeds, OrganizationsLoadRequested is fired internally
        isA<OrganizationsLoading>(),
        isA<OrganizationsLoaded>(),
      ],
    );

    blocTest<OrganizationsBloc, OrganizationsState>(
      'emits [Error] when mutation fails',
      build: () {
        when(() => mockClient.mutate(any())).thenThrow(Exception('Create failed'));
        return bloc;
      },
      act: (b) => b.add(const OrganizationCreateRequested(name: 'New Org', slug: 'new-org')),
      expect: () => [isA<OrganizationsError>()],
    );
  });
}
