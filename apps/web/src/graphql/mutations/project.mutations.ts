import { gql } from '@apollo/client';

export const CREATE_PROJECT_MUTATION = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      description
      status
    }
  }
`;

export const ARCHIVE_PROJECT_MUTATION = gql`
  mutation ArchiveProject($id: ID!) {
    archiveProject(id: $id) {
      id
      status
    }
  }
`;
