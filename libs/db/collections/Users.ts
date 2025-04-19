import type { CollectionConfig } from 'payload'

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
    defaultColumns: [
      'avatar',
      'firstName',
      'lastName',
      'email'
    ],
    useAsTitle: 'preferredDisplayName',
  },
  auth: true,
  fields: [
    {
      type:"row",
    fields:[
    {
      type: "collapsible",
      label: ({ data }) => data?.title || "Personal Information",
      fields: [
        {
          type: 'row',
          fields:[
        { name: "firstName", type: "text", label: "First Name" },
        { name: "middleName", type: "text", label: "Middle Name", admin: {hidden: true} },
        { name: "lastName", type: "text", label: "Last Name" },
        { name: "preferredDisplayName", type: "text", label: "Display Name" },
          ],
        },
        {
          name: "avatar",
          type: "upload",
          relationTo: "media",
          label: "Avatar",
        }
      ],
    },
    ]
    },
    {
      name: 'walletAddress',
      type: 'text',
    },
  ],
  timestamps: true,
}
