import {stringify} from "qs-esm";
import type {Where} from "payload";

const getTitle = async (): Promise<string> => {
  const query: Where = {
    "admin.login.text.name": {
      equals: "title",
    },
  };

  const stringifiedQuery = stringify(
    {
      where: query,
      depth: 3,
    },
    {addQueryPrefix: true}
  );

  try {
    const res = await fetch(
      `${process.env.NODE_ENV === "development" ? process.env.ADMIN_LOCAL_URL : process.env.ADMIN_PUBLIC_URL}
/api/globals/settings${stringifiedQuery}`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const data = await res.json();

    const title =
      data?.admin?.login?.text?.find((item: any) => item.name === "title")
        ?.text || "Error fetching title";

    return title;
  } catch (err) {
    console.error("Error fetching title:", err);
    return "Error fetching title";
  }
};

export async function TerminalHeader() {
  /* const title = await getTitle(); */

  return (
    <div className="h-8 bg-terminal-bg border-b border-terminal-text/30 flex items-center px-4">
      <div className="flex space-x-2 items-center">
        <span className="h-3 w-3 rounded-full bg-terminal-red" />
        <span className="h-3 w-3 rounded-full bg-terminal-yellow" />
        <span className="h-3 w-3 rounded-full bg-terminal-green" />
      </div>
      <div className="flex-1 text-center text-terminal-text text-sm">
        {/* {title} */}
        T-REX TECHNOLOGIES: DLM-2000 PROTOTYPE v0.8.5b
      </div>
    </div>
  );
}
