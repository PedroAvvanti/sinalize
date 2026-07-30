import { describe, expect, it } from "vitest";

import {
  MAX_CERTIFICATE_SIZE,
  buildCertificatePath,
  resolveApplicationView,
  resolveInterpreterRedirect,
  validateCertificate,
} from "../../src/lib/interpreters/application";

const PDF_HEADER = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
const JPEG_HEADER = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const PNG_HEADER = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const WEBP_HEADER = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
]);

describe("validateCertificate", () => {
  it.each([
    ["certificado.pdf", "application/pdf", PDF_HEADER, "pdf"],
    ["certificado.jpg", "image/jpeg", JPEG_HEADER, "jpg"],
    ["certificado.jpeg", "image/jpeg", JPEG_HEADER, "jpg"],
    ["certificado.png", "image/png", PNG_HEADER, "png"],
    ["certificado.webp", "image/webp", WEBP_HEADER, "webp"],
  ])(
    "aceita %s quando MIME e conteúdo são coerentes",
    (name, type, header, extension) => {
      expect(
        validateCertificate({ name, type, size: 1024, header }),
      ).toEqual({ ok: true, extension, contentType: type });
    },
  );

  it("rejeita arquivo vazio", () => {
    expect(
      validateCertificate({
        name: "certificado.pdf",
        type: "application/pdf",
        size: 0,
        header: PDF_HEADER,
      }),
    ).toEqual({ ok: false, error: "O arquivo está vazio." });
  });

  it("rejeita arquivo maior que 10 MiB", () => {
    expect(
      validateCertificate({
        name: "certificado.pdf",
        type: "application/pdf",
        size: MAX_CERTIFICATE_SIZE + 1,
        header: PDF_HEADER,
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
        header: new Uint8Array([0x61]),
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
        header: PDF_HEADER,
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
        header: PNG_HEADER,
      }),
    ).toEqual({
      ok: false,
      error: "O conteúdo do arquivo não corresponde ao tipo informado.",
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
});
