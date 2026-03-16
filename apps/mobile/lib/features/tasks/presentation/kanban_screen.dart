import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/kanban_bloc.dart';
import '../domain/kanban_event.dart';
import '../domain/kanban_state.dart';
import '../domain/task_column.dart';
import '../domain/task.dart';
import 'task_detail_screen.dart';
import 'create_task_sheet.dart';

class KanbanScreen extends StatefulWidget {
  final String projectId;
  final String projectName;

  const KanbanScreen({
    super.key,
    required this.projectId,
    required this.projectName,
  });

  @override
  State<KanbanScreen> createState() => _KanbanScreenState();
}

class _KanbanScreenState extends State<KanbanScreen> {
  @override
  void initState() {
    super.initState();
    context.read<KanbanBloc>().add(KanbanLoadRequested(widget.projectId));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.projectName),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<KanbanBloc>().add(KanbanLoadRequested(widget.projectId)),
          ),
        ],
      ),
      body: BlocBuilder<KanbanBloc, KanbanState>(
        builder: (context, state) {
          if (state is KanbanLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is KanbanError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(state.message, textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () => context.read<KanbanBloc>().add(KanbanLoadRequested(widget.projectId)),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (state is KanbanEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.view_kanban_outlined, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text('No board set up yet',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text('Create default columns to get started',
                      style: TextStyle(color: Colors.grey[600])),
                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: () => context.read<KanbanBloc>().add(
                          KanbanSeedColumnsRequested(widget.projectId),
                        ),
                    child: const Text('Create Default Columns'),
                  ),
                ],
              ),
            );
          }

          if (state is KanbanLoaded) {
            return RefreshIndicator(
              onRefresh: () async {
                context.read<KanbanBloc>().add(KanbanLoadRequested(widget.projectId));
              },
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.all(16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: state.columns.map((col) {
                    return _KanbanColumnWidget(
                      column: col,
                      projectId: widget.projectId,
                    );
                  }).toList(),
                ),
              ),
            );
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }
}

class _KanbanColumnWidget extends StatelessWidget {
  final TaskColumn column;
  final String projectId;

  const _KanbanColumnWidget({required this.column, required this.projectId});

  Color _hexColor(String hex) {
    final h = hex.replaceAll('#', '');
    return Color(int.parse('FF$h', radix: 16));
  }

  void _showAddTask(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => BlocProvider.value(
        value: context.read<KanbanBloc>(),
        child: CreateTaskSheet(columnId: column.id, projectId: projectId),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 280,
      margin: const EdgeInsets.only(right: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Column header
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: _hexColor(column.color),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  column.name,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${column.tasks.length}',
                    style: const TextStyle(fontSize: 11, color: Colors.grey),
                  ),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: () => _showAddTask(context),
                  child: const Icon(Icons.add, size: 18, color: Colors.grey),
                ),
              ],
            ),
          ),
          // Task cards
          ...column.tasks.map((task) => _TaskCardWidget(task: task)),
          // Empty state
          if (column.tasks.isEmpty)
            Container(
              margin: const EdgeInsets.only(top: 4),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey[200]!, style: BorderStyle.solid),
              ),
              child: const Center(
                child: Text('No tasks', style: TextStyle(color: Colors.grey, fontSize: 12)),
              ),
            ),
        ],
      ),
    );
  }
}

class _TaskCardWidget extends StatelessWidget {
  final Task task;
  const _TaskCardWidget({required this.task});

  Color _priorityColor(TaskPriority p) {
    switch (p) {
      case TaskPriority.LOW: return Colors.grey;
      case TaskPriority.MEDIUM: return Colors.blue;
      case TaskPriority.HIGH: return Colors.orange;
      case TaskPriority.URGENT: return Colors.red;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isOverdue = task.dueDate != null && task.dueDate!.isBefore(DateTime.now());

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => TaskDetailScreen(taskId: task.id),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.grey[200]!),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              task.title,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _priorityColor(task.priority),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  task.priority.name,
                  style: TextStyle(
                    fontSize: 11,
                    color: _priorityColor(task.priority),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (task.dueDate != null) ...[
                  const Spacer(),
                  Text(
                    '${task.dueDate!.day}/${task.dueDate!.month}',
                    style: TextStyle(
                      fontSize: 11,
                      color: isOverdue ? Colors.red : Colors.grey,
                    ),
                  ),
                ],
                if (task.assignee != null) ...[
                  const Spacer(),
                  CircleAvatar(
                    radius: 10,
                    backgroundColor: const Color(0xFFDBEAFE),
                    child: Text(
                      task.assignee!.fullName[0].toUpperCase(),
                      style: const TextStyle(fontSize: 9, color: Color(0xFF1E40AF), fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
