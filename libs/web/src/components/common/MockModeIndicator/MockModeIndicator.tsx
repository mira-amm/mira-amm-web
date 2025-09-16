import {isV2MockEnabled} from "@/src/utils/mockConfig";

export function MockModeIndicator() {
  if (!isV2MockEnabled()) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-sm  text-yellow-800 dark:text-yellow-200">
          V2 Mock Mode
        </span>
      </div>
      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
        Testing v2 features without contracts
      </p>
    </div>
  );
}
