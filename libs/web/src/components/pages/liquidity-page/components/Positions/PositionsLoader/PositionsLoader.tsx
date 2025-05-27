export default function PositionsLoader({ count }: { count: number }){
  return (
    <>
      {/* Mobile Layout */}
      <div className="block md:hidden flex flex-col p-4 rounded-2xl bg-gray-800">
        {Array.from({ length: count }, (_, i) => (
          <div key={i}>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between">
                <div className="skeleton-avatar" />
                <div className="skeleton-avatar" />
              </div>

              <div className="flex items-center justify-between py-2">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex flex-col justify-center items-center w-1/4 min-h-[61px]">
                    <div className="skeleton-line line-3 min-h-[29px]" />
                  </div>
                ))}
              </div>

              <div className="skeleton-line line-3 min-h-[29px] mx-auto" />
            </div>

            {i !== count - 1 && (
              <div className="h-px bg-gray-600 my-4 -mx-4" />
            )}
          </div>
        ))}
      </div>

      {/* Desktop Layout */}
      <table className="hidden md:table w-full rounded-3xl border-collapse bg-gray-800">
        <thead>
          <tr>
            <th className="text-left min-w-[350px] px-6 py-4 text-sm font-normal text-gray-400 border-b border-gray-700">
              <div className="skeleton-line line-3 min-h-[19px]" />
            </th>
            <th className="text-center min-w-[215px] px-6 py-4 text-sm font-normal text-gray-400 border-b border-gray-700">
              <div className="skeleton-line line-3 min-h-[19px] mx-auto" />
            </th>
            <th className="text-center min-w-[215px] px-6 py-4 text-sm font-normal text-gray-400 border-b border-gray-700">
              <div className="skeleton-line line-3 min-h-[19px] mx-auto" />
            </th>
            <th className="text-right px-6 py-4 border-b border-gray-700" />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: count }, (_, i) => (
            <tr key={i}>
              <td className="px-6 py-4 min-w-[350px]">
                <div className="skeleton-item min-h-[43px] flex items-center gap-2">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-avatar" />
                  <div className="skeleton-text flex flex-col items-center ml-2">
                    <div className="skeleton-line line-3" />
                    <div className="skeleton-line line-3" />
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="skeleton-text flex flex-col items-center">
                  <div className="skeleton-line line-2 min-h-[20px]" />
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="skeleton-text flex flex-col items-center">
                  <div className="skeleton-line line-3 min-h-[20px]" />
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="skeleton-text min-w-[100px]">
                  <div className="skeleton-line line-1 min-h-[20px]" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};
