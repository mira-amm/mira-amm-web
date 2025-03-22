import type { CollectionConfig } from 'payload'
import { navAccordions } from './navAccordions';

import { authenticated } from '../access/index';

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
    group: navAccordions.categories,
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      defaultValue: 'test'
    },
    {
      name: 'email',
      type: 'email',
      defaultValue: 'test@mira.ly'
    },
  ],
  timestamps: true,
}
