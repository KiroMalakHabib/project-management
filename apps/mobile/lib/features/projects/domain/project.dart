import 'package:equatable/equatable.dart';

enum ProjectStatus { ACTIVE, ARCHIVED }

class Project extends Equatable {
  final String id;
  final String name;
  final String? description;
  final ProjectStatus status;
  final String organizationId;

  const Project({
    required this.id,
    required this.name,
    this.description,
    required this.status,
    required this.organizationId,
  });

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      status: ProjectStatus.values.firstWhere((s) => s.name == json['status']),
      organizationId: (json['organization'] as Map<String, dynamic>?)?['id'] as String? ?? '',
    );
  }

  @override
  List<Object?> get props => [id, name, status];
}
