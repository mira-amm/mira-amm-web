import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import path from 'path'

const mockGetCampaigns = vi.fn()

vi.mock('@/src/models/campaigns/Campaign', () => {
  return {
    SentioJSONCampaignService: class {
      constructor(public apiUrl: string, public apiKey: string, public epochConfigService: unknown) {}
      getCampaigns = mockGetCampaigns
    },
  }
})

vi.mock('@/src/models/campaigns/JSONEpochConfigService', () => {
  return {
    JSONEpochConfigService: class {
      constructor(public configPath: string) {}
    },
  }
})

vi.stubEnv('SENTIO_API_KEY', 'fake-key')
vi.stubEnv('SENTIO_API_URL', 'https://fake.api')

import { GET } from './route'

const EXPECTED_CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=150'
const EXPECTED_CONTENT_TYPE = 'application/json'

describe('GET /api/campaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('instantiates JSONEpochConfigService with the correct path', () => {
    const { JSONEpochConfigService } = require('@/src/models/campaigns/JSONEpochConfigService')
    expect(JSONEpochConfigService).toHaveBeenCalledOnce()
    const expectedPath = path.join(
      process.cwd(),
      '../../libs/web/src',
      'models',
      'campaigns.json'
    )
    expect(JSONEpochConfigService).toHaveBeenCalledWith(expectedPath)
  })

  it('returns 200 and calls getCampaigns() with no filters when no query params', async () => {
    const dummyCampaigns = [{ foo: 'bar' }]
    mockGetCampaigns.mockResolvedValueOnce(dummyCampaigns)

    const req = new NextRequest('https://example.com/api/campaigns')
    const res = await GET(req)

    expect(mockGetCampaigns).toHaveBeenCalledOnce()
    expect(mockGetCampaigns).toHaveBeenCalledWith({
      epochNumbers: undefined,
      poolIds: undefined,
      includeAPR: false,
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe(EXPECTED_CONTENT_TYPE)
    expect(res.headers.get('Cache-Control')).toBe(EXPECTED_CACHE_CONTROL)
    expect(await res.json()).toEqual(dummyCampaigns)
  })

  test.each([
    // [ queryString, expectedArguments ]
    ['epochNumbers=1,2', { epochNumbers: [1, 2], poolIds: undefined, includeAPR: false }],
    ['poolIds=a,b',      { epochNumbers: undefined, poolIds: ['a', 'b'], includeAPR: false }],
    ['includeAPR=true',  { epochNumbers: undefined, poolIds: undefined, includeAPR: true }],
    ['epochNumbers=3,4&poolIds=x,y&includeAPR=true', {
      epochNumbers: [3, 4],
      poolIds: ['x', 'y'],
      includeAPR: true,
    }],
  ])(
    'parses query "%s" correctly',
    async (queryString, expectedArgs) => {
      mockGetCampaigns.mockResolvedValueOnce([])

      const req = new NextRequest(`https://example.com/api/campaigns?${queryString}`)
      const res = await GET(req)

      expect(mockGetCampaigns).toHaveBeenCalledOnce()
      expect(mockGetCampaigns).toHaveBeenCalledWith(expectedArgs)
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual([])
    }
  )

  it('returns 500 and error message when getCampaigns throws', async () => {
    mockGetCampaigns.mockRejectedValueOnce(new Error('service down'))

    const req = new NextRequest('https://example.com/api/campaigns')
    const res = await GET(req)

    expect(res.status).toBe(500)
    expect(res.headers.get('Content-Type')).toBe(EXPECTED_CONTENT_TYPE)
    expect(await res.json()).toEqual({ message: 'service down' })
  })

  it('response JSON matches snapshot', async () => {
    const sample = [
      {
        epoch: { number: 7, startDate: '2025-06-01T00:00:00.000Z', endDate: '2025-06-08T00:00:00.000Z' },
        pool: { id: 'pool-id', symbols: ['USDC', 'FUEL'], lpToken: '0xabc' },
        rewards: [{ dailyAmount: 123, assetId: '0xfee' }],
        status: 'inprogress' as const,
      },
    ]
    mockGetCampaigns.mockResolvedValueOnce(sample)

    const req = new NextRequest('https://example.com/api/campaigns')
    const res = await GET(req)
    const json = await res.json()

    expect(json).toMatchSnapshot()
  })

  it('waits for async getCampaigns (fake timers)', async () => {
    const delayedResult = [{ dummy: true }]
    mockGetCampaigns.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(delayedResult), 500))
    )

    const req = new NextRequest('https://example.com/api/campaigns')
    vi.useFakeTimers()
    const promise = GET(req)
    vi.advanceTimersByTime(500)
    const res = await promise
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(delayedResult)
    vi.useRealTimers()
  })
})
