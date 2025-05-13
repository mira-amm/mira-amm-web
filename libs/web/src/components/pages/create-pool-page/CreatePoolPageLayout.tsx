"use client";
import CreatePool from "./components/CreatePool/CreatePool";
import {useEffect, useRef} from "react";

const CreatePoolPageLayout = () => {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollIntoView();
    }
  }, []);

  return (
    <>
      <main className="action-layout" ref={mainRef}>
        <CreatePool />
      </main>
    </>
  );
};

export default CreatePoolPageLayout;
