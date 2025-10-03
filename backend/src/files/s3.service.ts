import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3: S3;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');
    const region = this.configService.get('AWS_REGION', 'us-east-1');
    this.bucketName = this.configService.get('AWS_S3_BUCKET');

    if (accessKeyId && secretAccessKey && this.bucketName) {
      this.s3 = new S3({
        accessKeyId,
        secretAccessKey,
        region,
      });
      this.logger.log('S3 service initialized successfully');
    } else {
      this.logger.warn('S3 credentials not provided, file uploads will use local storage');
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads'
  ): Promise<string> {
    if (!this.s3) {
      throw new Error('S3 service not configured');
    }

    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    try {
      const uploadResult = await this.s3
        .upload({
          Bucket: this.bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        })
        .promise();

      this.logger.log(`File uploaded successfully: ${uploadResult.Location}`);
      return uploadResult.Location;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!this.s3) {
      throw new Error('S3 service not configured');
    }

    try {
      // Extract key from URL
      const key = fileUrl.split(`${this.bucketName}.s3.amazonaws.com/`)[1];
      
      await this.s3
        .deleteObject({
          Bucket: this.bucketName,
          Key: key,
        })
        .promise();

      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.s3) {
      throw new Error('S3 service not configured');
    }

    try {
      const signedUrl = await this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn,
      });

      return signedUrl;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`);
      throw new Error(`Signed URL generation failed: ${error.message}`);
    }
  }

  isConfigured(): boolean {
    return !!this.s3;
  }
}