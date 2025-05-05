import { useQuery } from "@tanstack/react-query";
import { createContext, Dispatch, SetStateAction, useContext, useDeferredValue, useMemo, useState } from "react";

type PaginationContextType = {
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  data: any;
  loading: boolean;
  error: any;
  totalCount: number;
  totalPages: number;
  pageSize: number;
  isOnLastPage: boolean;
};

const PaginationContext = createContext<PaginationContextType>({} as PaginationContextType);

export const usePaginationContext = () => useContext(PaginationContext);

interface PaginationContextProviderProps {
  children: React.ReactNode | ((value: PaginationContextType) => React.ReactNode);
  initialPage: number;
  fetchData: (page: number) => Promise<any>;
  pageSize: number;
}

export const PaginationContextProvider = ({
  children,
  initialPage,
  fetchData = async () => null,
  pageSize,
}: PaginationContextProviderProps) => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const { data, isLoading, error } = useQuery({
    queryKey: ["PAGINATED_DATA", currentPage],
    queryFn: async () => {
      return await fetchData(currentPage);
    },
  });

  const currentData = useDeferredValue(data);
  const currentLoading = useDeferredValue(isLoading);
  const totalCount = currentData?.totalCount ?? 0;
  const totalPages = Math.floor((totalCount - 1) / pageSize) + 1;

  const value = useMemo(
    () => ({
      currentPage,
      setCurrentPage,
      data: currentData,
      loading: currentLoading,
      error,
      totalCount,
      totalPages,
      pageSize,
      isOnLastPage: currentPage === totalPages,
    }),
    [currentPage, currentData, currentLoading, error, totalCount, totalPages, pageSize]
  );

  return (
    <PaginationContext.Provider value={value}>
      {typeof children === "function" ? children(value) : children}
    </PaginationContext.Provider>
  );
};
