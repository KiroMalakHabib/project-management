import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:go_router/go_router.dart';
import '../data/organization_queries.dart';
import '../../projects/data/project_queries.dart';
import '../../projects/domain/project.dart';
import '../domain/organization_member.dart';

class OrganizationDetailScreen extends StatefulWidget {
  final String orgId;
  const OrganizationDetailScreen({super.key, required this.orgId});

  @override
  State<OrganizationDetailScreen> createState() => _OrganizationDetailScreenState();
}

class _OrganizationDetailScreenState extends State<OrganizationDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Organization'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [Tab(text: 'Projects'), Tab(text: 'Members')],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _ProjectsTab(orgId: widget.orgId),
          _MembersTab(orgId: widget.orgId),
        ],
      ),
    );
  }
}

class _ProjectsTab extends StatelessWidget {
  final String orgId;
  const _ProjectsTab({required this.orgId});

  @override
  Widget build(BuildContext context) {
    return Query(
      options: QueryOptions(
        document: gql(projectsQuery),
        variables: {'organizationId': orgId},
        fetchPolicy: FetchPolicy.networkOnly,
      ),
      builder: (result, {refetch, fetchMore}) {
        if (result.isLoading) return const Center(child: CircularProgressIndicator());
        if (result.hasException) {
          return Center(child: Text(result.exception.toString()));
        }

        final projects = (result.data?['projects'] as List? ?? [])
            .map((e) => Project.fromJson(e as Map<String, dynamic>))
            .toList();

        if (projects.isEmpty) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.folder_outlined, size: 56, color: Colors.grey),
                SizedBox(height: 12),
                Text('No projects yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: projects.length,
          itemBuilder: (context, index) {
            final project = projects[index];
            return Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: BorderSide(color: Colors.grey[200]!),
              ),
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
                onTap: () => context.push('/projects/${project.id}'),
                title: Text(project.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: project.description != null
                    ? Text(project.description!, maxLines: 1, overflow: TextOverflow.ellipsis)
                    : null,
                trailing: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: project.status == ProjectStatus.ACTIVE
                        ? Colors.green[50]
                        : Colors.grey[100],
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    project.status.name,
                    style: TextStyle(
                      fontSize: 11,
                      color: project.status == ProjectStatus.ACTIVE ? Colors.green[700] : Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class _MembersTab extends StatelessWidget {
  final String orgId;
  const _MembersTab({required this.orgId});

  Color _roleColor(OrgRole role) {
    switch (role) {
      case OrgRole.OWNER: return Colors.blue;
      case OrgRole.ADMIN: return Colors.green;
      case OrgRole.MEMBER: return Colors.grey;
      case OrgRole.VIEWER: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Query(
      options: QueryOptions(
        document: gql(organizationMembersQuery),
        variables: {'organizationId': orgId},
        fetchPolicy: FetchPolicy.networkOnly,
      ),
      builder: (result, {refetch, fetchMore}) {
        if (result.isLoading) return const Center(child: CircularProgressIndicator());
        if (result.hasException) return Center(child: Text(result.exception.toString()));

        final members = (result.data?['organizationMembers'] as List? ?? [])
            .map((e) => OrganizationMember.fromJson(e as Map<String, dynamic>))
            .toList();

        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: members.length,
          separatorBuilder: (_, __) => const Divider(height: 1),
          itemBuilder: (context, index) {
            final member = members[index];
            return ListTile(
              leading: CircleAvatar(
                backgroundColor: const Color(0xFFDBEAFE),
                child: Text(
                  member.user.fullName[0].toUpperCase(),
                  style: const TextStyle(color: Color(0xFF1E40AF), fontWeight: FontWeight.bold),
                ),
              ),
              title: Text(member.user.fullName),
              subtitle: Text(member.user.email, style: const TextStyle(fontSize: 12)),
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: _roleColor(member.role).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  member.role.name,
                  style: TextStyle(
                    fontSize: 11,
                    color: _roleColor(member.role),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}
