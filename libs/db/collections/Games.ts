import { navAccordions } from './navAccordions';
import { Payload, type CollectionConfig } from 'payload'

export const Games: CollectionConfig = {
  slug: 'games',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'score',
    defaultColumns: ['score', 'updatedAt', 'createdAt'],
    group: navAccordions.categories,
  },
  versions: {
    drafts: true,
    maxPerDoc: 3,
  },
  fields: [
    {type: 'relationship', name: 'player', relationTo: 'users', hasMany: false},
    {type: 'number', name: 'score', required: true}
  ],
}

export async function seedGames(payload: Payload, req: any) {
  payload.logger.info("📸 Uploading games & inserting scores...");
  await Promise.all(
[
      {
        "score": 40
      },
      {
        "score": 80
      },
      {
        "score": 140
      },
      {
        "score": 260
      },
      {
        "score": 190
      },
      {
        "score": 480
      },
].map(async (game) => {

      await payload.create({
        collection: "games",
        data: {
          score: game.score,
        },
      });
      payload.logger.info(`✅ Inserted brand: ${game.score}`);
    }),
  );
}
