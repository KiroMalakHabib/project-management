const createProjectMutation = r'''
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      description
      status
    }
  }
''';
