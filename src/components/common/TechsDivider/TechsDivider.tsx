import { DividerText } from "../DividerText/dividerText";
import { UsedTechs } from "../UsedTechs/UsedTechs";
import Halborn from "../../icons/Halborn/Halborn";
import FuelGroup from "../../icons/FuelGroup/FuelGroup";
import { Divider } from "../Divider/Divider";

export const TechsDivider = () => {
  return (
    <Divider>
      <li>
        <DividerText text="Trade with confidence" />
      </li>
      <li>
        <UsedTechs text="Audited by">
          <Halborn />
        </UsedTechs>
      </li>
      <li>
        <UsedTechs text="Backed by">
          <FuelGroup />
        </UsedTechs>
      </li>
    </Divider>
  );
};
