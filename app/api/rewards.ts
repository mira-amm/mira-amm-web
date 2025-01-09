import {NextRequest, NextResponse} from "next/server";

export async function GET(request: NextRequest) {
  try {
        // TODO: Add your reward fetching logic here
    switch (method) {
        case "GET":
            const rewards = [
            {id: 1, name: "Reward 1", points: 100},
            {id: 2, name: "Reward 2", points: 200},
            ];

            return NextResponse.json({rewards}, {status: 200});
    
        default:
            res.setHeader("Allow", ["GET"]);
            return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (error) {
    return NextResponse.json({error: "Failed to fetch rewards"}, {status: 500});
  }
}
