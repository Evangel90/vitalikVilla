import React from "react";
import { daysFromToday } from "../utils";

type CardProps = {
  name: string;
  date: Date;
  free: boolean;
  active: boolean;
  cleaned: boolean;
  now: Date;
  confirmations: string[];
  minConfirmations: number;
  validatorNameByEmail: Record<string, string>;
  currentValidator: { name: string; email: string } | null;
  onConfirm: (date: Date) => Promise<{ ok: boolean; message?: string }>;
  onRemoveConfirmation: (date: Date) => Promise<{ ok: boolean; message?: string }>;
};

export const RosterCard = ({
  name,
  date,
  free,
  active,
  cleaned,
  now,
  confirmations,
  minConfirmations,
  validatorNameByEmail,
  currentValidator,
  onConfirm,
  onRemoveConfirmation,
}: CardProps) => {
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const formattedDate = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const delta = daysFromToday(date);
  const getDueCountdown = () => {
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - now.getTime();
    if (diffMs <= 0) return "Due now";
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `Due in ${hours}h ${minutes}m ${seconds}s`;
  };

  const status =
    delta === 0 ? "Today" : delta === 1 ? getDueCountdown() : `In ${delta} days`;

  const canConfirm = !free && delta <= 0;

  const isCurrentConfirmed = currentValidator
    ? confirmations.includes(currentValidator.email)
    : false;
  const isCurrentOnDuty = currentValidator?.name === name;

  const handleConfirm = async () => {
    if (!currentValidator) return;
    if (isCurrentOnDuty) {
      setError("On-duty person cannot confirm their own cleaning.");
      return;
    }
    setIsSaving(true);
    const result = await onConfirm(date);
    setIsSaving(false);
    if (!result.ok) {
      setError(result.message ?? "Unable to confirm.");
      return;
    }
    setError("");
  };

  const handleRemove = async () => {
    if (!currentValidator) return;
    setIsSaving(true);
    const result = await onRemoveConfirmation(date);
    setIsSaving(false);
    if (!result.ok) {
      setError(result.message ?? "Unable to remove confirmation.");
      return;
    }
    setError("");
  };

  return (
    <div
      className={`
        rounded-xl
        border
        bg-[#132019]
        p-4
        sm:p-5
        transition
        duration-200
        ease-out
        transform-gpu
        will-change-transform
        cursor-default

        ${
          active
            ? "border-green-400/60 animate-[breathe_4s_ease-in-out_infinite]"
            : "border-green-900/40 hover:-translate-y-0.5 hover:border-green-700/60"
        }

        ${
          cleaned
            ? "bg-[#143325] border-green-300/60 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
            : ""
        }

        hover:scale-[1.03]
        focus-visible:scale-[1.03]
        active:scale-[1.02]
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm sm:text-base font-medium">
          {free ? "Free Day" : name}
        </h3>

        {cleaned && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-green-200 animate-[pop_400ms_ease-out]">
            ✓ Cleaned
          </span>
        )}
      </div>

      <p className="text-xs sm:text-sm text-green-300/70">
        {formattedDate}
      </p>

      <p className="mt-1 text-xs text-green-400/80">
        {free ? "No assignment" : cleaned ? "Marked clean" : status}
      </p>

      {!free && delta <= 0 && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-green-200/70">
            <span>Confirmations</span>
            <span>
              {confirmations.length}/{minConfirmations}
            </span>
          </div>


          <div className="flex flex-wrap gap-2">
            {confirmations.length === 0 ? (
              <span className="text-[11px] text-green-200/50">
                No confirmations yet
              </span>
            ) : (
              confirmations.map((email) => (
                <span
                  key={email}
                  className="rounded-full border border-green-500/40 bg-green-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-green-100"
                >
                  {(validatorNameByEmail[email] ?? email).split(" ")[0]}
                </span>
              ))
            )}
          </div>

          {canConfirm && (
            <div className="space-y-2 rounded-lg border border-green-900/60 bg-[#0f1a14] p-2">
              <div className="text-[11px] text-green-200/70">
                {currentValidator ? (
                  <>
                    Signed in as{" "}
                    <span className="font-semibold text-green-100">
                      {currentValidator.name}
                    </span>
                  </>
                ) : (
                  "Sign in to validate."
                )}
              </div>

              {error && (
                <p className="text-[10px] text-red-300/80">{error}</p>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!currentValidator || isCurrentConfirmed || isCurrentOnDuty || isSaving}
                  className="w-full rounded-md border border-green-500/50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-green-100 hover:border-green-400/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Confirm cleaning
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={!currentValidator || !isCurrentConfirmed || isSaving}
                  className="w-full rounded-md border border-green-900/70 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-green-200/80 hover:border-green-700/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove confirmation
                </button>
              </div>
            </div>
          )}

          <p className="text-[11px] text-green-200/60">
            Need {minConfirmations} unique confirmations before clearing.
          </p>
        </div>
      )}

      {!free && delta <= 0 && confirmations.length >= minConfirmations && (
        <p className="mt-2 text-[11px] text-green-200/60">
          Validations complete.
        </p>
      )}
    </div>
  );
}
