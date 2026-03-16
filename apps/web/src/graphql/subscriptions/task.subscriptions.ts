import { gql } from '@apollo/client';

export const TASK_EVENTS_SUBSCRIPTION = gql`
  subscription TaskEvents($projectId: ID!) {
    taskEvents(projectId: $projectId) {
      event
      task {
        id
        title
        priority
        position
        columnId
        assignee { id fullName avatarUrl }
      }
    }
  }
`;

export const COMMENT_ADDED_SUBSCRIPTION = gql`
  subscription CommentAdded($taskId: ID!) {
    commentAdded(taskId: $taskId) {
      id
      body
      isEdited
      createdAt
      author { id fullName avatarUrl }
    }
  }
`;
