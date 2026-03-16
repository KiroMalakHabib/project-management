import 'package:equatable/equatable.dart';

enum TaskPriority { LOW, MEDIUM, HIGH, URGENT }

class TaskAssignee extends Equatable {
  final String id;
  final String fullName;
  final String? avatarUrl;

  const TaskAssignee({required this.id, required this.fullName, this.avatarUrl});

  factory TaskAssignee.fromJson(Map<String, dynamic> json) => TaskAssignee(
        id: json['id'] as String,
        fullName: json['fullName'] as String,
        avatarUrl: json['avatarUrl'] as String?,
      );

  @override
  List<Object?> get props => [id];
}

class TaskComment extends Equatable {
  final String id;
  final String body;
  final bool isEdited;
  final DateTime createdAt;
  final TaskAssignee author;

  const TaskComment({
    required this.id,
    required this.body,
    required this.isEdited,
    required this.createdAt,
    required this.author,
  });

  factory TaskComment.fromJson(Map<String, dynamic> json) => TaskComment(
        id: json['id'] as String,
        body: json['body'] as String,
        isEdited: json['isEdited'] as bool? ?? false,
        createdAt: DateTime.parse(json['createdAt'] as String),
        author: TaskAssignee.fromJson(json['author'] as Map<String, dynamic>),
      );

  @override
  List<Object?> get props => [id];
}

class Task extends Equatable {
  final String id;
  final String title;
  final String? description;
  final TaskPriority priority;
  final double position;
  final String columnId;
  final String projectId;
  final DateTime? dueDate;
  final TaskAssignee? assignee;
  final List<TaskComment> comments;

  const Task({
    required this.id,
    required this.title,
    this.description,
    required this.priority,
    required this.position,
    required this.columnId,
    required this.projectId,
    this.dueDate,
    this.assignee,
    this.comments = const [],
  });

  factory Task.fromJson(Map<String, dynamic> json) {
    return Task(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      priority: TaskPriority.values.firstWhere(
        (p) => p.name == (json['priority'] as String? ?? 'MEDIUM'),
        orElse: () => TaskPriority.MEDIUM,
      ),
      position: (json['position'] as num?)?.toDouble() ?? 0,
      columnId: json['columnId'] as String,
      projectId: json['projectId'] as String? ?? '',
      dueDate: json['dueDate'] != null ? DateTime.parse(json['dueDate'] as String) : null,
      assignee: json['assignee'] != null
          ? TaskAssignee.fromJson(json['assignee'] as Map<String, dynamic>)
          : null,
      comments: (json['comments'] as List? ?? [])
          .map((c) => TaskComment.fromJson(c as Map<String, dynamic>))
          .toList(),
    );
  }

  @override
  List<Object?> get props => [id, title, priority, position, columnId];
}
