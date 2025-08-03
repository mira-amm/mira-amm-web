"use client";

export const TableRowContainer = ({children}: {children: React.ReactNode}) => (
  <div className="grid grid-cols-3 md:grid-cols-4 gap-4 items-center py-4 hover:bg-background-grey-darkertransition rounded-lg px-2">
    {children}
  </div>
);
