export const StepsIcon: React.FC<{
  icon: React.ReactNode;
}> = ({icon}) => {
  return (
    <div
      className="flex flex-col justify-center items-center w-16 h-16 rounded-[10px]"
      style={{
        background:
          "linear-gradient(132.04deg, #262f5f 11.87%, #c41cff 176.88%)",
      }}
    >
      {icon}
    </div>
  );
};
