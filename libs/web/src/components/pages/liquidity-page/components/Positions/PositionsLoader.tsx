export function PositionsLoader({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-4 bg-gray-800 rounded-3xl p-4 w-full">
      <div className="hidden md:grid grid-cols-4 gap-4 px-2 pb-4 border-b border-gray-700 text-gray-400 text-sm font-normal">
        <div className="text-left">
          <div className="skeleton-line line-3" />
        </div>
        <div className="text-center">
          <div className="skeleton-line line-3 mx-auto" />
        </div>
        <div className="text-center">
          <div className="skeleton-line line-3 mx-auto" />
        </div>
        <div className="text-right">
          <div className="skeleton-line line-3 ml-auto" />
        </div>
      </div>

      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 items-center py-4 hover:bg-gray-700 transition rounded-lg px-2"
        >
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2 items-center">
              <div className="skeleton-avatar w-6 h-6 rounded-full" />
              <div className="skeleton-avatar w-6 h-6 rounded-full" />
              <div className="flex flex-col gap-1 ml-2">
                <div className="skeleton-line w-20 h-3" />
                <div className="skeleton-line w-16 h-3" />
              </div>
            </div>
            <div className="skeleton-line w-24 h-3" />
          </div>

          <div className="text-center">
            <div className="skeleton-line w-12 h-4 mx-auto" />
          </div>

          <div className="text-center">
            <div className="skeleton-line w-16 h-4 mx-auto" />
          </div>

          <div className="col-span-2 sm:col-span-3 md:col-span-1 flex justify-end">
            <div className="skeleton-line w-28 h-9" />
          </div>
        </div>
      ))}
    </div>
  );
}
