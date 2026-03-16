const taskEventsSubscription = r'''
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
''';
