type FieldErrorProps = {
  id?: string;
  message: string;
};

export function FieldError({ id, message }: FieldErrorProps) {
  return (
    <p id={id} className="field-error" role="alert">
      <span className="field-error__icon" aria-hidden="true">
        !
      </span>
      <span>{message}</span>
    </p>
  );
}

export function RequiredMark() {
  return (
    <span className="field-required" aria-hidden="true">
      *
    </span>
  );
}
