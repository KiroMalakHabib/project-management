import 'package:equatable/equatable.dart';
import '../../auth/domain/auth_user.dart';

enum OrgRole { OWNER, ADMIN, MEMBER, VIEWER }

class OrganizationMember extends Equatable {
  final String id;
  final OrgRole role;
  final AuthUser user;
  final DateTime joinedAt;

  const OrganizationMember({
    required this.id,
    required this.role,
    required this.user,
    required this.joinedAt,
  });

  factory OrganizationMember.fromJson(Map<String, dynamic> json) {
    return OrganizationMember(
      id: json['id'] as String,
      role: OrgRole.values.firstWhere((r) => r.name == json['role']),
      user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
      joinedAt: DateTime.parse(json['joinedAt'] as String),
    );
  }

  @override
  List<Object?> get props => [id, role, user];
}
