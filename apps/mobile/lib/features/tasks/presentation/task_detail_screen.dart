import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../data/task_queries.dart';
import '../data/task_mutations.dart';
import '../domain/task.dart';

class TaskDetailScreen extends StatefulWidget {
  final String taskId;
  const TaskDetailScreen({super.key, required this.taskId});

  @override
  State<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends State<TaskDetailScreen> {
  final _commentController = TextEditingController();

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

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
    return Query(
      options: QueryOptions(
        document: gql(taskDetailQuery),
        variables: {'id': widget.taskId},
        fetchPolicy: FetchPolicy.networkOnly,
      ),
      builder: (result, {refetch, fetchMore}) {
        if (result.isLoading) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }

        if (result.hasException || result.data == null) {
          return Scaffold(
            appBar: AppBar(),
            body: Center(child: Text(result.exception?.toString() ?? 'Error')),
          );
        }

        final task = Task.fromJson(result.data!['task'] as Map<String, dynamic>);

        return Scaffold(
          appBar: AppBar(
            title: const Text('Task'),
            actions: [
              Container(
                margin: const EdgeInsets.only(right: 12),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _priorityColor(task.priority).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  task.priority.name,
                  style: TextStyle(
                    color: _priorityColor(task.priority),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Title
              Text(task.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),

              // Meta row
              if (task.dueDate != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(children: [
                    const Icon(Icons.calendar_today_outlined, size: 14, color: Colors.grey),
                    const SizedBox(width: 6),
                    Text(
                      'Due ${task.dueDate!.day}/${task.dueDate!.month}/${task.dueDate!.year}',
                      style: const TextStyle(fontSize: 13, color: Colors.grey),
                    ),
                  ]),
                ),

              // Assignee
              if (task.assignee != null) ...[
                const SizedBox(height: 4),
                Row(children: [
                  const Icon(Icons.person_outline, size: 14, color: Colors.grey),
                  const SizedBox(width: 6),
                  Text(task.assignee!.fullName, style: const TextStyle(fontSize: 13, color: Colors.grey)),
                ]),
              ],

              // Description
              const SizedBox(height: 20),
              const Text('Description', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Text(
                task.description?.isNotEmpty == true ? task.description! : 'No description',
                style: TextStyle(
                  fontSize: 14,
                  color: task.description?.isNotEmpty == true ? Colors.black87 : Colors.grey,
                ),
              ),

              // Comments
              const SizedBox(height: 24),
              Text(
                'Comments (${task.comments.length})',
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 10),
              ...task.comments.map((comment) => _CommentTile(comment: comment)),

              // Add comment
              const SizedBox(height: 12),
              Mutation(
                options: MutationOptions(document: gql(addCommentMutation)),
                builder: (runMutation, mutationResult) {
                  return Row(children: [
                    Expanded(
                      child: TextField(
                        controller: _commentController,
                        decoration: const InputDecoration(
                          hintText: 'Add a comment...',
                          border: OutlineInputBorder(),
                          isDense: true,
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        ),
                        onSubmitted: (v) {
                          if (v.trim().isEmpty) return;
                          runMutation({'taskId': widget.taskId, 'body': v.trim()});
                          _commentController.clear();
                          Future.delayed(const Duration(milliseconds: 500), () => refetch?.call());
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      onPressed: () {
                        final text = _commentController.text.trim();
                        if (text.isEmpty) return;
                        runMutation({'taskId': widget.taskId, 'body': text});
                        _commentController.clear();
                        Future.delayed(const Duration(milliseconds: 500), () => refetch?.call());
                      },
                      icon: const Icon(Icons.send),
                      color: const Color(0xFF2563EB),
                    ),
                  ]);
                },
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }
}

class _CommentTile extends StatelessWidget {
  final TaskComment comment;
  const _CommentTile({required this.comment});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor: const Color(0xFFDBEAFE),
            child: Text(
              comment.author.fullName[0].toUpperCase(),
              style: const TextStyle(fontSize: 11, color: Color(0xFF1E40AF), fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Text(comment.author.fullName, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(width: 6),
                  Text(
                    '${comment.createdAt.day}/${comment.createdAt.month}',
                    style: const TextStyle(fontSize: 11, color: Colors.grey),
                  ),
                  if (comment.isEdited)
                    const Text(' (edited)', style: TextStyle(fontSize: 10, color: Colors.grey)),
                ]),
                const SizedBox(height: 2),
                Text(comment.body, style: const TextStyle(fontSize: 13)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
