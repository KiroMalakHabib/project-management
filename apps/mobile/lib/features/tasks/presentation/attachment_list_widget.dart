import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../data/upload_mutations.dart';

class AttachmentListWidget extends StatelessWidget {
  final List<Map<String, dynamic>> attachments;
  final VoidCallback onDeleted;

  const AttachmentListWidget({
    super.key,
    required this.attachments,
    required this.onDeleted,
  });

  IconData _iconForMime(String mimeType) {
    if (mimeType.startsWith('image/')) return Icons.image_outlined;
    if (mimeType == 'application/pdf') return Icons.picture_as_pdf_outlined;
    if (mimeType.contains('zip') || mimeType.contains('compressed')) {
      return Icons.folder_zip_outlined;
    }
    if (mimeType.startsWith('text/')) return Icons.text_snippet_outlined;
    return Icons.attach_file;
  }

  String _formatSize(int bytes) {
    if (bytes < 1024) return '${bytes}B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)}KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)}MB';
  }

  @override
  Widget build(BuildContext context) {
    if (attachments.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Text(
          'No attachments',
          style: TextStyle(fontSize: 13, color: Colors.grey.shade500),
        ),
      );
    }

    return Column(
      children: attachments.map((a) {
        final id = a['id'] as String;
        final fileName = a['fileName'] as String;
        final fileUrl = a['fileUrl'] as String;
        final mimeType = a['mimeType'] as String? ?? '';
        final fileSize = a['fileSize'] as int? ?? 0;

        return Mutation(
          options: MutationOptions(
            document: gql(deleteAttachmentMutation),
            onCompleted: (_) => onDeleted(),
          ),
          builder: (runDelete, result) {
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                border: Border.all(color: Colors.grey.shade200),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(_iconForMime(mimeType), size: 20, color: const Color(0xFF2563EB)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          fileName,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          _formatSize(fileSize),
                          style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.download_outlined, size: 18),
                    color: Colors.grey.shade600,
                    onPressed: () {
                      // Open fileUrl in browser / share
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Download: $fileUrl')),
                      );
                    },
                    tooltip: 'Download',
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                  ),
                  IconButton(
                    icon: result?.isLoading == true
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.delete_outline, size: 18),
                    color: Colors.red.shade400,
                    onPressed: result?.isLoading == true
                        ? null
                        : () => showDialog(
                              context: context,
                              builder: (ctx) => AlertDialog(
                                title: const Text('Delete attachment?'),
                                content: Text('Remove "$fileName"?'),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.pop(ctx),
                                    child: const Text('Cancel'),
                                  ),
                                  TextButton(
                                    onPressed: () {
                                      Navigator.pop(ctx);
                                      runDelete({'attachmentId': id});
                                    },
                                    child: const Text('Delete', style: TextStyle(color: Colors.red)),
                                  ),
                                ],
                              ),
                            ),
                    tooltip: 'Delete',
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                  ),
                ],
              ),
            );
          },
        );
      }).toList(),
    );
  }
}
