import 'package:equatable/equatable.dart';

abstract class KanbanEvent extends Equatable {
  const KanbanEvent();
  @override
  List<Object?> get props => [];
}

class KanbanLoadRequested extends KanbanEvent {
  final String projectId;
  const KanbanLoadRequested(this.projectId);
  @override
  List<Object?> get props => [projectId];
}

class KanbanSeedColumnsRequested extends KanbanEvent {
  final String projectId;
  const KanbanSeedColumnsRequested(this.projectId);
  @override
  List<Object?> get props => [projectId];
}

class KanbanTaskCreateRequested extends KanbanEvent {
  final String columnId;
  final String projectId;
  final String title;
  final String priority;

  const KanbanTaskCreateRequested({
    required this.columnId,
    required this.projectId,
    required this.title,
    required this.priority,
  });
  @override
  List<Object?> get props => [columnId, title];
}
