import { navAccordions } from './navAccordions';
import { Payload, type CollectionConfig } from 'payload'

export const Games: CollectionConfig = {
  slug: 'games',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['id', 'player', 'score', 'createdAt'],
    group: navAccordions.categories,
    pagination: {
      defaultLimit: 50,
      limits: [10, 20, 50],
    },
  },
    defaultSort: '-score',
    disableDuplicate: true,
  fields: [
    {type: 'relationship', name: 'player', relationTo: 'users', hasMany: false, index: true},
    {type: 'number', name: 'score', required: true, index: true}
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
  { "score": 20 },
  { "score": 30 },
  { "score": 190 },
  { "score": 190 },
  { "score": 40 },
  { "score": 80 },
  { "score": 140 },
  { "score": 260 },
  { "score": 190 },
  { "score": 180 },
  { "score": 110 },
  { "score": 100 },
  { "score": 100 },
  { "score": 150 },
  { "score": 120 },
  { "score": 200 },
  { "score": 90 },
  { "score": 50 },
  { "score": 110 },
  { "score": 175 },
  { "score": 150 },
  { "score": 260 },
  { "score": 210 },
  { "score": 140 },
  { "score": 280 },
  { "score": 70 },
  { "score": 100 },
  { "score": 30 },
  { "score": 60 },
  { "score": 25 },
  { "score": 180 },
  { "score": 130 },
  { "score": 230 },
  { "score": 110 },
  { "score": 120 },
  { "score": 330 },
  { "score": 240 },
  { "score": 160 },
  { "score": 90 },
  { "score": 180 },
  { "score": 115 },
  { "score": 220 },
  { "score": 130 },
  { "score": 145 },
  { "score": 200 },
  { "score": 155 },
  { "score": 170 },
  { "score": 100 },
  { "score": 80 },
  { "score": 20 }
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
