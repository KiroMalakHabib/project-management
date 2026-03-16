const projectsQuery = r'''
  query Projects($organizationId: ID!) {
    projects(organizationId: $organizationId) {
      id
      name
      description
      status
      createdAt
      organization {
        id
        name
      }
    }
  }
''';
