/* eslint-disable node/prefer-global/buffer */
import type { File, Payload, PayloadRequest } from "payload";
import { seedMedia } from '../collections/Media';
import { promises as fs } from "fs";
import path from "path";
import {seedBrands} from '../collections'

export async function seed({
  payload,
  req,
}: {
  payload: Payload;
  req: PayloadRequest;
}): Promise<{ message: string }> {
  payload.logger.info("🌱 Seeding database...");

  await Promise.all(
    [
      "users",
      "brands",
      "forms",
      "form-submissions",
    ].map(async (collection) => {
      if (collection === "users") {
        await payload.db.deleteMany({
          collection,
          req,
          where: {
            id: { not_equals: 1 },
          },
        });
      } else {
        await payload.db.deleteMany({ collection, req, where: {} });
      }

      if (payload.collections[collection].config.versions) {
        await payload.db.deleteVersions({ collection, req, where: {} });
      }
    }),
  );

  const mediaDir = path.resolve("../../apps/microgame/media");

  try {
    await fs.rm(mediaDir, { recursive: true, force: true });
    payload.logger.info(`🗑 Deleted media directory: ${mediaDir}`);
  } catch (error) {
    payload.logger.warn(
      `⚠ Failed to delete media directory: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  try {
    await seedMedia(payload);
    await seedBrands(payload);
  } catch (error) {
    payload.logger.error(
      `❌ Error seeding initial data: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  payload.logger.info("📝 Seeding forms...");

  try {
    const forms = [
      {
        title: "cuHacking 6 Registration Form",
        fields: [
          {
            blockName: "We really want to see you there!",
            blockType: "message",
            message: formatRichText({
              children: [
                {
                  type: "paragraph",
                  children: [
                    {
                      mode: "normal",
                      text: "We really want to see you there!",
                      type: "text",
                    },
                  ],
                },
              ],
            }),
          },
          {
            name: "what-challenge-are-you-most-interested-in",
            label: "What challenge are you most interested in?",
            width: 100,
            required: true,
            blockType: "select",
            options: [
              { label: "hardware", value: "🤖 Hardware" },
              { label: "ai-ml", value: "🧠 AI/ML" },
              { label: "full-stack", value: "📱 Full-Stack (Mobile and Web)" },
              { label: "cybersecurity", value: "👩‍💻 CyberSecurity" },
            ],
          },
        ],
        submitButtonLabel: "Register",
        confirmationMessage: formatRichText({
          children: [
            {
              type: "paragraph",
              children: [
                {
                  mode: "normal",
                  text: "Thanks for Registering!",
                  type: "text",
                },
              ],
            },
          ],
        }),
      },
    ];

    await Promise.all(
      forms.map(async (form) => {
        await payload.create({
          collection: "forms",
          data: form,
        });

        payload.logger.info(`✅ Inserted form: ${form.title}`);
      }),
    );

    payload.logger.info("✅ All form seed data successfully inserted!");
  } catch (error) {
    payload.logger.error(
      `❌ Error seeding form data: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  payload.logger.info("🎉 Database seeded successfully! 🌱");

  return { message: "Database seeded successfully!" };
}

export async function getOrUploadMedia(
  payload: Payload,
  req: PayloadRequest,
  url: string | undefined,
  filename: string,
  alt: string,
): Promise<File | null> {
  if (!url) return null;

  try {
    const existingMedia = await payload.find({
      collection: "media",
      where: { alt: { equals: alt } },
      limit: 1,
    });

    if (existingMedia.docs.length > 0) {
      payload.logger.info(
        `🔄 Reusing existing media: ${filename} (alt: ${alt})`,
      );
      return existingMedia.docs[0];
    }

    payload.logger.info(`📥 Fetching image: ${url}`);
    const res = await fetch(url);
    if (!res.ok)
      throw new Error(`Failed to fetch ${url}, status: ${res.status}`);

    const data = Buffer.from(await res.arrayBuffer());

const contentType = res.headers.get("content-type") || "application/octet-stream";

    const uploadedFile = await payload.create({
      collection: "media",
      file: {
        name: filename,
        data,
      mimetype: contentType,
        size: data.length,
      },
      data: { alt },
    });

    payload.logger.info(`✅ Uploaded image: ${filename}`);
    return uploadedFile;
  } catch (error) {
    payload.logger.warn(
      `⚠ Error handling media (${filename}): ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return null;
  }
}

export function formatRichText(content: any) {
  return { root: { type: "root", children: content.children } };
}
