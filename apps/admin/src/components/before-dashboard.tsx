import {Banner} from "@payloadcms/ui/elements/Banner";
import React from "react";

const baseClass = "before-dashboard";

export const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Welcome to your dashboard!</h4>
      </Banner>
    </div>
  );
};
