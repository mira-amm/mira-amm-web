import { DropDownMenuButtons } from "../ts-interfaces/DropDownMenuButtons";
import CopyIcon from "../components/icons/Copy/CopyIcon";
import { ExplorerIcon } from "../components/icons/Explorer/ExplorerIcon";
import { TransactionsIcon } from "../components/icons/Transactions/TransactionsIcon";
import { LogOut } from "../components/icons/LogOut/LogOut";

export const DropDownButtons: DropDownMenuButtons[] = [
  {
    icon: CopyIcon,
    text: "Copy Address",
    onClick: () => {},
  },
  {
    icon: ExplorerIcon,
    text: "View in Explorer",
    onClick: () => {},
  },
  {
    icon: TransactionsIcon,
    text: "Transaction History",
    onClick: () => {},
  },
  {
    icon: LogOut,
    text: "Disconnect",
    onClick: () => {},
  },
];
