import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import type { StorageDriver, UploadInput, UploadOutput } from "./types";

function readEnv(): {
  bucket: string;
  region: string;
  publicHost?: string;
} {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_S3_REGION ?? "us-east-1";
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET not configured");
  }
  return {
    bucket,
    region,
    publicHost: process.env.AWS_S3_PUBLIC_HOST,
  };
}

function buildClient(region: string): S3Client {
  return new S3Client({
    region,
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
}

function publicUrl(
  pathname: string,
  bucket: string,
  region: string,
  publicHost?: string,
): string {
  if (publicHost) {
    return `${publicHost.replace(/\/$/, "")}/${pathname}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${pathname}`;
}

export class S3StorageDriver implements StorageDriver {
  readonly driver = "s3" as const;

  async put(input: UploadInput): Promise<UploadOutput> {
    const { bucket, region, publicHost } = readEnv();
    const client = buildClient(region);
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: input.pathname,
        Body: input.buffer,
        ContentType: input.contentType,
      }),
    );
    return {
      url: publicUrl(input.pathname, bucket, region, publicHost),
      pathname: input.pathname,
      driver: "s3",
    };
  }

  async delete(pathname: string): Promise<void> {
    const { bucket, region } = readEnv();
    const client = buildClient(region);
    await client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: pathname }),
    );
  }

  async read(pathname: string): Promise<Buffer> {
    const { bucket, region } = readEnv();
    const client = buildClient(region);
    const out = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: pathname }),
    );
    if (!out.Body) throw new Error(`S3 object empty: ${pathname}`);
    const chunks: Uint8Array[] = [];
    for await (const chunk of out.Body as unknown as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}
