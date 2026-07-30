import { describe, expect, it } from "vitest";

import {
  MAX_CERTIFICATE_SIZE,
  buildCertificatePath,
  isActiveApplicationConflict,
  resolveApplicationView,
  resolveInterpreterRedirect,
  validateCertificate,
} from "../../src/lib/interpreters/application";

const PDF_HEADER = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
const PDF_END = new Uint8Array([0x0a, 0x25, 0x25, 0x45, 0x4f, 0x46, 0x0a]);
const JPEG_HEADER = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const JPEG_END = new Uint8Array([0xff, 0xd9]);
const PNG_HEADER = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const PNG_END = new Uint8Array([
  0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);
const WEBP_HEADER = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 12, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
]);

describe("validateCertificate", () => {
  it.each([
    ["certificado.pdf", "application/pdf", PDF_HEADER, PDF_END, 32, "pdf"],
    ["certificado.jpg", "image/jpeg", JPEG_HEADER, JPEG_END, 24, "jpg"],
    ["certificado.jpeg", "image/jpeg", JPEG_HEADER, JPEG_END, 24, "jpg"],
    ["certificado.png", "image/png", PNG_HEADER, PNG_END, 32, "png"],
    [
      "certificado.webp",
      "image/webp",
      WEBP_HEADER,
      new Uint8Array(8),
      20,
      "webp",
    ],
  ])(
    "aceita %s quando MIME e conteúdo são coerentes",
    (name, type, start, end, size, extension) => {
      expect(
        validateCertificate({ name, type, size, start, end }),
      ).toEqual({ ok: true, extension, contentType: type });
    },
  );

  it("rejeita arquivo vazio", () => {
    expect(
      validateCertificate({
        name: "certificado.pdf",
        type: "application/pdf",
        size: 0,
        start: PDF_HEADER,
        end: PDF_END,
      }),
    ).toEqual({ ok: false, error: "O arquivo está vazio." });
  });

  it("rejeita arquivo maior que 10 MiB", () => {
    expect(
      validateCertificate({
        name: "certificado.pdf",
        type: "application/pdf",
        size: MAX_CERTIFICATE_SIZE + 1,
        start: PDF_HEADER,
        end: PDF_END,
      }),
    ).toEqual({
      ok: false,
      error: "O arquivo deve ter no máximo 10 MiB.",
    });
  });

  it("rejeita MIME não permitido", () => {
    expect(
      validateCertificate({
        name: "certificado.txt",
        type: "text/plain",
        size: 10,
        start: new Uint8Array([0x61]),
        end: new Uint8Array([0x61]),
      }),
    ).toEqual({
      ok: false,
      error: "Envie um arquivo PDF, JPEG, PNG ou WebP.",
    });
  });

  it("rejeita extensão incoerente com o MIME", () => {
    expect(
      validateCertificate({
        name: "certificado.png",
        type: "application/pdf",
        size: 1024,
        start: PDF_HEADER,
        end: PDF_END,
      }),
    ).toEqual({
      ok: false,
      error: "A extensão do arquivo não corresponde ao tipo informado.",
    });
  });

  it("rejeita conteúdo incoerente com o MIME", () => {
    expect(
      validateCertificate({
        name: "certificado.pdf",
        type: "application/pdf",
        size: 1024,
        start: PNG_HEADER,
        end: PDF_END,
      }),
    ).toEqual({
      ok: false,
      error: "O conteúdo do arquivo não corresponde ao tipo informado.",
    });
  });

  it("rejeita PDF com apenas o prefixo e sem marcador EOF final", () => {
    expect(
      validateCertificate({
        name: "certificado.pdf",
        type: "application/pdf",
        size: 32,
        start: PDF_HEADER,
        end: new Uint8Array([0x70, 0x61, 0x79, 0x6c, 0x6f, 0x61, 0x64]),
      }),
    ).toEqual({
      ok: false,
      error: "O arquivo parece estar incompleto ou corrompido.",
    });
  });

  it("rejeita JPEG truncado sem marcador EOI", () => {
    expect(
      validateCertificate({
        name: "certificado.jpg",
        type: "image/jpeg",
        size: 24,
        start: JPEG_HEADER,
        end: new Uint8Array([0, 0]),
      }),
    ).toEqual({
      ok: false,
      error: "O arquivo parece estar incompleto ou corrompido.",
    });
  });

  it("rejeita PNG sem chunk IEND final completo", () => {
    expect(
      validateCertificate({
        name: "certificado.png",
        type: "image/png",
        size: 32,
        start: PNG_HEADER,
        end: new Uint8Array([0x49, 0x45, 0x4e, 0x44]),
      }),
    ).toEqual({
      ok: false,
      error: "O arquivo parece estar incompleto ou corrompido.",
    });
  });

  it("rejeita WebP cujo tamanho RIFF não corresponde ao arquivo", () => {
    expect(
      validateCertificate({
        name: "certificado.webp",
        type: "image/webp",
        size: 21,
        start: WEBP_HEADER,
        end: new Uint8Array(8),
      }),
    ).toEqual({
      ok: false,
      error: "O arquivo parece estar incompleto ou corrompido.",
    });
  });
});

describe("buildCertificatePath", () => {
  it("gera path no namespace do usuário sem reutilizar o nome recebido", () => {
    expect(
      buildCertificatePath(
        "3ed11718-cd6a-45d0-9412-6429a79ef59d",
        "7ca7ae71-c1b2-4b46-8ddd-c9ee3780756b",
        "pdf",
      ),
    ).toBe(
      "3ed11718-cd6a-45d0-9412-6429a79ef59d/7ca7ae71-c1b2-4b46-8ddd-c9ee3780756b.pdf",
    );
  });

  it("rejeita identificadores ou extensões inseguros", () => {
    expect(() =>
      buildCertificatePath("../user", "documento", "pdf"),
    ).toThrow("Não foi possível gerar o caminho do certificado.");
  });
});

describe("resolveApplicationView", () => {
  it.each([
    [null, "upload"],
    ["pending", "pending"],
    ["rejected", "rejected"],
    ["approved", "approved"],
  ] as const)("resolve %s para %s", (status, expected) => {
    expect(resolveApplicationView(status)).toBe(expected);
  });
});

describe("isActiveApplicationConflict", () => {
  it("reconhece unique violation do Postgres", () => {
    expect(isActiveApplicationConflict({ code: "23505" })).toBe(true);
  });

  it("não classifica outros erros como conflito idempotente", () => {
    expect(isActiveApplicationConflict({ code: "42501" })).toBe(false);
  });
});

describe("resolveInterpreterRedirect", () => {
  it("envia a área do intérprete não aprovado ao onboarding", () => {
    expect(resolveInterpreterRedirect("/app/interpreter", "pending")).toBe(
      "/app/interpreter/onboarding",
    );
  });

  it("não cria loop no onboarding", () => {
    expect(
      resolveInterpreterRedirect(
        "/app/interpreter/onboarding",
        "rejected",
      ),
    ).toBeNull();
  });

  it("envia intérprete aprovado do onboarding para sua área", () => {
    expect(
      resolveInterpreterRedirect(
        "/app/interpreter/onboarding",
        "approved",
      ),
    ).toBe("/app/interpreter");
  });

  it("mantém intérprete aprovado na área", () => {
    expect(resolveInterpreterRedirect("/app/interpreter", "approved")).toBeNull();
  });

  it("falha fechado quando a consulta de aprovação falha", () => {
    expect(
      resolveInterpreterRedirect("/app/interpreter", "approved", true),
    ).toBe("/app/interpreter/onboarding");
  });
});
