const myOrganizationsQuery = r'''
  query MyOrganizations {
    myOrganizations {
      id
      name
      slug
      description
      logoUrl
    }
  }
''';

const organizationMembersQuery = r'''
  query OrganizationMembers($organizationId: ID!) {
    organizationMembers(organizationId: $organizationId) {
      id
      role
      joinedAt
      user {
        id
        email
        fullName
        avatarUrl
      }
    }
  }
''';
