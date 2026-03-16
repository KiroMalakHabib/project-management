const generatePresignedUrlMutation = r'''
  mutation GeneratePresignedUrl($input: PresignedUrlInput!) {
    generatePresignedUrl(input: $input) {
      uploadUrl
      fileKey
      publicUrl
    }
  }
''';

const confirmAttachmentMutation = r'''
  mutation ConfirmAttachment($input: ConfirmAttachmentInput!) {
    confirmAttachment(input: $input) {
      id
      fileName
      fileUrl
      mimeType
      fileSize
    }
  }
''';

const deleteAttachmentMutation = r'''
  mutation DeleteAttachment($attachmentId: ID!) {
    deleteAttachment(attachmentId: $attachmentId)
  }
''';
