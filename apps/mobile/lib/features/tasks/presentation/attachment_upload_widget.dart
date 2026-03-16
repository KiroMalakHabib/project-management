import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:http/http.dart' as http;
import '../data/upload_mutations.dart';

const _allowedMimeTypes = {
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/zip',
};

const _maxFileSize = 10 * 1024 * 1024; // 10 MB

class AttachmentUploadWidget extends StatefulWidget {
  final String taskId;
  final VoidCallback onUploaded;

  const AttachmentUploadWidget({
    super.key,
    required this.taskId,
    required this.onUploaded,
  });

  @override
  State<AttachmentUploadWidget> createState() => _AttachmentUploadWidgetState();
}

class _UploadItem {
  final String fileName;
  final double progress; // 0.0 – 1.0
  final bool done;
  final String? error;

  const _UploadItem({
    required this.fileName,
    this.progress = 0,
    this.done = false,
    this.error,
  });

  _UploadItem copyWith({double? progress, bool? done, String? error}) =>
      _UploadItem(
        fileName: fileName,
        progress: progress ?? this.progress,
        done: done ?? this.done,
        error: error ?? this.error,
      );
}

class _AttachmentUploadWidgetState extends State<AttachmentUploadWidget> {
  final List<_UploadItem> _uploads = [];

  Future<void> _pickAndUpload() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      withData: false,
      withReadStream: false,
    );
    if (result == null || result.files.isEmpty) return;

    for (final pf in result.files) {
      if (pf.path == null) continue;

      final file = File(pf.path!);
      final size = await file.length();
      final mimeType = _mimeFromPath(pf.path!) ?? 'application/octet-stream';

      if (size > _maxFileSize) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${pf.name} exceeds 10MB limit')),
        );
        continue;
      }

      if (!_allowedMimeTypes.contains(mimeType)) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${pf.name}: unsupported file type')),
        );
        continue;
      }

      final index = _uploads.length;
      setState(() => _uploads.add(_UploadItem(fileName: pf.name)));
      _uploadFile(file, pf.name, mimeType, size, index);
    }
  }

  Future<void> _uploadFile(
    File file,
    String fileName,
    String mimeType,
    int fileSize,
    int index,
  ) async {
    final client = GraphQLProvider.of(context).value;

    // Step 1: Get presigned URL
    final presignResult = await client.mutate(MutationOptions(
      document: gql(generatePresignedUrlMutation),
      variables: {
        'input': {
          'taskId': widget.taskId,
          'fileName': fileName,
          'mimeType': mimeType,
          'fileSize': fileSize,
        }
      },
    ));

    if (presignResult.hasException || presignResult.data == null) {
      setState(() => _uploads[index] = _uploads[index]
          .copyWith(error: 'Failed to get upload URL'));
      return;
    }

    final presign = presignResult.data!['generatePresignedUrl'] as Map<String, dynamic>;
    final uploadUrl = presign['uploadUrl'] as String;
    final fileKey = presign['fileKey'] as String;

    // Step 2: PUT to S3 directly
    setState(() => _uploads[index] = _uploads[index].copyWith(progress: 0.1));

    try {
      final bytes = await file.readAsBytes();
      setState(() => _uploads[index] = _uploads[index].copyWith(progress: 0.4));

      final putResponse = await http.put(
        Uri.parse(uploadUrl),
        headers: {'Content-Type': mimeType},
        body: bytes,
      );

      if (putResponse.statusCode < 200 || putResponse.statusCode >= 300) {
        setState(() => _uploads[index] =
            _uploads[index].copyWith(error: 'Upload failed (${putResponse.statusCode})'));
        return;
      }
    } catch (e) {
      setState(() => _uploads[index] = _uploads[index].copyWith(error: e.toString()));
      return;
    }

    setState(() => _uploads[index] = _uploads[index].copyWith(progress: 0.8));

    // Step 3: Confirm attachment
    final confirmResult = await client.mutate(MutationOptions(
      document: gql(confirmAttachmentMutation),
      variables: {
        'input': {
          'taskId': widget.taskId,
          'fileKey': fileKey,
          'fileName': fileName,
          'mimeType': mimeType,
          'fileSize': fileSize,
        }
      },
    ));

    if (confirmResult.hasException || confirmResult.data == null) {
      setState(() => _uploads[index] =
          _uploads[index].copyWith(error: 'Failed to confirm upload'));
      return;
    }

    setState(() => _uploads[index] = _uploads[index].copyWith(progress: 1.0, done: true));
    widget.onUploaded();

    // Auto-clear successful uploads after a delay
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _uploads.removeWhere((u) => u.done));
      }
    });
  }

  String? _mimeFromPath(String path) {
    final ext = path.split('.').last.toLowerCase();
    const map = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'zip': 'application/zip',
    };
    return map[ext];
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        OutlinedButton.icon(
          onPressed: _pickAndUpload,
          icon: const Icon(Icons.attach_file, size: 16),
          label: const Text('Attach files'),
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFF2563EB),
            side: const BorderSide(color: Color(0xFF2563EB)),
          ),
        ),
        if (_uploads.isNotEmpty) ...[
          const SizedBox(height: 8),
          ..._uploads.map((u) => _UploadProgressTile(item: u)),
        ],
      ],
    );
  }
}

class _UploadProgressTile extends StatelessWidget {
  final _UploadItem item;
  const _UploadProgressTile({required this.item});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Expanded(
              child: Text(
                item.fileName,
                style: const TextStyle(fontSize: 12),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            if (item.done)
              const Icon(Icons.check_circle, size: 16, color: Colors.green)
            else if (item.error != null)
              Icon(Icons.error_outline, size: 16, color: Colors.red.shade400)
            else
              Text(
                '${(item.progress * 100).toInt()}%',
                style: const TextStyle(fontSize: 11, color: Colors.grey),
              ),
          ]),
          const SizedBox(height: 3),
          if (item.error != null)
            Text(
              item.error!,
              style: TextStyle(fontSize: 11, color: Colors.red.shade400),
            )
          else
            LinearProgressIndicator(
              value: item.progress,
              backgroundColor: Colors.grey.shade200,
              color: item.done ? Colors.green : const Color(0xFF2563EB),
              minHeight: 3,
            ),
        ],
      ),
    );
  }
}
