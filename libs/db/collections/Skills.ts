import type { CollectionConfig } from 'payload'

export const Skills: CollectionConfig = {
  slug: 'skills',
  fields: [
    {
      name: 'activelyUsing',
      type: 'group',
      fields: [
        {
          name: 'languages',
          type: 'relationship',
          relationTo: 'brands',
          hasMany: true
        },
        {
          name: 'frameworksAndLibraries',
          type: 'relationship',
          relationTo: 'brands',
          hasMany: true
        },
        {
          name: 'tools',
          type: 'relationship',
          relationTo: 'brands',
          hasMany: true
        }
      ]
    },
    {
      name: 'previouslyUsed',
      type: 'group',
      fields: [
        {
          name: 'languages',
          type: 'relationship',
          relationTo: 'brands',
          hasMany: true
        },
        {
          name: 'frameworksAndLibraries',
          type: 'relationship',
          relationTo: 'brands',
          hasMany: true
        },
        {
          name: 'tools',
          type: 'relationship',
          relationTo: 'brands',
          hasMany: true
        }
      ]
    },
    {
      name: 'intendToUse',
      type: 'group',
      fields: [
        {
          name: 'languages',
          type: 'relationship',
          relationTo: 'brands',
          hasMany: true
        },
        {
          name: 'frameworksAndLibraries',
          type: 'relationship',
          relationTo: 'brands',
          hasMany: true
        },
        {
          name: 'tools',
          type: 'relationship',
          relationTo: 'brands',
          hasMany: true
        }
      ]
    }
  ],
  timestamps: true,
}
