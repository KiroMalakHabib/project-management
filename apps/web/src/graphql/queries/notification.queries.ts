import { gql } from '@apollo/client';

export const MY_NOTIFICATIONS_QUERY = gql`
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
`;

export const UNREAD_COUNT_QUERY = gql`
  query UnreadNotificationCount {
    unreadNotificationCount
  }
`;
