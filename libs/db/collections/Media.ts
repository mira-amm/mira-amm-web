import type { CollectionConfig, Payload } from 'payload'

import { navAccordions } from '@/db/collections/navAccordions'
import {
  isSuperAdmin,
} from "@/db/access";

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    update: isSuperAdmin,
  },
  admin: {
    group: navAccordions.categories,
    defaultColumns: ['filename', 'alt', 'prefix', 'mimeType', 'filesize', 'updatedAt', 'createdAt', 'id'],
    pagination: {
      defaultLimit: 50,
      limits: [10, 20, 50],
    },
  },
  fields: [{name: 'alt', type: 'text', required: true}],
  upload: {displayPreview: true, focalPoint: true},
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
  {
    alt: "cuHacking 2025 Symbol White",
    url: "https://github.com/user-attachments/assets/dd5a291f-146d-4dc5-b9e8-32bd43ca0df5",
    filename: "cuhacking-symbol-white.png"
  },
  {
    alt: "Microchain Systems Wordmark",
    url: "https://microchain.systems/logo.cc6b5658.png",
    filename: "microchain-systems-wordmark.png"
  },
]
