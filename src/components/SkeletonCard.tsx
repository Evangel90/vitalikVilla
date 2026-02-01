export const SkeletonCard = () => {
  return (
    <div className="
      rounded-xl
      border
      border-gray-800
      bg-gray-900
      p-4
      sm:p-5
      animate-pulse
    ">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gray-800" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-gray-800" />
          <div className="h-3 w-1/2 rounded bg-gray-800" />
        </div>
      </div>
    </div>
  );
}
