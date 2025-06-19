export function PositionsLoader({count}: {count: number}) {
  return (
    <div className="flex flex-col gap-4 bg-background-secondary dark:bg-gray-800 rounded-3xl p-4 w-full">
      <div className="hidden md:grid grid-cols-4 gap-4 px-2 pb-4 border-b border-gray-700 text-gray-400 text-sm font-normal">
        <div className="text-left">
          <div className="bg-gray-600/20 animate-pulse h-3 line-3" />
        </div>
        <div className="text-center">
          <div className="bg-gray-600/20 animate-pulse h-3 w-[75%] line-3 mx-auto" />
        </div>
        <div className="text-center">
          <div className="bg-gray-600/20 animate-pulse h-3 w-[75%] line-3 mx-auto" />
        </div>
        <div className="text-right">
          <div className="bg-gray-600/20 animate-pulse h-3 w-[75%] line-3 ml-auto" />
        </div>
      </div>

      {Array.from({length: count}, (_, i) => (
        <div
          key={i}
          className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4 items-center py-4 hover:bg-gray-700 transition rounded-lg px-2"
        >
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2 items-center">
              <div className="bg-gray-600/20 animate-pulse w-8 h-8 rounded-full" />
              <div className="bg-gray-600/20 animate-pulse w-8 h-8 rounded-full" />
              <div className="flex flex-col gap-1 ml-2">
                <div className="bg-gray-600/20 animate-pulse w-28 h-3" />
                <div className="bg-gray-600/20 animate-pulse w-28 h-3" />
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-gray-600/20 animate-pulse w-[75%] h-4 mx-auto" />
          </div>

          <div className="text-center">
            <div className="bg-gray-600/20 animate-pulse w-[75%] h-4 mx-auto" />
          </div>

          <div className="col-span-2 sm:col-span-3 md:col-span-1 flex justify-end">
            <div className="bg-gray-600/20 animate-pulse w-[75%] h-4" />
          </div>
        </div>
      ))}
    </div>
  );
}
