import type { ApplicationStatus } from "@/types/database";

export const MAX_CERTIFICATE_SIZE = 10 * 1024 * 1024;

type CertificateExtension = "pdf" | "jpg" | "png" | "webp";

type CertificateInput = {
  name: string;
  type: string;
  size: number;
  start: Uint8Array;
  end: Uint8Array;
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
    matchesHeader: (start: Uint8Array) => boolean;
    matchesStructure: (input: CertificateInput) => boolean;
  }
> = {
  "application/pdf": {
    extensions: ["pdf"],
    storedExtension: "pdf",
    matchesHeader: (start) =>
      matchesBytes(start, [0x25, 0x50, 0x44, 0x46, 0x2d]),
    matchesStructure: ({ end }) =>
      matchesSuffix(trimTrailingWhitespace(end), [
        0x25, 0x25, 0x45, 0x4f, 0x46,
      ]),
  },
  "image/jpeg": {
    extensions: ["jpg", "jpeg"],
    storedExtension: "jpg",
    matchesHeader: (start) => matchesBytes(start, [0xff, 0xd8, 0xff]),
    matchesStructure: ({ end }) => matchesSuffix(end, [0xff, 0xd9]),
  },
  "image/png": {
    extensions: ["png"],
    storedExtension: "png",
    matchesHeader: (start) =>
      matchesBytes(start, [
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]),
    matchesStructure: ({ end }) =>
      matchesSuffix(end, [
        0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]),
  },
  "image/webp": {
    extensions: ["webp"],
    storedExtension: "webp",
    matchesHeader: (start) =>
      matchesBytes(start, [0x52, 0x49, 0x46, 0x46]) &&
      matchesBytes(start, [0x57, 0x45, 0x42, 0x50], 8),
    matchesStructure: ({ start, size }) =>
      start.length >= 12 && readUint32LittleEndian(start, 4) + 8 === size,
  },
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function matchesBytes(
  bytes: Uint8Array,
  expected: readonly number[],
  offset = 0,
) {
  return expected.every((byte, index) => bytes[offset + index] === byte);
}

function matchesSuffix(bytes: Uint8Array, expected: readonly number[]) {
  return (
    bytes.length >= expected.length &&
    matchesBytes(bytes, expected, bytes.length - expected.length)
  );
}

function trimTrailingWhitespace(bytes: Uint8Array) {
  let end = bytes.length;

  while (
    end > 0 &&
    [0x09, 0x0a, 0x0c, 0x0d, 0x20].includes(bytes[end - 1])
  ) {
    end -= 1;
  }

  return bytes.subarray(0, end);
}

function readUint32LittleEndian(bytes: Uint8Array, offset: number) {
  return (
    bytes[offset] +
    bytes[offset + 1] * 2 ** 8 +
    bytes[offset + 2] * 2 ** 16 +
    bytes[offset + 3] * 2 ** 24
  );
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

  if (!config.matchesHeader(input.start)) {
    return {
      ok: false,
      error: "O conteúdo do arquivo não corresponde ao tipo informado.",
    };
  }

  if (!config.matchesStructure(input)) {
    return {
      ok: false,
      error: "O arquivo parece estar incompleto ou corrompido.",
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

export function isActiveApplicationConflict(
  error: { code?: string | null } | null | undefined,
) {
  return error?.code === "23505";
}

export function resolveInterpreterRedirect(
  pathname: string,
  status: ApplicationStatus | null,
  lookupFailed = false,
): string | null {
  const onboardingPath = "/app/interpreter/onboarding";
  const approved = !lookupFailed && status === "approved";

  if (pathname === onboardingPath) {
    return approved ? "/app/interpreter" : null;
  }

  if (
    (pathname === "/app/interpreter" ||
      pathname.startsWith("/app/interpreter/")) &&
    !approved
  ) {
    return onboardingPath;
  }

  return null;
}
