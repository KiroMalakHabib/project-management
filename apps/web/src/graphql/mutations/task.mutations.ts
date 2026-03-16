import { gql } from '@apollo/client';

export const CREATE_TASK_MUTATION = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      title
      priority
      position
      columnId
    }
  }
`;

export const UPDATE_TASK_MUTATION = gql`
  mutation UpdateTask($input: UpdateTaskInput!) {
    updateTask(input: $input) {
      id
      title
      description
      priority
      dueDate
      assignee { id fullName avatarUrl }
    }
  }
`;

export const MOVE_TASK_MUTATION = gql`
  mutation MoveTask($input: MoveTaskInput!) {
    moveTask(input: $input) {
      id
      columnId
      position
    }
  }
`;

export const DELETE_TASK_MUTATION = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`;

export const ADD_COMMENT_MUTATION = gql`
  mutation AddComment($taskId: ID!, $body: String!) {
    addComment(taskId: $taskId, body: $body) {
      id
      body
      isEdited
      createdAt
      author { id fullName avatarUrl }
    }
  }
`;

export const DELETE_COMMENT_MUTATION = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`;

export const SEED_DEFAULT_COLUMNS_MUTATION = gql`
  mutation SeedDefaultColumns($projectId: ID!) {
    seedDefaultColumns(projectId: $projectId) {
      id
      name
      color
      position
    }
  }
`;
