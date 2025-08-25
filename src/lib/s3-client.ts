
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export interface S3Config {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  folder?: string;
}

export interface UploadResult {
  url: string;
  key: string;
  size: number;
}

export class S3Uploader {
  private client: S3Client;
  private bucket: string;
  private folder: string;

  constructor(config: S3Config) {
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    this.bucket = config.bucket;
    this.folder = config.folder || 'uploads';
  }

  async uploadFile(file: File, category: string = 'general'): Promise<UploadResult> {
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const key = `${this.folder}/${category}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: file.type,
      ACL: 'public-read',
    });

    await this.client.send(command);

    const url = `https://${this.bucket}.s3.amazonaws.com/${key}`;
    
    return {
      url,
      key,
      size: file.size,
    };
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  getPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }
}
