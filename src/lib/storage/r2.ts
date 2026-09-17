import { env } from "@/env.js";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const MAX_R2_FILE_SIZE = 10 * 1024 * 1024;

let r2Client: S3Client | null = null;

function getRequiredEnv(name: keyof typeof env | string, value?: string) {
  if (!value) {
    throw new Error(`Environment variable ${name} belum diisi`);
  }

  return value;
}

function getR2Client() {
  if (r2Client) {
    return r2Client;
  }

  r2Client = new S3Client({
    region: env.R2_REGION || "auto",
    endpoint: getRequiredEnv("R2_ENDPOINT", env.R2_ENDPOINT),
    credentials: {
      accessKeyId: getRequiredEnv("R2_ACCESS_KEY_ID", env.R2_ACCESS_KEY_ID),
      secretAccessKey: getRequiredEnv(
        "R2_SECRET_ACCESS_KEY",
        env.R2_SECRET_ACCESS_KEY
      ),
    },
  });

  return r2Client;
}

function getBucketName() {
  return getRequiredEnv("R2_BUCKET_NAME", env.R2_BUCKET_NAME);
}

function getPublicBaseUrl() {
  const baseUrl = getRequiredEnv("R2_PUBLIC_BASE_URL", env.R2_PUBLIC_BASE_URL);
  return baseUrl.replace(/\/+$/, "");
}

function normalizePrefix(prefix?: string) {
  return (prefix || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
}

function sanitizeSegment(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function splitFileName(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex <= 0) {
    return {
      name: sanitizeSegment(fileName) || "file",
      extension: "",
    };
  }

  return {
    name: sanitizeSegment(fileName.slice(0, lastDotIndex)) || "file",
    extension: sanitizeSegment(fileName.slice(lastDotIndex + 1)),
  };
}

export function assertFileSize(size: number) {
  if (size > MAX_R2_FILE_SIZE) {
    throw new Error("Ukuran file maksimal 10MB");
  }
}

export function buildObjectKey(options: {
  prefix?: string;
  entityId: string;
  originalName: string;
}) {
  const prefix = normalizePrefix(options.prefix);
  const entityId = sanitizeSegment(options.entityId) || "file";
  const { name, extension } = splitFileName(options.originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  const fileName = extension
    ? `${timestamp}-${random}-${name}.${extension}`
    : `${timestamp}-${random}-${name}`;

  return prefix ? `${prefix}/${entityId}/${fileName}` : `${entityId}/${fileName}`;
}

export function getPublicUrlForKey(key: string) {
  const normalizedKey = key.replace(/^\/+/, "");
  return `${getPublicBaseUrl()}/${normalizedKey}`;
}

export function getKeyFromStoredPath(pathOrUrl?: string | null) {
  if (!pathOrUrl) {
    return null;
  }

  if (!/^https?:\/\//i.test(pathOrUrl)) {
    return null;
  }

  const publicBaseUrl = getPublicBaseUrl();

  if (!pathOrUrl.startsWith(publicBaseUrl)) {
    return null;
  }

  const suffix = pathOrUrl.slice(publicBaseUrl.length).replace(/^\/+/, "");
  return suffix || null;
}

export async function uploadBufferToR2(params: {
  buffer: Buffer;
  contentType: string;
  key: string;
  contentDisposition?: string;
}) {
  const client = getR2Client();
  const bucket = getBucketName();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.buffer,
      ContentType: params.contentType,
      ContentDisposition: params.contentDisposition,
    })
  );

  return {
    key: params.key,
    url: getPublicUrlForKey(params.key),
  };
}

export async function deleteObjectFromR2(key: string) {
  const client = getR2Client();
  const bucket = getBucketName();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}
