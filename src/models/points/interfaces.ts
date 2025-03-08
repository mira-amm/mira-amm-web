export interface PointsResponse {
  address: string;
  points: number;
  rank: number;
}

export interface PointsQueryParams {
  address?: string;
  limit?: number;
  offset?: number;
}

export interface PointsPerUserService {
  updateLatestPoints(): Promise<PointsResponse[]>;
  getPoints(
    queryParams: PointsQueryParams,
  ): Promise<{data: PointsResponse[]; totalCount: number}>;
}
