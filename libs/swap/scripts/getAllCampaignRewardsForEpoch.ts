// This script fetches all user rewards for a given epochNumber based on src/models/campaigns.json

import {JSONEpochConfigService} from "../src/models/campaigns/JSONEpochConfigService";
import {loadFile} from "../src/utils/fileLoader";
import {writeFileSync, readFileSync} from "fs";
import path from "path";
import dotenv from "dotenv";
import {Decimal} from "decimal.js";

// CONSTANT DECLARATION
const FUEL_ASSET_ID =
  "0x1d5d97005e41cae2187a895fd8eab0506111e0e2f3331cd3912c15c24e3c1d82";
// acceptable margin of error for the sum of all reward portions only if the sum is less than the number of hours in the epoch
const ACCEPTABLE_MARGIN_OF_ERROR = 0.0000001;
const FUEL_DECIMALS = 9;
const CSV_PREFIX = "total-rewards-epoch";
const ORDERED_CSV_SUFFIX = "-ordered.csv";
const UNAGGREGATED_CSV_SUFFIX = "-unaggregated.csv";
const AGGREGATED_CSV_SUFFIX = "-aggregated.csv";

// INTERFACE DECLARATION
interface HourlyUserShare {
  distinct_id: string;
  hourly_user_share: number;
}

// load env variables from .env file
dotenv.config();

async function main() {
  //load campaign data
  const campaignPoolRewardsPerUserPerHourQuery = loadFile(
    path.join(
      process.cwd(),
      "src",
      "queries",
      "CampaignPoolRewardsPerUserPerHour.sql",
    ),
  );

  // get user input for epochNumber
  const epochNumber = Number(process.argv[2]);

  const csvFilePath = path.join(
    process.cwd(),
    "generated",
    `${CSV_PREFIX}-${epochNumber}.csv`,
  );

  const epochConfigService = new JSONEpochConfigService(
    path.join(process.cwd(), "../../libs/web/src", "models", "campaigns.json"),
  );

  // overwrite the csv file
  writeFileSync(csvFilePath.replace(".csv", UNAGGREGATED_CSV_SUFFIX), "");

  // get all user rewards for the given epochNumber
  // extract startDate, endDate, poolIds, rewardToken and dailyRewardAmount from the campaigns array
  const epoch = epochConfigService.getEpochs([epochNumber])[0];

  // calculate the number of days in the epoch
  const epochNumberDays = new Decimal(new Date(epoch.endDate).getTime())
    .minus(new Date(epoch.startDate).getTime())
    .dividedBy(new Decimal(1000 * 60 * 60 * 24));

  // calculate the number of hours in the epoch
  const epochNumberHours = epochNumberDays.times(24);

  const {startDate, endDate, campaigns} = epoch;

  // get the sentio api key from the environment variables
  const sentioApiKey = process.env.SENTIO_API_KEY;
  const sentioApiUrl = process.env.SENTIO_API_URL;

  if (!sentioApiKey || !sentioApiUrl) {
    throw new Error("SENTIO_API_KEY and SENTIO_API_URL must be set");
  }

  // for each campaign do the following:
  // START CAMPAIGN
  const promises = campaigns.map(async (campaign) => {
    const {pool, rewards} = campaign;
    const {dailyAmount, assetId} = rewards[0];

    if (assetId !== FUEL_ASSET_ID) {
      throw new Error("AssetId is not fuel");
    }

    // calculate the hourly rewards for the given epochNumber
    let hourlyRewardAmount = new Decimal(dailyAmount).dividedBy(24);

    // fetch a list of all users who have rewards for the given epochNumber and their proportional rewards
    // Each user has a sum of their hourly rewards proportions, thus the sum of all reward portions for each hour is 1
    const userRewards: HourlyUserShare[] = await fetchUserRewardsForCampaign(
      sentioApiKey,
      startDate,
      endDate,
      pool,
      campaignPoolRewardsPerUserPerHourQuery,
      sentioApiUrl,
    );
    // format the results as a csv with the following columns:
    // userId, totalRewardAmount

    console.log(
      "Number of users for campaign",
      campaign.pool.lpToken,
      userRewards.length,
    );

    // To verify, ensure that the number of hours in the epoch is equal to the sum of all reward portions
    hourlyRewardAmount = verifyCampaignRewardAmount(
      campaign.pool.lpToken,
      userRewards,
      epochNumberHours,
      hourlyRewardAmount,
    );

    appendRewardsToFile(
      userRewards,
      hourlyRewardAmount,
      csvFilePath.replace(".csv", UNAGGREGATED_CSV_SUFFIX),
    );

    return;
    // END CAMPAIGN
  });

  await Promise.all(promises);

  // aggregate same address results from the csv file
  aggregateRewardsByAddressAndWriteToFile(
    csvFilePath.replace(".csv", UNAGGREGATED_CSV_SUFFIX),
    csvFilePath.replace(".csv", AGGREGATED_CSV_SUFFIX),
  );

  // calculate the sum of the csv file
  orderByAmountAndWriteToFile(
    csvFilePath.replace(".csv", AGGREGATED_CSV_SUFFIX),
    csvFilePath.replace(".csv", ORDERED_CSV_SUFFIX),
  );

  // read the ordered csv data
  const totalActualRewards = verifyTotalRewardsAmount(
    csvFilePath.replace(".csv", ORDERED_CSV_SUFFIX),
    campaigns,
    epochNumberDays,
  );

  console.log("Total rewards:", totalActualRewards.toString());
}

