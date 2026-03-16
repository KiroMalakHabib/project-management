import { gql } from '@apollo/client';

export const PROJECT_COLUMNS_QUERY = gql`
  query ProjectColumns($projectId: ID!) {
    projectColumns(projectId: $projectId) {
      id
      name
      position
      color
      wipLimit
      tasks {
        id
        title
        priority
        position
        dueDate
        columnId
        assignee {
          id
          fullName
          avatarUrl
        }
      }
    }
  }
`;

export const TASK_QUERY = gql`
  query Task($id: ID!) {
    task(id: $id) {
      id
      title
      description
      priority
      dueDate
      createdAt
      updatedAt
      columnId
      projectId
      assignee {
        id
        fullName
        avatarUrl
        email
      }
      reporter {
        id
        fullName
        avatarUrl
      }
      comments {
        id
        body
        isEdited
        createdAt
        author {
          id
          fullName
          avatarUrl
        }
      }
      attachments {
        id
        fileName
        fileUrl
        mimeType
        fileSize
        createdAt
      }
    }
  }
`;

export const TASK_COMMENTS_QUERY = gql`
  query TaskComments($taskId: ID!) {
    taskComments(taskId: $taskId) {
      id
      body
      isEdited
      createdAt
      author {
        id
        fullName
        avatarUrl
      }
    }
  }
`;
