export const InfoBlocks: React.FC<{
  title?: string;
  children?: React.ReactNode;
}> = ({title, children}) => {
  return (
    <div className="flex flex-col items-center">
      <h3
        className="font-normal text-[24px] leading-[30px] lg:text-[26px] lg:leading-[32px] text-center my-[20px] mt-[20px] mb-[12px]"
      >
        {title}
      </h3>
      <ul className="list-none p-0 flex flex-col max-md:items-center gap-[16px] lg:flex-row lg:gap-[16px] w-full lg:w-auto">
        {children}
      </ul>
    </div>
  );
};
