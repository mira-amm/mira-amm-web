import { User } from '../payload-types';
import type { Access, AccessArgs, FieldHook } from 'payload'
type IsAuthenticated = (args: AccessArgs<User>) => boolean

export const checkRole = (roles: User["roles"] = [], user?: null | User) =>
    !!user?.roles?.some((role) => roles?.includes(role));

type isAdmin = (args: AccessArgs<User>) => boolean;

export const admins: isAdmin = ({ req: { user } }) => {
	return checkRole(["admin"], user);
};

export const anyone: Access = () => true;

// export const anyone: IsAuthenticated = ({ req: { user } }) => {
//   if (!user) return false;
//   return { id: user.id };
// };

export const adminsOrSelf: Access = ({ req: { user } }) => {
if (user) {
if (checkRole(["admin"], user)) {
return true;
}

return {
id: {
equals: user.id,
},
};
}

return false;
};


export const authenticated: IsAuthenticated = ({ req }) => {
  return Boolean(req.user)
}
