import 'package:equatable/equatable.dart';
import 'task_column.dart';

abstract class KanbanState extends Equatable {
  const KanbanState();
  @override
  List<Object?> get props => [];
}

class KanbanInitial extends KanbanState {}
class KanbanLoading extends KanbanState {}

class KanbanLoaded extends KanbanState {
  final List<TaskColumn> columns;
  final String projectId;
  const KanbanLoaded({required this.columns, required this.projectId});
  @override
  List<Object?> get props => [columns, projectId];
}

class KanbanEmpty extends KanbanState {
  final String projectId;
  const KanbanEmpty(this.projectId);
  @override
  List<Object?> get props => [projectId];
}

class KanbanError extends KanbanState {
  final String message;
  const KanbanError(this.message);
  @override
  List<Object?> get props => [message];
}
