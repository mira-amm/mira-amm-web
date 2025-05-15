import { navAccordions } from './navAccordions';
import { Payload, type CollectionConfig } from 'payload'

export const Games: CollectionConfig = {
  slug: 'games',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: [
      'id',
      'player',
      'score',
      'createdAt'
    ],
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
  { "score": 2000 },
  { "score": 3000 },
  { "score": 190 },
  { "score": 190 },
  { "score": 40 },
  { "score": 80 },
  { "score": 140 },
  { "score": 260 },
  { "score": 190 },
  { "score": 480 },
  { "score": 1100 },
  { "score": 400 },
  { "score": 800 },
  { "score": 150 },
  { "score": 620 },
  { "score": 700 },
  { "score": 90 },
  { "score": 50 },
  { "score": 310 },
  { "score": 1750 },
  { "score": 950 },
  { "score": 560 },
  { "score": 210 },
  { "score": 1330 },
  { "score": 2800 },
  { "score": 70 },
  { "score": 100 },
  { "score": 370 },
  { "score": 660 },
  { "score": 25 },
  { "score": 180 },
  { "score": 430 },
  { "score": 230 },
  { "score": 3100 },
  { "score": 120 },
  { "score": 330 },
  { "score": 240 },
  { "score": 160 },
  { "score": 90 },
  { "score": 380 },
  { "score": 1150 },
  { "score": 720 },
  { "score": 130 },
  { "score": 145 },
  { "score": 600 },
  { "score": 1550 },
  { "score": 270 },
  { "score": 1010 },
  { "score": 875 },
  { "score": 540 }
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
