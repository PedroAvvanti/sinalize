"use client";

import { useState } from "react";

import { LandingDetailModal } from "@/components/landing/LandingDetailModal";

export type LandingStepItem = {
  title: string;
  description: string;
  details: string;
};

type LandingStepsProps = {
  steps: LandingStepItem[];
};

export function LandingSteps({ steps }: LandingStepsProps) {
  const [activeStep, setActiveStep] = useState<LandingStepItem | null>(null);

  return (
    <>
      <ol className="landing-steps">
        {steps.map((step, index) => (
          <li key={step.title}>
            <button
              className="landing-step-button"
              type="button"
              aria-haspopup="dialog"
              onClick={() => setActiveStep(step)}
            >
              <span className="landing-step-index" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </button>
          </li>
        ))}
      </ol>

      {activeStep ? (
        <LandingDetailModal
          title={activeStep.title}
          description={activeStep.description}
          details={activeStep.details}
          eyebrow="Como funciona"
          onClose={() => setActiveStep(null)}
        />
      ) : null}
    </>
  );
}
