const taskAttachmentsQuery = r'''
  query TaskAttachments($taskId: ID!) {
    taskAttachments(taskId: $taskId) {
      id
      fileName
      fileUrl
      mimeType
      fileSize
    }
  }
''';
