/**
 * AWS Signature Version 4 (HMAC-SHA256) — Workers crypto.subtle only.
 * R2 S3-compatible PUT 등에 사용.
 */

const te = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(data: ArrayBuffer | Uint8Array): Promise<string> {
  const buf = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const digest = await crypto.subtle.digest('SHA-256', buf as BufferSource);
  return toHex(digest);
}

async function hmac(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return crypto.subtle.sign('HMAC', cryptoKey, te.encode(message));
}

function utf8Key(str: string): ArrayBuffer {
  return te.encode(str).buffer as ArrayBuffer;
}

/** RFC3986 스타일(슬래시 제외) — S3 canonical URI용 세그먼트 */
function uriEncodeSegment(segment: string): string {
  return encodeURIComponent(segment).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

/** path-style URL pathname: /bucket/key/with/slashes (세그먼트별 인코딩) */
export function s3PathStylePathname(bucket: string, objectKey: string): string {
  const segs = [bucket, ...objectKey.split('/').filter(Boolean)].map(uriEncodeSegment);
  return `/${segs.join('/')}`;
}

async function getSignatureKey(secretKey: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
  let k = await hmac(utf8Key(`AWS4${secretKey}`), dateStamp);
  k = await hmac(k, region);
  k = await hmac(k, service);
  return hmac(k, 'aws4_request');
}

export type R2SignPutOptions = {
  endpointUrl: URL;
  bucket: string;
  objectKey: string;
  method: 'PUT';
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
  contentType: string;
  payloadHashHex: string;
  amzDate: string;
};

/**
 * R2 / S3 path-style PUT 에 붙일 Authorization, x-amz-date, x-amz-content-sha256
 */
export async function signR2S3PutHeaders(opts: R2SignPutOptions): Promise<Record<string, string>> {
  const region = opts.region ?? 'auto';
  const host = opts.endpointUrl.host.toLowerCase();
  const canonicalUri = s3PathStylePathname(opts.bucket, opts.objectKey);
  const canonicalQueryString = '';
  const payloadHash = opts.payloadHashHex;

  const canonicalHeaders =
    `host:${host}\n` + `x-amz-content-sha256:${payloadHash}\n` + `x-amz-date:${opts.amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest =
    `${opts.method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const dateStamp = opts.amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const hashedCanonical = await sha256Hex(te.encode(canonicalRequest));
  const stringToSign = ['AWS4-HMAC-SHA256', opts.amzDate, credentialScope, hashedCanonical].join('\n');

  const signingKey = await getSignatureKey(opts.secretAccessKey, dateStamp, region, 's3');
  const sigBuf = await hmac(signingKey, stringToSign);
  const signature = toHex(sigBuf);

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${opts.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    'Content-Type': opts.contentType,
    'x-amz-date': opts.amzDate,
    'x-amz-content-sha256': payloadHash,
    Authorization: authorization,
  };
}

export async function sha256HexOfBuffer(body: ArrayBuffer | Uint8Array): Promise<string> {
  return sha256Hex(body);
}
