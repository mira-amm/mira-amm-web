import { DividerText } from "../DividerText/dividerText";
import { UsedTechs } from "../UsedTechs/UsedTechs";
import Halborn from "../../icons/Halborn/HalbornIcon";
import FuelGroup from "../../icons/FuelGroup/FuelGroup";
import { Divider } from "../Divider/Divider";
import OttersecIcon from "@/src/components/icons/Ottersec/OttersecIcon";

export function TechsDivider(){
  return (
    <Divider className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-[164px] px-6 lg:px-12 py-6">
      <DividerText text="Trade with confidence" dimmed />

      <div className="flex items-center gap-4">
        <UsedTechs text="Audited by">
          <a
            className="transition-opacity duration-300 hover:opacity-65"
            href="https://docs.mira.ly/developer-guides/security-audit"
            target="_blank"
            rel="noopener noreferrer"
          >
            <OttersecIcon />
          </a>
          <a
            className="transition-opacity duration-300 hover:opacity-65"
            href="https://docs.mira.ly/developer-guides/security-audit"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Halborn />
          </a>
        </UsedTechs>
      </div>

      <div className="flex items-center gap-4">
        <UsedTechs text="Supported by">
          <a
            className="transition-opacity duration-300 hover:opacity-65 ml-2"
            href="https://fuel.network"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FuelGroup />
          </a>
        </UsedTechs>
      </div>
    </Divider>
  );
};
