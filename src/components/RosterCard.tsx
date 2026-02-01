import { daysFromToday } from "../utils";

type CardProps = {
  name: string;
  date: Date;
  free: boolean;
  active: boolean;
  cleaned: boolean;
  onToggleCleaned: (date: Date) => void;
  now: Date;
};

export const RosterCard = ({
  name,
  date,
  free,
  active,
  cleaned,
  onToggleCleaned,
  now,
}: CardProps) => {
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

  const canToggle = !free && delta <= 0;

  return (
    <div
      role={canToggle ? "button" : undefined}
      tabIndex={canToggle ? 0 : -1}
      onClick={() => (canToggle ? onToggleCleaned(date) : undefined)}
      onKeyDown={(event) => {
        if (!canToggle) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggleCleaned(date);
        }
      }}
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
        ${canToggle ? "cursor-pointer" : "cursor-default"}

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
        <p className="mt-2 text-[11px] text-green-200/60">
          Tap to {cleaned ? "undo" : "confirm"} cleaning
        </p>
      )}
    </div>
  );
}