main();

function verifyTotalRewardsAmount(
  inputCsvFilePath: string,
  campaigns: {
    pool: {id: string; lpToken: string};
    rewards: {dailyAmount: number; assetId: string}[];
  }[],
  epochNumberDays: Decimal,
) {
  const orderedCsvData = readFileSync(inputCsvFilePath, "utf8");

  // confirm that the sum of all rewards is less than or equal to the sum of all dailyRewards for each campaign * number of days in the epoch
  const totalExpectedRewards = campaigns.reduce(
    (acc: Decimal, campaign) =>
      acc.plus(
        new Decimal(campaign.rewards[0].dailyAmount).times(epochNumberDays),
      ),
    new Decimal(0),
  );

  const totalActualRewards = orderedCsvData
    .split("\n")
    .reduce((acc: Decimal, line: string) => {
      const [_, rewardAmount] = line.split(",");
      return acc.plus(new Decimal(rewardAmount || 0));
    }, new Decimal(0));

  // allow the margin of error for this comparison
  const marginOfError = totalExpectedRewards
    .minus(totalActualRewards)
    .dividedBy(totalExpectedRewards);
  if (
    marginOfError.abs().lessThan(ACCEPTABLE_MARGIN_OF_ERROR) &&
    totalActualRewards.lessThan(totalExpectedRewards)
  ) {
    console.log(
      "Total actual rewards are less than the total expected rewards, but the margin of error is acceptable",
    );
  } else {
    throw new Error(
      `Total actual rewards are not equal to the total expected rewards: ${totalActualRewards.toString()} !== ${totalExpectedRewards.toString()}`,
    );
  }
  return totalActualRewards;
}

function orderByAmountAndWriteToFile(
  inputCsvFilePath: string,
  outputCsvFilePath: string,
) {
  const aggregatedCsvData = readFileSync(inputCsvFilePath, "utf8");

  // order the csv data by amount in descending order
  const orderedAllocationsByAmountDesc = aggregatedCsvData
    .split("\n")
    .sort((a, b) =>
      new Decimal(b.split(",")[1])
        .minus(new Decimal(a.split(",")[1]))
        .toNumber(),
    );

  // write the ordered csv data to a new file
  writeFileSync(outputCsvFilePath, orderedAllocationsByAmountDesc.join("\n"));
}

function aggregateRewardsByAddressAndWriteToFile(
  inputCsvFilePath: string,
  outputCsvFilePath: string,
) {
  const unaggregatedCsvData = readFileSync(inputCsvFilePath, "utf8");

  const csvDataLines = unaggregatedCsvData.split("\n");
  const csvDataLinesWithoutHeader = csvDataLines;

  const csvDataLinesWithoutHeaderGroupedByAddress =
    csvDataLinesWithoutHeader.reduce(
      (acc: Record<string, string>, line: string) => {
        const [address, rewardAmount] = line.split(",");
        if (address === "") {
          return acc;
        }
        acc[address] = acc[address]
          ? new Decimal(acc[address]).plus(new Decimal(rewardAmount)).toString()
          : rewardAmount;
        return acc;
      },
      {},
    );

  // write the aggregated results to a new csv file
  writeFileSync(
    outputCsvFilePath,
    Object.entries(csvDataLinesWithoutHeaderGroupedByAddress)
      .map(([address, rewardAmount]) => `${address},${rewardAmount}`)
      .join("\n"),
  );
}

