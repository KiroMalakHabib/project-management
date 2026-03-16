import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/notifications_bloc.dart';
import '../domain/notifications_event.dart';
import '../domain/notifications_state.dart';
import '../domain/notification_item.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    context.read<NotificationsBloc>().add(NotificationsLoadRequested());
  }

  String _typeIcon(NotificationType type) {
    switch (type) {
      case NotificationType.taskAssigned: return '👤';
      case NotificationType.taskCommented: return '💬';
      case NotificationType.taskMentioned: return '@';
      case NotificationType.taskDueSoon: return '⏰';
      case NotificationType.memberInvited: return '✉️';
      case NotificationType.memberJoined: return '🎉';
    }
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          BlocBuilder<NotificationsBloc, NotificationsState>(
            builder: (context, state) {
              if (state is NotificationsLoaded && state.unreadCount > 0) {
                return TextButton(
                  onPressed: () => context.read<NotificationsBloc>().add(
                        NotificationsMarkAllReadRequested(),
                      ),
                  child: const Text('Mark all read', style: TextStyle(fontSize: 13)),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: BlocBuilder<NotificationsBloc, NotificationsState>(
        builder: (context, state) {
          if (state is NotificationsLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is NotificationsError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(state.message, textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () => context.read<NotificationsBloc>().add(NotificationsLoadRequested()),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (state is NotificationsLoaded) {
            if (state.notifications.isEmpty) {
              return const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('🔔', style: TextStyle(fontSize: 48)),
                    SizedBox(height: 16),
                    Text('No notifications yet',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    SizedBox(height: 4),
                    Text("You're all caught up!", style: TextStyle(color: Colors.grey)),
                  ],
                ),
              );
            }

            return RefreshIndicator(
              onRefresh: () async => context.read<NotificationsBloc>().add(NotificationsLoadRequested()),
              child: ListView.separated(
                itemCount: state.notifications.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final notif = state.notifications[index];
                  return Dismissible(
                    key: Key(notif.id),
                    direction: DismissDirection.endToStart,
                    background: Container(
                      color: Colors.red[400],
                      alignment: Alignment.centerRight,
                      padding: const EdgeInsets.only(right: 16),
                      child: const Icon(Icons.delete_outline, color: Colors.white),
                    ),
                    onDismissed: (_) => context
                        .read<NotificationsBloc>()
                        .add(NotificationDeleteRequested(notif.id)),
                    child: InkWell(
                      onTap: () {
                        if (!notif.isRead) {
                          context.read<NotificationsBloc>().add(
                                NotificationMarkReadRequested(notif.id),
                              );
                        }
                      },
                      child: Container(
                        color: notif.isRead ? null : const Color(0xFFF0F7FF),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: Colors.grey[100],
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(
                                  _typeIcon(notif.type),
                                  style: const TextStyle(fontSize: 16),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    notif.title,
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: notif.isRead ? FontWeight.normal : FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    notif.body,
                                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    _timeAgo(notif.createdAt),
                                    style: const TextStyle(fontSize: 11, color: Colors.grey),
                                  ),
                                ],
                              ),
                            ),
                            if (!notif.isRead)
                              Container(
                                width: 8,
                                height: 8,
                                margin: const EdgeInsets.only(top: 4),
                                decoration: const BoxDecoration(
                                  color: Color(0xFF2563EB),
                                  shape: BoxShape.circle,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  );
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
