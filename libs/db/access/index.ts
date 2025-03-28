import type {User} from "@/db/payload-types";
import type {AccessArgs, FieldHook} from "payload";

type IsAuthenticated = (args: AccessArgs<User>) => boolean;

export const authenticated: IsAuthenticated = ({req}) => {
  return Boolean(req.user);
};
