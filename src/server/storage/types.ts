export type UploadInput = {
  buffer: Buffer;
  contentType: string;
  pathname: string;
};

export type UploadOutput = {
  url: string;
  pathname: string;
  driver: "local" | "s3";
};

export interface StorageDriver {
  readonly driver: "local" | "s3";
  put(input: UploadInput): Promise<UploadOutput>;
  delete(pathname: string): Promise<void>;
  read(pathname: string): Promise<Buffer>;
}
