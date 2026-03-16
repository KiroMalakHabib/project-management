import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../data/task_queries.dart';
import '../data/task_mutations.dart';
import 'kanban_event.dart';
import 'kanban_state.dart';
import 'task_column.dart';

class KanbanBloc extends Bloc<KanbanEvent, KanbanState> {
  final GraphQLClient _client;

  KanbanBloc({required GraphQLClient client})
      : _client = client,
        super(KanbanInitial()) {
    on<KanbanLoadRequested>(_onLoad);
    on<KanbanSeedColumnsRequested>(_onSeedColumns);
    on<KanbanTaskCreateRequested>(_onCreateTask);
  }

  Future<void> _onLoad(KanbanLoadRequested event, Emitter<KanbanState> emit) async {
    emit(KanbanLoading());
    try {
      final result = await _client.query(
        QueryOptions(
          document: gql(projectColumnsQuery),
          variables: {'projectId': event.projectId},
          fetchPolicy: FetchPolicy.networkOnly,
        ),
      );
      if (result.hasException) throw Exception(result.exception.toString());

      final cols = (result.data!['projectColumns'] as List)
          .map((c) => TaskColumn.fromJson(c as Map<String, dynamic>))
          .toList()
        ..sort((a, b) => a.position.compareTo(b.position));

      if (cols.isEmpty) {
        emit(KanbanEmpty(event.projectId));
      } else {
        emit(KanbanLoaded(columns: cols, projectId: event.projectId));
      }
    } catch (e) {
      emit(KanbanError(e.toString()));
    }
  }

  Future<void> _onSeedColumns(KanbanSeedColumnsRequested event, Emitter<KanbanState> emit) async {
    try {
      final result = await _client.mutate(
        MutationOptions(
          document: gql(seedDefaultColumnsMutation),
          variables: {'projectId': event.projectId},
        ),
      );
      if (result.hasException) throw Exception(result.exception.toString());
      add(KanbanLoadRequested(event.projectId));
    } catch (e) {
      emit(KanbanError(e.toString()));
    }
  }

  Future<void> _onCreateTask(KanbanTaskCreateRequested event, Emitter<KanbanState> emit) async {
    try {
      final result = await _client.mutate(
        MutationOptions(
          document: gql(createTaskMutation),
          variables: {
            'input': {
              'columnId': event.columnId,
              'projectId': event.projectId,
              'title': event.title,
              'priority': event.priority,
            },
          },
        ),
      );
      if (result.hasException) throw Exception(result.exception.toString());
      // Reload the board
      add(KanbanLoadRequested(event.projectId));
    } catch (e) {
      emit(KanbanError(e.toString()));
    }
  }
}
