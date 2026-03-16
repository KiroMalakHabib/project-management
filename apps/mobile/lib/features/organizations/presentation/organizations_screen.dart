import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../domain/organizations_bloc.dart';
import '../domain/organizations_event.dart';
import '../domain/organizations_state.dart';
import '../domain/organization.dart';

class OrganizationsScreen extends StatefulWidget {
  const OrganizationsScreen({super.key});

  @override
  State<OrganizationsScreen> createState() => _OrganizationsScreenState();
}

class _OrganizationsScreenState extends State<OrganizationsScreen> {
  @override
  void initState() {
    super.initState();
    context.read<OrganizationsBloc>().add(OrganizationsLoadRequested());
  }

  void _showCreateDialog() {
    final nameController = TextEditingController();
    final slugController = TextEditingController();
    final descController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    String slugify(String text) => text
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
        .replaceAll(RegExp(r'^-|-$'), '');

    showDialog(
      context: context,
      builder: (_) => BlocProvider.value(
        value: context.read<OrganizationsBloc>(),
        child: AlertDialog(
          title: const Text('Create Organization'),
          content: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: nameController,
                    decoration: const InputDecoration(labelText: 'Name', border: OutlineInputBorder()),
                    onChanged: (v) => slugController.text = slugify(v),
                    validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: slugController,
                    decoration: const InputDecoration(labelText: 'Slug', border: OutlineInputBorder()),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Required';
                      if (!RegExp(r'^[a-z0-9-]+$').hasMatch(v)) return 'Lowercase, numbers, hyphens only';
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: descController,
                    decoration: const InputDecoration(labelText: 'Description (optional)', border: OutlineInputBorder()),
                    maxLines: 2,
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            FilledButton(
              onPressed: () {
                if (formKey.currentState!.validate()) {
                  context.read<OrganizationsBloc>().add(
                    OrganizationCreateRequested(
                      name: nameController.text.trim(),
                      slug: slugController.text.trim(),
                      description: descController.text.trim().isEmpty ? null : descController.text.trim(),
                    ),
                  );
                  Navigator.pop(context);
                }
              },
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Organizations'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _showCreateDialog,
          ),
        ],
      ),
      body: BlocBuilder<OrganizationsBloc, OrganizationsState>(
        builder: (context, state) {
          if (state is OrganizationsLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is OrganizationsError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(state.message, textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () => context.read<OrganizationsBloc>().add(OrganizationsLoadRequested()),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (state is OrganizationsLoaded) {
            if (state.organizations.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.business_outlined, size: 64, color: Colors.grey),
                    const SizedBox(height: 16),
                    const Text('No organizations yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Text('Create your first organization', style: TextStyle(color: Colors.grey[600])),
                    const SizedBox(height: 20),
                    FilledButton.icon(
                      onPressed: _showCreateDialog,
                      icon: const Icon(Icons.add),
                      label: const Text('New Organization'),
                    ),
                  ],
                ),
              );
            }

            return RefreshIndicator(
              onRefresh: () async {
                context.read<OrganizationsBloc>().add(OrganizationsLoadRequested());
              },
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: state.organizations.length,
                itemBuilder: (context, index) {
                  final org = state.organizations[index];
                  return _OrgCard(org: org);
                },
              ),
            );
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }
}

class _OrgCard extends StatelessWidget {
  final Organization org;
  const _OrgCard({required this.org});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => context.push('/organizations/${org.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Text(
                    org.name[0].toUpperCase(),
                    style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(org.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                    Text('/${org.slug}', style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                    if (org.description != null)
                      Text(
                        org.description!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}
