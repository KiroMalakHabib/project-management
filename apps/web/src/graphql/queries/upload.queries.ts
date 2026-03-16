import { gql } from '@apollo/client';

export const TASK_ATTACHMENTS_QUERY = gql`
  query TaskAttachments($taskId: ID!) {
    taskAttachments(taskId: $taskId) {
      id
      fileName
      fileUrl
      mimeType
      fileSize
      createdAt
      uploader {
        id
        fullName
      }
    }
  }
`;
