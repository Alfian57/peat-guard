import "server-only";

import {
  MAX_REPORT_PHOTO_BYTES,
  ReportPhotoError,
} from "@/lib/server/uploads/private-photo";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DECIMAL_PATTERN =
  /^[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?$/;
const ISO_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/i;
const MAX_FIELD_NOTES_LENGTH = 5_000;
const MAX_TAGS = 12;
const MAX_TAG_LENGTH = 60;
const MAX_MULTIPART_OVERHEAD_BYTES = 128 * 1024;

export const MAX_REPORT_REQUEST_BYTES =
  MAX_REPORT_PHOTO_BYTES + MAX_MULTIPART_OVERHEAD_BYTES;

export class ReportInputError extends Error {
  constructor(
    readonly status: 400 | 413,
    message: string,
  ) {
    super(message);
    this.name = "ReportInputError";
  }
}

export type NewReportInput = {
  clientReportId: string;
  capturedAt: Date;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  fieldNotes: string | null;
  tags: string[];
  aiConsent: boolean;
  isDemoSample: boolean;
  photo: File;
};

function formText(formData: FormData, field: string): string {
  const value = formData.get(field);
  if (typeof value !== "string") {
    throw new ReportInputError(400, `The ${field} field is required.`);
  }

  return value;
}

function parseDecimal(value: string, field: string): number {
  const trimmed = value.trim();
  if (!DECIMAL_PATTERN.test(trimmed)) {
    throw new ReportInputError(
      400,
      `The ${field} field must be a decimal number.`,
    );
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    throw new ReportInputError(
      400,
      `The ${field} field must be a finite number.`,
    );
  }

  return parsed;
}

function parseBoolean(value: string, field: string): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new ReportInputError(400, `The ${field} field must be true or false.`);
}

function parseTags(value: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new ReportInputError(
      400,
      "The tags field must be a JSON string array.",
    );
  }

  if (!Array.isArray(parsed)) {
    throw new ReportInputError(
      400,
      "The tags field must be a JSON string array.",
    );
  }

  const values: unknown[] = parsed;
  if (values.length > MAX_TAGS) {
    throw new ReportInputError(400, `At most ${MAX_TAGS} tags are allowed.`);
  }

  const tags: string[] = [];
  for (const value of values) {
    if (
      typeof value !== "string" ||
      value.trim().length === 0 ||
      value.trim().length > MAX_TAG_LENGTH
    ) {
      throw new ReportInputError(
        400,
        "Each tag must contain 1 to 60 characters.",
      );
    }

    const normalized = value.trim();
    if (!tags.includes(normalized)) tags.push(normalized);
  }

  return tags;
}

export function parseClientReportId(formData: FormData): string {
  const clientReportId = formText(formData, "clientReportId").trim();
  if (!UUID_PATTERN.test(clientReportId)) {
    throw new ReportInputError(400, "The clientReportId field must be a UUID.");
  }

  return clientReportId.toLowerCase();
}

export function parseReportFormData(formData: FormData): NewReportInput {
  const clientReportId = parseClientReportId(formData);
  const capturedAtValue = formText(formData, "capturedAt").trim();
  if (!ISO_TIMESTAMP_PATTERN.test(capturedAtValue)) {
    throw new ReportInputError(
      400,
      "The capturedAt field must be an ISO timestamp with timezone.",
    );
  }

  const capturedAt = new Date(capturedAtValue);
  if (!Number.isFinite(capturedAt.getTime())) {
    throw new ReportInputError(
      400,
      "The capturedAt field is not a valid timestamp.",
    );
  }

  const latitude = parseDecimal(formText(formData, "latitude"), "latitude");
  const longitude = parseDecimal(formText(formData, "longitude"), "longitude");
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new ReportInputError(
      400,
      "The report coordinates are outside valid bounds.",
    );
  }

  const accuracyValue = formText(formData, "accuracyMeters").trim();
  const accuracyMeters =
    accuracyValue === "" ? null : parseDecimal(accuracyValue, "accuracyMeters");
  if (
    accuracyMeters !== null &&
    (accuracyMeters < 0 || accuracyMeters > 100_000)
  ) {
    throw new ReportInputError(
      400,
      "The accuracyMeters field is outside valid bounds.",
    );
  }

  const fieldNotesValue = formText(formData, "fieldNotes");
  if (fieldNotesValue.length > MAX_FIELD_NOTES_LENGTH) {
    throw new ReportInputError(400, "The fieldNotes field is too long.");
  }

  const photoValue = formData.get("photo");
  if (!(photoValue instanceof File)) {
    throw new ReportInputError(400, "A report photo is required.");
  }

  if (photoValue.size > MAX_REPORT_PHOTO_BYTES) {
    throw new ReportPhotoError(
      413,
      "The report photo exceeds the upload limit.",
    );
  }

  return {
    clientReportId,
    capturedAt,
    latitude,
    longitude,
    accuracyMeters,
    fieldNotes: fieldNotesValue.trim() || null,
    tags: parseTags(formText(formData, "tags")),
    aiConsent: parseBoolean(formText(formData, "aiConsent"), "aiConsent"),
    isDemoSample: parseBoolean(
      formText(formData, "isDemoSample"),
      "isDemoSample",
    ),
    photo: photoValue,
  };
}

export async function readBoundedRequestBody(
  request: Request,
  maximumBytes: number,
  tooLargeMessage: string,
): Promise<Uint8Array> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength)) {
      throw new ReportInputError(
        400,
        "The request has an invalid content length.",
      );
    }

    if (Number(contentLength) > maximumBytes) {
      throw new ReportInputError(413, tooLargeMessage);
    }
  }

  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > maximumBytes) {
        try {
          await reader.cancel();
        } catch {
          // The request may already be closed after exceeding its body limit.
        }
        throw new ReportInputError(413, tooLargeMessage);
      }

      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof ReportInputError) throw error;
    throw new ReportInputError(400, "The request body could not be read.");
  }

  const boundedBody = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    boundedBody.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return boundedBody;
}

export async function readReportFormData(request: Request): Promise<FormData> {
  const boundedBody = await readBoundedRequestBody(
    request,
    MAX_REPORT_REQUEST_BYTES,
    "The report request exceeds the upload limit.",
  );

  const headers = new Headers(request.headers);
  headers.delete("content-length");
  headers.delete("transfer-encoding");

  try {
    const boundedRequest = new Request(request.url, {
      method: request.method,
      headers,
      body: boundedBody,
    });
    return await boundedRequest.formData();
  } catch {
    throw new ReportInputError(400, "The report form data could not be read.");
  }
}
