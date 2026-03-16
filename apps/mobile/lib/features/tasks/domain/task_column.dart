import 'package:equatable/equatable.dart';
import 'task.dart';

class TaskColumn extends Equatable {
  final String id;
  final String name;
  final int position;
  final String color;
  final int? wipLimit;
  final List<Task> tasks;

  const TaskColumn({
    required this.id,
    required this.name,
    required this.position,
    required this.color,
    this.wipLimit,
    this.tasks = const [],
  });

  factory TaskColumn.fromJson(Map<String, dynamic> json) {
    final rawTasks = json['tasks'] as List? ?? [];
    final tasks = rawTasks
        .map((t) => Task.fromJson(t as Map<String, dynamic>))
        .toList()
      ..sort((a, b) => a.position.compareTo(b.position));

    return TaskColumn(
      id: json['id'] as String,
      name: json['name'] as String,
      position: json['position'] as int,
      color: json['color'] as String? ?? '#6B7280',
      wipLimit: json['wipLimit'] as int?,
      tasks: tasks,
    );
  }

  TaskColumn copyWith({List<Task>? tasks}) {
    return TaskColumn(
      id: id,
      name: name,
      position: position,
      color: color,
      wipLimit: wipLimit,
      tasks: tasks ?? this.tasks,
    );
  }

  @override
  List<Object?> get props => [id, name, position, tasks];
}
