import { MockJSONUserRewardsService, UserRewardsResponse } from "@/src/models/rewards/UserRewards";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<UserRewardsResponse | {error: string}>
  ) {
    const {method} = req;

    try {
      switch (method) {
        case "GET":
          const userRewardsService = new MockJSONUserRewardsService("src/models/userRewards.json");

          const rewards = await userRewardsService.getRewards();

          return res.status(200).json(rewards);

        default:
          res.setHeader("Allow", ["GET"]);
          return res.status(405).end(`Method ${method} Not Allowed`);
      }
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch rewards"});
    }
  }
