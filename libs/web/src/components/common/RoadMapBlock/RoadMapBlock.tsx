import CheckboxIcon from "../../icons/CheckboxIcon";

export const RoadMapBlock: React.FC<{
  logo: React.ReactNode;
  title: string;
  description: string;
  done?: boolean;
}> = ({ logo, title, description, done }) => {
  return (
    <div className="bg-[#262934] rounded-xl flex flex-col items-center space-y-10 p-6 w-full max-w-[350px] font-inter">
      {logo}
      <h3 className="text-xl leading-[30px] font-medium text-center min-h-[120px]">
        {title}
      </h3>
      <div className="flex items-center justify-center gap-2 pt-2">
        {done && <CheckboxIcon />}
        <p
          className={`text-sm leading-[22px] font-medium text-center text-nowrap ${
            done
              ? "text-[var(--content-positive)]"
              : "text-[var(--content-grey)]"
          }`}
        >
          {description}
        </p>
      </div>
    </div>
  );
};
