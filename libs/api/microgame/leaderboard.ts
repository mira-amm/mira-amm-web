import axios from "axios";

const BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : "https://microchain.systems";

const API_URL = `${BASE_URL}/api/globals/leaderboard`;
// const API_URL = `${BASE_URL}/api/globals/leaderboard?select[id]=true&select[user][walletAddress]=true&select[score]=true`;

export const getLeaderboard = async () => {
  try {
    const response = await axios.get(API_URL, {
      params: {
        depth: 4,
        draft: false,
      },
    });

    const entries = response.data?.entries || [];
    console.log(entries);
    return (
      entries
        //   .filter((entry: any) => entry.user?.walletAddress && entry.score)
        .map((entry: any) => ({
          id: entry.id,
          walletAddress: entry.user,
          score: entry.score,
        }))
    );
  } catch (err) {
    console.error("Failed to fetch leaderboard:", err);
    throw err;
  }
};

export const updateLeaderboard = async (
  entries: Array<{user: string; score: number; gameData?: any}>,
  token: string,
) => {
  try {
    const response = await axios.post(
      API_URL,
      {entries},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  } catch (err) {
    console.error("Failed to update leaderboard:", err);
    throw err;
  }
};
