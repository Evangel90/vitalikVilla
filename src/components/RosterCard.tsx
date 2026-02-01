import { daysFromToday } from "../utils";

type CardProps = {
  name: string;
  date: Date;
  free: boolean;
  active: boolean;
};

export const RosterCard = ({ name, date, free, active }: CardProps) => {
  const formattedDate = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const delta = daysFromToday(date);
  const status =
    delta === 0 ? "Today" : delta === 1 ? "Tomorrow" : `In ${delta} days`;

  return (
    <div
      className={`
        rounded-xl
        border
        bg-[#132019]
        p-4
        sm:p-5
        transition

        ${
          active
            ? "border-green-400/60 animate-[breathe_4s_ease-in-out_infinite]"
            : "border-green-900/40 hover:-translate-y-0.5 hover:border-green-700/60"
        }
      `}
    >
      <h3 className="text-sm sm:text-base font-medium">
        {free ? "Free Day" : name}
      </h3>

      <p className="text-xs sm:text-sm text-green-300/70">
        {formattedDate}
      </p>

      <p className="mt-1 text-xs text-green-400/80">
        {free ? "No assignment" : status}
      </p>
    </div>
  );
}