function appendRewardsToFile(
  userRewards: HourlyUserShare[],
  hourlyRewardAmount: Decimal,
  csvFilePath: string,
) {
  const csvData = userRewards
    .map(
      (userReward) =>
        `${userReward.distinct_id},${new Decimal(userReward.hourly_user_share).times(hourlyRewardAmount).toFixed(FUEL_DECIMALS)}`,
    )
    .join("\n");

  // append the results to the csv file
  writeFileSync(csvFilePath, csvData + "\n", {
    flag: "a",
  });
}

function verifyCampaignRewardAmount(
  lpToken: string,
  userRewards: HourlyUserShare[],
  epochNumberHours: Decimal,
  hourlyRewardAmount: Decimal,
) {
  const sumOfAllRewardPortions = userRewards.reduce(
    (acc: Decimal, userReward) => acc.plus(userReward.hourly_user_share),
    new Decimal(0),
  );
  if (!sumOfAllRewardPortions.equals(epochNumberHours)) {
    // calculate margin of error
    const marginOfError = epochNumberHours
      .minus(sumOfAllRewardPortions)
      .dividedBy(epochNumberHours);
    // ensure that the margin of error is acceptable
    if (marginOfError.abs().lessThan(ACCEPTABLE_MARGIN_OF_ERROR)) {
      if (sumOfAllRewardPortions.greaterThan(epochNumberHours)) {
        console.log(
          `\nPool: ${lpToken}\nSum of all reward portions is greater than the number of hours in the epoch, but the margin of error is acceptable: ${sumOfAllRewardPortions.toString()} !== ${epochNumberHours.toString()}, margin of error: ${marginOfError.toString()}\nAdjusting sum of all reward portions to be equal to the number of hours in the epoch: ${sumOfAllRewardPortions.toString()}`,
        );
        // adjust the sum of all reward portions to be equal to the number of hours in the epoch
        hourlyRewardAmount = hourlyRewardAmount.times(marginOfError.plus(1));
      } else {
        console.log(
          `\nPool: ${lpToken}\nSum of all reward portions is less than the number of hours in the epoch, but the margin of error is acceptable: ${sumOfAllRewardPortions.toString()} !== ${epochNumberHours.toString()}, margin of error: ${marginOfError.toString()}`,
        );
      }
    } else {
      throw new Error(
        `\nPool: ${lpToken}\nSum of all reward portions is not equal to the number of hours in the epoch: ${sumOfAllRewardPortions.toString()} !== ${epochNumberHours.toString()}`,
      );
    }
  }
  return hourlyRewardAmount;
}

async function fetchUserRewardsForCampaign(
  sentioApiKey: string,
  startDate: string,
  endDate: string,
  pool: {id: string; lpToken: string},
  campaignPoolRewardsPerUserPerHourQuery: string,
  sentioApiUrl: string,
) {
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": sentioApiKey,
    },
    body: JSON.stringify({
      sqlQuery: {
        parameters: {
          fields: {
            epochStart: {timestampValue: startDate},
            epochEnd: {timestampValue: endDate},
            lpToken: {stringValue: pool.lpToken},
            // VerifiedAsset does not have FUEL so we cannot derive fuel symbol from assetId
            // therefore we hardcode it
            campaignRewardToken: {stringValue: "fuel"},
          },
        },
        // allow for 10000 rows to be returned
        size: 10000,
        sql: campaignPoolRewardsPerUserPerHourQuery,
      },
    }),
  };

  console.log("Fetching user rewards for pool", pool.lpToken);

  const response = await fetch(sentioApiUrl, options);
  const json = await response.json();
  if (json.code === 16) {
    console.log(json.message);
    throw new Error(json.message);
  }

  const userRewards: HourlyUserShare[] = json.result.rows;
  return userRewards;
}
