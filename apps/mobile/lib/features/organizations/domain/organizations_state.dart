import 'package:equatable/equatable.dart';
import 'organization.dart';

abstract class OrganizationsState extends Equatable {
  const OrganizationsState();
  @override
  List<Object?> get props => [];
}

class OrganizationsInitial extends OrganizationsState {}
class OrganizationsLoading extends OrganizationsState {}

class OrganizationsLoaded extends OrganizationsState {
  final List<Organization> organizations;
  const OrganizationsLoaded(this.organizations);
  @override
  List<Object?> get props => [organizations];
}

class OrganizationsError extends OrganizationsState {
  final String message;
  const OrganizationsError(this.message);
  @override
  List<Object?> get props => [message];
}
