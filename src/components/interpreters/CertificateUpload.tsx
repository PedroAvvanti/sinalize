"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  submitInterpreterApplication,
  type InterpreterApplicationActionState,
} from "@/actions/interpreters";

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

  return (
    <form
      className="certificate-form"
      action={formAction}
      encType="multipart/form-data"
    >
      <div className="certificate-field">
        <label htmlFor="certificate">
          {resubmission ? "Novo certificado" : "Certificado de intérprete"}
        </label>
        <input
          id="certificate"
          name="certificate"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          aria-describedby="certificate-help"
          required
        />
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
