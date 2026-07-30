import type { ApplicationStatus } from "@/types/database";

export const MAX_CERTIFICATE_SIZE = 10 * 1024 * 1024;

type CertificateExtension = "pdf" | "jpg" | "png" | "webp";

type CertificateInput = {
  name: string;
  type: string;
  size: number;
  header: Uint8Array;
};

type CertificateValidation =
  | {
      ok: true;
      extension: CertificateExtension;
      contentType: string;
    }
  | { ok: false; error: string };

const MIME_CONFIG: Record<
  string,
  {
    extensions: readonly string[];
    storedExtension: CertificateExtension;
    matchesHeader: (header: Uint8Array) => boolean;
  }
> = {
  "application/pdf": {
    extensions: ["pdf"],
    storedExtension: "pdf",
    matchesHeader: (header) =>
      matchesBytes(header, [0x25, 0x50, 0x44, 0x46, 0x2d]),
  },
  "image/jpeg": {
    extensions: ["jpg", "jpeg"],
    storedExtension: "jpg",
    matchesHeader: (header) => matchesBytes(header, [0xff, 0xd8, 0xff]),
  },
  "image/png": {
    extensions: ["png"],
    storedExtension: "png",
    matchesHeader: (header) =>
      matchesBytes(header, [
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]),
  },
  "image/webp": {
    extensions: ["webp"],
    storedExtension: "webp",
    matchesHeader: (header) =>
      matchesBytes(header, [0x52, 0x49, 0x46, 0x46]) &&
      matchesBytes(header, [0x57, 0x45, 0x42, 0x50], 8),
  },
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function matchesBytes(
  header: Uint8Array,
  expected: readonly number[],
  offset = 0,
) {
  return expected.every((byte, index) => header[offset + index] === byte);
}

function fileExtension(name: string) {
  const lastDot = name.lastIndexOf(".");
  return lastDot > -1 ? name.slice(lastDot + 1).toLowerCase() : "";
}

export function validateCertificate(
  input: CertificateInput,
): CertificateValidation {
  if (input.size === 0) {
    return { ok: false, error: "O arquivo está vazio." };
  }

  if (input.size > MAX_CERTIFICATE_SIZE) {
    return {
      ok: false,
      error: "O arquivo deve ter no máximo 10 MiB.",
    };
  }

  const config = MIME_CONFIG[input.type];

  if (!config) {
    return {
      ok: false,
      error: "Envie um arquivo PDF, JPEG, PNG ou WebP.",
    };
  }

  if (!config.extensions.includes(fileExtension(input.name))) {
    return {
      ok: false,
      error: "A extensão do arquivo não corresponde ao tipo informado.",
    };
  }

  if (!config.matchesHeader(input.header)) {
    return {
      ok: false,
      error: "O conteúdo do arquivo não corresponde ao tipo informado.",
    };
  }

  return {
    ok: true,
    extension: config.storedExtension,
    contentType: input.type,
  };
}

export function buildCertificatePath(
  userId: string,
  objectId: string,
  extension: CertificateExtension,
) {
  if (
    !UUID_PATTERN.test(userId) ||
    !UUID_PATTERN.test(objectId) ||
    !["pdf", "jpg", "png", "webp"].includes(extension)
  ) {
    throw new Error("Não foi possível gerar o caminho do certificado.");
  }

  return `${userId}/${objectId}.${extension}`;
}

export function resolveApplicationView(
  status: ApplicationStatus | null,
): "upload" | ApplicationStatus {
  return status ?? "upload";
}

export function resolveInterpreterRedirect(
  pathname: string,
  status: ApplicationStatus | null,
): string | null {
  const onboardingPath = "/app/interpreter/onboarding";

  if (pathname === onboardingPath) {
    return status === "approved" ? "/app/interpreter" : null;
  }

  if (
    (pathname === "/app/interpreter" ||
      pathname.startsWith("/app/interpreter/")) &&
    status !== "approved"
  ) {
    return onboardingPath;
  }

  return null;
}
