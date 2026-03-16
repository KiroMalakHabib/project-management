import { gql } from '@apollo/client';

export const MY_ORGANIZATIONS_QUERY = gql`
  query MyOrganizations {
    myOrganizations {
      id
      name
      slug
      description
      logoUrl
      createdAt
    }
  }
`;

export const ORGANIZATION_QUERY = gql`
  query Organization($id: ID!) {
    organization(id: $id) {
      id
      name
      slug
      description
      logoUrl
      createdAt
    }
  }
`;

export const ORGANIZATION_MEMBERS_QUERY = gql`
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
`;
