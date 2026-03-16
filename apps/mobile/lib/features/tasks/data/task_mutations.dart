const createTaskMutation = r'''
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      title
      priority
      position
      columnId
    }
  }
''';

const moveTaskMutation = r'''
  mutation MoveTask($input: MoveTaskInput!) {
    moveTask(input: $input) {
      id
      columnId
      position
    }
  }
''';

const addCommentMutation = r'''
  mutation AddComment($taskId: ID!, $body: String!) {
    addComment(taskId: $taskId, body: $body) {
      id
      body
      isEdited
      createdAt
      author { id fullName avatarUrl }
    }
  }
''';

const seedDefaultColumnsMutation = r'''
  mutation SeedDefaultColumns($projectId: ID!) {
    seedDefaultColumns(projectId: $projectId) {
      id
      name
      color
      position
    }
  }
''';
