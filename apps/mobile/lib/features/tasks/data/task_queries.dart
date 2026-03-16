const projectColumnsQuery = r'''
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
        columnId
        dueDate
        assignee {
          id
          fullName
          avatarUrl
        }
      }
    }
  }
''';

const taskDetailQuery = r'''
  query Task($id: ID!) {
    task(id: $id) {
      id
      title
      description
      priority
      position
      columnId
      projectId
      dueDate
      createdAt
      assignee { id fullName avatarUrl }
      reporter { id fullName avatarUrl }
      comments {
        id
        body
        isEdited
        createdAt
        author { id fullName avatarUrl }
      }
      attachments {
        id
        fileName
        fileUrl
        mimeType
        fileSize
      }
    }
  }
''';
