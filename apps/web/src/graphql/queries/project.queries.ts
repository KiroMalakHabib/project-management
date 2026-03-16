import { gql } from '@apollo/client';

export const PROJECTS_QUERY = gql`
  query Projects($organizationId: ID!) {
    projects(organizationId: $organizationId) {
      id
      name
      description
      status
      createdAt
    }
  }
`;

export const PROJECT_QUERY = gql`
  query Project($id: ID!) {
    project(id: $id) {
      id
      name
      description
      status
      createdAt
      organization {
        id
        name
        slug
      }
    }
  }
`;
