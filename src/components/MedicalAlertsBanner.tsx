import React from "react";

interface MedicalAlertsBannerProps {
  allergies?: string;
  medicalConditions?: string;
  currentMedications?: string;
}

export default function MedicalAlertsBanner({ allergies, medicalConditions, currentMedications }: MedicalAlertsBannerProps) {
  const hasAllergies = allergies?.trim();
  const hasConditions = medicalConditions?.trim();
  const hasMeds = currentMedications?.trim();
  if (!hasAllergies && !hasConditions && !hasMeds) return null;

  return (
    <div className="mb-6 rounded-xl border-2 border-amber-400 bg-amber-50 p-4 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-900 mb-2 flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-amber-500" aria-hidden />
        Medical alerts
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        {hasAllergies && (
          <div>
            <span className="font-medium text-amber-900">Allergies:</span>
            <span className="ml-1 text-amber-800">{allergies}</span>
          </div>
        )}
        {hasConditions && (
          <div>
            <span className="font-medium text-amber-900">Conditions:</span>
            <span className="ml-1 text-amber-800">{medicalConditions}</span>
          </div>
        )}
        {hasMeds && (
          <div>
            <span className="font-medium text-amber-900">Current medications:</span>
            <span className="ml-1 text-amber-800">{currentMedications}</span>
          </div>
        )}
      </div>
    </div>
  );
}
