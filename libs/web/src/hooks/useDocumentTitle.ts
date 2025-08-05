import {useEffect} from "react";

/**
 * Hook to set the document title (metadata header tag)
 * @param title - The title to set. If undefined, the title won't be changed
 */
export const useDocumentTitle = (title: string | undefined) => {
  useEffect(() => {
    if (
      title !== undefined &&
      typeof document !== "undefined" &&
      document.title !== title
    ) {
      document.title = title;
    }
  }, [title]);
};
