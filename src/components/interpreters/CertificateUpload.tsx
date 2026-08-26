"use client";

import {
  useActionState,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useFormStatus } from "react-dom";

import {
  submitInterpreterApplication,
  type InterpreterApplicationActionState,
} from "@/actions/interpreters";
import { FieldError, RequiredMark } from "@/components/forms/FieldError";

const INITIAL_STATE: InterpreterApplicationActionState = {};

function UploadButton({ resubmission }: { resubmission: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button className="auth-submit" type="submit" disabled={pending}>
      {pending
        ? "Enviando certificado…"
        : resubmission
          ? "Enviar novo certificado"
          : "Enviar para análise"}
    </button>
  );
}

export function CertificateUpload({
  resubmission = false,
}: {
  resubmission?: boolean;
}) {
  const [state, formAction] = useActionState(
    submitInterpreterApplication,
    INITIAL_STATE,
  );
  const [fileError, setFileError] = useState<string>();
  const fileErrorId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const input = fileRef.current;
    const file = input?.files?.[0];

    if (!file) {
      event.preventDefault();
      setFileError("Selecione o arquivo do certificado.");
      input?.focus();
      return;
    }

    setFileError(undefined);
  }

  return (
    <form
      className="certificate-form"
      action={formAction}
      noValidate
      onSubmit={handleSubmit}
    >
      <div
        className={`certificate-field${fileError ? " certificate-field--invalid" : ""}`}
      >
        <label htmlFor="certificate">
          {resubmission ? "Novo certificado" : "Certificado de intérprete"}
          <RequiredMark />
        </label>
        <input
          ref={fileRef}
          id="certificate"
          name="certificate"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          aria-describedby={
            fileError ? `${fileErrorId} certificate-help` : "certificate-help"
          }
          aria-invalid={fileError ? true : undefined}
          required
          onChange={() => setFileError(undefined)}
        />
        {fileError ? (
          <FieldError id={fileErrorId} message={fileError} />
        ) : null}
        <p id="certificate-help">
          Envie um único arquivo em PDF, JPEG, PNG ou WebP, com no máximo 10
          MiB.
        </p>
      </div>

      {state.error ? (
        <p className="auth-error" role="alert" aria-live="polite">
          {state.error}
        </p>
      ) : null}

      {state.submitted ? (
        <p className="certificate-success" role="status" aria-live="polite">
          Certificado recebido. Sua candidatura está em análise.
        </p>
      ) : null}

      <UploadButton resubmission={resubmission} />
    </form>
  );
}
