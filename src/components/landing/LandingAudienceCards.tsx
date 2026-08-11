"use client";

import { useState } from "react";

import { LandingDetailModal } from "@/components/landing/LandingDetailModal";

export type LandingAudienceItem = {
  title: string;
  description: string;
  details: string;
};

type LandingAudienceCardsProps = {
  audiences: LandingAudienceItem[];
};

export function LandingAudienceCards({ audiences }: LandingAudienceCardsProps) {
  const [activeAudience, setActiveAudience] = useState<LandingAudienceItem | null>(
    null,
  );

  return (
    <>
      <ul className="landing-cards">
        {audiences.map((item) => (
          <li key={item.title}>
            <button
              className="landing-card-button"
              type="button"
              aria-haspopup="dialog"
              onClick={() => setActiveAudience(item)}
            >
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </button>
          </li>
        ))}
      </ul>

      {activeAudience ? (
        <LandingDetailModal
          title={activeAudience.title}
          description={activeAudience.description}
          details={activeAudience.details}
          eyebrow="Para quem é"
          onClose={() => setActiveAudience(null)}
        />
      ) : null}
    </>
  );
}
