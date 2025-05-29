export const MainInfo: React.FC<{
  title: string;
  description: string;
  children: React.ReactNode;
  link?: string;
}> = ({
  title,
  description,
  children,
  link,
}) => {
  return (
    <>
      <h2
        className="text-[32px] leading-[40px] lg:text-[44px] lg:leading-[52px] m-0 text-center"
        style={{ fontFamily: "var(--font-prompt)" }}
      >
        {title}
      </h2>
      <p
        className="text-[18px] leading-[24px] lg:text-[20px] lg:leading-[28px] m-0 lg:mb-0 text-center font-normal text-[var(--content-dimmed-light)] w-[350px] mx-auto mb-[28px] lg:mb-0"
      >
        {description}
        <a
          href="/"
          className="text-[var(--accent-primary)] underline"
        >
          {link}
        </a>
      </p>
      {children}
    </>
  );
};
