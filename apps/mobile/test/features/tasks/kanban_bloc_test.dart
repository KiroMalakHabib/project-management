import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:project_management/features/tasks/domain/kanban_bloc.dart';
import 'package:project_management/features/tasks/domain/kanban_event.dart';
import 'package:project_management/features/tasks/domain/kanban_state.dart';

class MockGraphQLClient extends Mock implements GraphQLClient {}

class FakeQueryOptions extends Fake implements QueryOptions {}
class FakeMutationOptions extends Fake implements MutationOptions {}

final _columnsData = {
  'projectColumns': [
    {
      'id': 'col-1',
      'name': 'To Do',
      'position': 0,
      'color': '#6366F1',
      'wipLimit': null,
      'tasks': [
        {
          'id': 'task-1',
          'title': 'Fix bug',
          'priority': 'HIGH',
          'position': 1.0,
          'columnId': 'col-1',
          'dueDate': null,
          'assignee': null,
        },
      ],
    },
  ],
};

void main() {
  setUpAll(() {
    registerFallbackValue(FakeQueryOptions());
    registerFallbackValue(FakeMutationOptions());
  });

  late KanbanBloc bloc;
  late MockGraphQLClient mockClient;

  setUp(() {
    mockClient = MockGraphQLClient();
    bloc = KanbanBloc(client: mockClient);
  });

  tearDown(() => bloc.close());

  // ── KanbanLoadRequested ───────────────────────────────────────────────────

  group('KanbanLoadRequested', () {
    blocTest<KanbanBloc, KanbanState>(
      'emits [Loading, Loaded] when columns exist',
      build: () {
        when(() => mockClient.query(any())).thenAnswer(
          (_) async => QueryResult(
            options: QueryOptions(document: gql('')),
            data: _columnsData,
            source: QueryResultSource.network,
          ),
        );
        return bloc;
      },
      act: (b) => b.add(const KanbanLoadRequested('proj-1')),
      expect: () => [
        isA<KanbanLoading>(),
        isA<KanbanLoaded>()
            .having((s) => s.columns.length, 'column count', 1)
            .having((s) => s.columns.first.name, 'first column name', 'To Do')
            .having((s) => s.projectId, 'projectId', 'proj-1'),
      ],
    );

    blocTest<KanbanBloc, KanbanState>(
      'emits [Loading, Empty] when no columns returned',
      build: () {
        when(() => mockClient.query(any())).thenAnswer(
          (_) async => QueryResult(
            options: QueryOptions(document: gql('')),
            data: {'projectColumns': []},
            source: QueryResultSource.network,
          ),
        );
        return bloc;
      },
      act: (b) => b.add(const KanbanLoadRequested('proj-1')),
      expect: () => [
        isA<KanbanLoading>(),
        isA<KanbanEmpty>().having((s) => s.projectId, 'projectId', 'proj-1'),
      ],
    );

    blocTest<KanbanBloc, KanbanState>(
      'emits [Loading, Error] on query failure',
      build: () {
        when(() => mockClient.query(any())).thenThrow(Exception('Network error'));
        return bloc;
      },
      act: (b) => b.add(const KanbanLoadRequested('proj-1')),
      expect: () => [
        isA<KanbanLoading>(),
        isA<KanbanError>(),
      ],
    );
  });

  // ── KanbanSeedColumnsRequested ────────────────────────────────────────────

  group('KanbanSeedColumnsRequested', () {
    blocTest<KanbanBloc, KanbanState>(
      'triggers load after successful seed mutation',
      build: () {
        when(() => mockClient.mutate(any())).thenAnswer(
          (_) async => QueryResult(
            options: QueryOptions(document: gql('')),
            data: {
              'seedDefaultColumns': [
                {'id': 'col-1', 'name': 'To Do', 'color': '#6366F1', 'position': 0},
              ],
            },
            source: QueryResultSource.network,
          ),
        );
        when(() => mockClient.query(any())).thenAnswer(
          (_) async => QueryResult(
            options: QueryOptions(document: gql('')),
            data: _columnsData,
            source: QueryResultSource.network,
          ),
        );
        return bloc;
      },
      act: (b) => b.add(const KanbanSeedColumnsRequested('proj-1')),
      expect: () => [
        isA<KanbanLoading>(),
        isA<KanbanLoaded>(),
      ],
    );

    blocTest<KanbanBloc, KanbanState>(
      'emits [Error] when seed mutation fails',
      build: () {
        when(() => mockClient.mutate(any())).thenThrow(Exception('Seed failed'));
        return bloc;
      },
      act: (b) => b.add(const KanbanSeedColumnsRequested('proj-1')),
      expect: () => [isA<KanbanError>()],
    );
  });

  // ── KanbanTaskCreateRequested ─────────────────────────────────────────────

  group('KanbanTaskCreateRequested', () {
    blocTest<KanbanBloc, KanbanState>(
      'triggers reload after task creation',
      build: () {
        when(() => mockClient.mutate(any())).thenAnswer(
          (_) async => QueryResult(
            options: QueryOptions(document: gql('')),
            data: {
              'createTask': {
                'id': 'task-2',
                'title': 'New task',
                'priority': 'MEDIUM',
                'position': 1.0,
                'columnId': 'col-1',
              },
            },
            source: QueryResultSource.network,
          ),
        );
        when(() => mockClient.query(any())).thenAnswer(
          (_) async => QueryResult(
            options: QueryOptions(document: gql('')),
            data: _columnsData,
            source: QueryResultSource.network,
          ),
        );
        return bloc;
      },
      act: (b) => b.add(const KanbanTaskCreateRequested(
        columnId: 'col-1',
        projectId: 'proj-1',
        title: 'New task',
        priority: 'MEDIUM',
      )),
      expect: () => [
        isA<KanbanLoading>(),
        isA<KanbanLoaded>(),
      ],
    );

    blocTest<KanbanBloc, KanbanState>(
      'emits [Error] when task creation fails',
      build: () {
        when(() => mockClient.mutate(any())).thenThrow(Exception('Create failed'));
        return bloc;
      },
      act: (b) => b.add(const KanbanTaskCreateRequested(
        columnId: 'col-1',
        projectId: 'proj-1',
        title: 'New task',
        priority: 'MEDIUM',
      )),
      expect: () => [isA<KanbanError>()],
    );
  });
}
