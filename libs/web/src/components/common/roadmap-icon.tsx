export const RoadMapIcon: React.FC<{
  text: string;
}> = ({text}) => {
  return (
    <div
      className="min-w-[112px] h-10 rounded-full text-content-primary flex justify-center items-center px-[25.5px] py-2 box-border"
      style={{
        background:
          "linear-gradient(132.04deg, #262f5f 11.87%, #c41cff 176.88%)",
      }}
    >
      <span className="font-medium text-base leading-6 text-center">
        {text}
      </span>
    </div>
  );
};
