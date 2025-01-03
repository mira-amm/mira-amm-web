import {Tooltip} from "react-tooltip";
/* import "react-tooltip/dist/react-tooltip.css"; */
import {CustomTooltipProps} from "../ToolTipTypes";
import styles from "./InfoToolTip.module.css";
import {clsx} from "clsx";

const InfoToolTip: React.FC<CustomTooltipProps> = ({id, content, style}) => {
  return <Tooltip id={id} content={content} className={clsx(styles.tooltip)} />;
};

export default InfoToolTip;
