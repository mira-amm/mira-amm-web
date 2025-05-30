export const StepsBlock: React.FC<{
  logo: React.ReactNode;
  title: string;
  description: string;
  done?: boolean;
}> = ({
  logo,
  title,
  description,
}) => {
  return (
    <div className="bg-[#262934] rounded-2xl w-[350px] flex flex-col items-center gap-4 px-6 pt-7 pb-10 box-border lg:w-full lg:pb-8">
      {logo}
      <h3 className="text-[26px] leading-8 text-center mt-[22px] font-[var(--font-inter)] lg:text-[24px] lg:leading-[30px]">
        {title}
      </h3>
      <p className="font-normal text-[16px] leading-6 text-center text-[var(--content-dimmed-light)]">
        {description}
      </p>
    </div>
  );
};
