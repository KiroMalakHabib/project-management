import { gql } from '@apollo/client';

export const CREATE_ORGANIZATION_MUTATION = gql`
  mutation CreateOrganization($input: CreateOrganizationInput!) {
    createOrganization(input: $input) {
      id
      name
      slug
    }
  }
`;

export const INVITE_MEMBER_MUTATION = gql`
  mutation InviteMember($organizationId: ID!, $input: InviteMemberInput!) {
    inviteMember(organizationId: $organizationId, input: $input) {
      id
      invitedEmail
      role
      createdAt
    }
  }
`;

export const ACCEPT_INVITE_MUTATION = gql`
  mutation AcceptInvite($token: String!) {
    acceptInvite(token: $token) {
      id
      role
      organization {
        id
        name
        slug
      }
    }
  }
`;

export const UPDATE_MEMBER_ROLE_MUTATION = gql`
  mutation UpdateMemberRole($organizationId: ID!, $userId: ID!, $role: OrgRole!) {
    updateMemberRole(organizationId: $organizationId, userId: $userId, role: $role) {
      id
      role
    }
  }
`;

export const REMOVE_MEMBER_MUTATION = gql`
  mutation RemoveMember($organizationId: ID!, $userId: ID!) {
    removeMember(organizationId: $organizationId, userId: $userId)
  }
`;
