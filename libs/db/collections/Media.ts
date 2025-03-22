import type { CollectionConfig, Payload } from 'payload'

import { navAccordions } from '@/db/collections/navAccordions'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: navAccordions.categories,
    defaultColumns: [
      'filename',
      'alt',
      'prefix',
      'mimeType',
      'filesize',
      'updatedAt',
      'createdAt',
      'id',
    ],
    pagination: {
      defaultLimit: 50,
      limits: [10, 20, 50],
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    displayPreview: true,
   focalPoint: true,
  },
}

export async function seedMedia(payload: Payload) {
    payload.logger.info("📸 Uploading media...");
  try {
    await Promise.all(
      mediaSeedData.map(async (media) => {
  const res = await fetch(media.url, { method: 'GET' })

const contentType = res.headers.get("content-type") || "application/octet-stream";

  const data = await res.arrayBuffer()

        await payload.create({
    collection: 'media',
    file: {
      name: media.filename,
      data: Buffer.from(data),
      mimetype: contentType,
      size: data.byteLength,
    },
    data: { alt: media.alt || media.filename },
        })
      }),
    )
    payload.logger.info("📸 Media uploaded!");
  }
  catch (error) {
    console.error('Error seeding media data:', error)
  }
}

export const mediaSeedData = [
//   {
// alt: "Mira Symbol",
//     url: "https://mira.ly/images/favicon.png",
//     filename: "mira_symbol.svg"
//   },
//   {
// alt: "Mira Wordmark",
//     url: "https://4079782695-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F9vifHFKfl951onmvvApO%2Fuploads%2F706QDtbgWs2OvpBZh3Mk%2Flogo_primary_white.svg?alt=media&token=de16a6a8-c8d9-4cec-80cd-c0843dbd8039",
//     filename: "mira_wordmark.svg"
//   },
]
