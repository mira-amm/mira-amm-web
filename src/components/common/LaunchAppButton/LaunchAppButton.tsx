"use client";

import {useRouter} from "next/navigation";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";

type Props = {
  className?: string;
};

const LaunchAppButton = ({className}: Props) => {
  const router = useRouter();

  const handleLaunchApp = () => {
    router.push("/swap");
  };

  return (
    <ActionButton className={className} onClick={handleLaunchApp}>
      Launch App
    </ActionButton>
  );
};

export default LaunchAppButton;
