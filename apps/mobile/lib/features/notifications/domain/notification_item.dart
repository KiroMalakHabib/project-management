import 'package:equatable/equatable.dart';

enum NotificationType {
  taskAssigned,
  taskCommented,
  taskMentioned,
  taskDueSoon,
  memberInvited,
  memberJoined,
}

class NotificationItem extends Equatable {
  final String id;
  final NotificationType type;
  final String title;
  final String body;
  final String? resourceId;
  final String? resourceType;
  final bool isRead;
  final DateTime createdAt;

  const NotificationItem({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    this.resourceId,
    this.resourceType,
    required this.isRead,
    required this.createdAt,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['id'] as String,
      type: _notificationTypeFromString(json['type'] as String),
      title: json['title'] as String,
      body: json['body'] as String,
      resourceId: json['resourceId'] as String?,
      resourceType: json['resourceType'] as String?,
      isRead: json['isRead'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  NotificationItem copyWith({bool? isRead}) => NotificationItem(
        id: id,
        type: type,
        title: title,
        body: body,
        resourceId: resourceId,
        resourceType: resourceType,
        isRead: isRead ?? this.isRead,
        createdAt: createdAt,
      );

  @override
  List<Object?> get props => [id, isRead];
}

NotificationType _notificationTypeFromString(String value) {
  switch (value) {
    case 'TASK_ASSIGNED': return NotificationType.taskAssigned;
    case 'TASK_COMMENTED': return NotificationType.taskCommented;
    case 'TASK_MENTIONED': return NotificationType.taskMentioned;
    case 'TASK_DUE_SOON': return NotificationType.taskDueSoon;
    case 'MEMBER_INVITED': return NotificationType.memberInvited;
    case 'MEMBER_JOINED': return NotificationType.memberJoined;
    default: return NotificationType.taskAssigned;
  }
}
