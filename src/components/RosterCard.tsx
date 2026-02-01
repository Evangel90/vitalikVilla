type CardProps = {
  name: string;
  role: string;
  date: Date;
  active: boolean;
};

export const RosterCard = ({ name, role, date, active }: CardProps) => {
  const formattedDate = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={`
        relative
        rounded-xl
        border
        bg-gray-900
        p-4
        sm:p-5
        transition
        duration-200
        ease-out

        ${active
          ? `
              border-green-400/60
              shadow-[0_0_0_1px_rgba(34,197,94,0.35),0_0_24px_rgba(34,197,94,0.25)]
            `
          : `
              border-gray-800
              hover:-translate-y-0.5
              hover:border-gray-700
              hover:shadow-md
            `
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div
          className={`
            h-10 w-10 sm:h-12 sm:w-12 rounded-full
            ${active
              ? "bg-green-400/20 ring-1 ring-green-400/40"
              : "bg-gray-800"
            }
          `}
        />

        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-medium text-gray-100">
            {name}
          </h3>

          <p className="text-xs sm:text-sm text-gray-400">
            {role}
          </p>

          <p className="mt-1 text-xs text-green-400/80">
            {formattedDate}
          </p>
        </div>
      </div>
    </div>
  );
}

