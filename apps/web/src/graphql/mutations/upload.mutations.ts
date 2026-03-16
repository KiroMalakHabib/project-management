import { gql } from '@apollo/client';

export const GENERATE_PRESIGNED_URL_MUTATION = gql`
  mutation GeneratePresignedUrl($input: PresignedUrlInput!) {
    generatePresignedUrl(input: $input) {
      uploadUrl
      fileKey
      publicUrl
    }
  }
`;

export const CONFIRM_ATTACHMENT_MUTATION = gql`
  mutation ConfirmAttachment($input: ConfirmAttachmentInput!) {
    confirmAttachment(input: $input) {
      id
      fileName
      fileUrl
      mimeType
      fileSize
      createdAt
      uploader {
        id
        fullName
      }
    }
  }
`;

export const DELETE_ATTACHMENT_MUTATION = gql`
  mutation DeleteAttachment($id: ID!) {
    deleteAttachment(id: $id)
  }
`;
