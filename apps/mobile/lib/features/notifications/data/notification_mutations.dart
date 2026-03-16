const markNotificationReadMutation = r'''
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) {
      id
      isRead
    }
  }
''';

const markAllReadMutation = r'''
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
''';

const deleteNotificationMutation = r'''
  mutation DeleteNotification($id: ID!) {
    deleteNotification(id: $id)
  }
''';
