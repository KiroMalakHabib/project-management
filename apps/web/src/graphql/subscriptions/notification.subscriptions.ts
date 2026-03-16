import { gql } from '@apollo/client';

export const NOTIFICATION_RECEIVED_SUBSCRIPTION = gql`
  subscription NotificationReceived {
    notificationReceived {
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
