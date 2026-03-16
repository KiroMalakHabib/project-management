const myNotificationsQuery = r'''
  query MyNotifications {
    myNotifications {
      id
      type
      title
      body
      resourceId
      resourceType
      isRead
      createdAt
    }
  }
''';

const unreadCountQuery = r'''
  query UnreadNotificationCount {
    unreadNotificationCount
  }
''';
