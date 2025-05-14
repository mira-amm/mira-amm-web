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

export async function seedGames(payload: Payload) {
  payload.logger.info("📸 Uploading games & inserting scores...");

  const res = await payload.find({
      collection: "users",
      pagination: false,
    });

    const users = res.docs;

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
].map(async (game, index) => {
      const user = users[index % users.length];
      await payload.create({
        collection: "games",
        data: {
          player: user.id,
          score: game.score,
        },
      });
      payload.logger.info(`✅ Inserted game with score: ${game.score}, assigned to player: ${user.id}`);
    }),
  );
}
