import { User } from '../payload-types';
import type { AccessArgs, FieldHook } from 'payload'

type IsAuthenticated = (args: AccessArgs<User>) => boolean

export const authenticated: IsAuthenticated = ({ req }) => {
  return Boolean(req.user)
}

export const anyone: IsAuthenticated = ({ req: { user } }) => {
  if (!user) return false;
  return { id: user.id };
};

export const isSuperAdmin: IsAuthenticated = ({ req: { user } }) =>
  user?.id === 1;

export const admins: IsAuthenticated = isSuperAdmin;

export const adminsAndUser: IsAuthenticated = ({ req: { user } }) => {
  if (!user) return false;
  if (isSuperAdmin({ req: { user } })) return true;
  return { id: user.id };
};

export const isSelf = ({ req: {user} }) => {
  if (!user) return false;
  if (user){
  return {
    id: {
      equals: user.id
    }
  }
};
}

export const protectRoles: FieldHook<{ id: string } & User> = ({ data, req }) => {
  if (!isSuperAdmin({ req })) return ['user'];
  const userRoles = new Set(data?.roles || []);
  userRoles.add('user');
  return [...userRoles];
};
