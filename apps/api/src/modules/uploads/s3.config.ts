import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

export function createS3Client(config: ConfigService): S3Client {
  return new S3Client({
    endpoint: config.get<string>('S3_ENDPOINT'),
    region: config.get<string>('S3_REGION') || 'us-east-1',
    credentials: {
      accessKeyId: config.get<string>('S3_ACCESS_KEY') || '',
      secretAccessKey: config.get<string>('S3_SECRET_KEY') || '',
    },
    forcePathStyle: true, // Required for MinIO
  });
}
