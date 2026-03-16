const createOrganizationMutation = r'''
  mutation CreateOrganization($input: CreateOrganizationInput!) {
    createOrganization(input: $input) {
      id
      name
      slug
    }
  }
''';

const inviteMemberMutation = r'''
  mutation InviteMember($organizationId: ID!, $input: InviteMemberInput!) {
    inviteMember(organizationId: $organizationId, input: $input) {
      id
      invitedEmail
      role
    }
  }
''';
