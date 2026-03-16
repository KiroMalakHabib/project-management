import 'package:equatable/equatable.dart';

abstract class OrganizationsEvent extends Equatable {
  const OrganizationsEvent();
  @override
  List<Object?> get props => [];
}

class OrganizationsLoadRequested extends OrganizationsEvent {}

class OrganizationCreateRequested extends OrganizationsEvent {
  final String name;
  final String slug;
  final String? description;
  const OrganizationCreateRequested({required this.name, required this.slug, this.description});
  @override
  List<Object?> get props => [name, slug];
}
