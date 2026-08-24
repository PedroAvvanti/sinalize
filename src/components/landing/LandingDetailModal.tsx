"use client";

import { useLenis } from "lenis/react";
import { useEffect, useRef } from "react";

type LandingDetailModalProps = {
  title: string;
  description: string;
  details: string;
  eyebrow?: string;
  onClose: () => void;
};

export function LandingDetailModal({
  title,
  description,
  details,
  eyebrow,
  onClose,
}: LandingDetailModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lenis?.stop();
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      lenis?.start();
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [lenis, onClose]);

  return (
    <div
      className="landing-detail-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="landing-detail-dialog"
        data-lenis-prevent
        role="dialog"
        aria-modal="true"
        aria-labelledby="landing-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="landing-detail-dialog__header">
          <div>
            {eyebrow ? (
              <p className="landing-detail-dialog__eyebrow">{eyebrow}</p>
            ) : null}
            <h2 id="landing-detail-title">{title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            className="landing-detail-dialog__close"
            type="button"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </header>

        <div className="landing-detail-dialog__body">
          <p className="landing-detail-dialog__summary">{description}</p>
          <p className="landing-detail-dialog__details">{details}</p>
        </div>

        <footer className="landing-detail-dialog__footer">
          <button
            className="button button-primary landing-detail-dialog__action"
            type="button"
            onClick={onClose}
          >
            Entendi
          </button>
        </footer>
      </div>
    </div>
  );
}
