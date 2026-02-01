export const PageContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="
      mx-auto
      w-full
      max-w-7xl
      px-4
      sm:px-6
      lg:px-8
      py-6
      sm:py-10
    ">
      {children}
    </div>
  );
}
