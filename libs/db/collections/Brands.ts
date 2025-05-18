import type { CollectionConfig } from 'payload/types'
import { navAccordions } from './navAccordions';
import { Payload, PayloadRequest } from 'payload'
import { getOrUploadMedia } from '../seed/index';

export const Brands: CollectionConfig = {
  slug: 'brands',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'symbol', 'description', 'id', 'updatedAt', 'createdAt'],
    group: navAccordions.categories,
  },
  versions: {
    drafts: true,
    maxPerDoc: 3,
  },
  hooks: {
  },
  fields: [
    {type:"row",
    fields:[
    { name: 'symbol', type: 'upload', relationTo: 'media', label: 'Symbol', required: false,
      access: {
    read: () => true,
    } },
    { name: 'wordmark', type: 'upload', relationTo: 'media', label: 'Wordmark', required: false },
    ]},
    { name: 'name', type: 'text', required: true, label: 'Name' },
    { name: 'description', type: 'textarea', label: 'Description' },
    { name: 'domain', type: 'text', admin: { position: 'sidebar' } },
    {name: 'links', type: 'array', label: 'Links',
      labels: {singular: 'Link', plural: 'Links'},
      fields: [
        {name: 'name', type: 'text'},
        {name: 'link', type: 'text'},
      ],
    },
  ],
}

export async function seedBrands(payload: Payload, req: PayloadRequest) {
  payload.logger.info("📸 Uploading brand logos & inserting brands...");
  await Promise.all(
[
      {
        "name": "Pyth Network",
        "description": "Smarter Data for Smarter Contracts",
        "domain": "https://www.pyth.network",
        "symbol": "https://avatars.githubusercontent.com/u/75637738?s=200&v=4"
      },
      {
        "name": "Swaylend",
        "description": "Experience lightning-fast, low-cost lending and borrowing on Fuel.",
        "domain": "https://swaylend.com",
        "symbol": "https://swaylend.com/_next/static/media/dark-logo.f8b6fe51.svg"
      },
      {
        "name": "Microchain Systems",
        "description": "State of the art DAPP on the Fuel Network",
        "domain": "https://microchain.systems",
        "symbol": "https://microchain.systems/logo.cc6b5658.png"
      },
      {
        "name": "Mira",
        "description": "The Liquidity Hub on Fuel",
        "domain": "https://mira.ly/",
        "symbol": "https://axfixdzedlzzumwcftks.supabase.co/storage/v1/object/sign/staging/symbol.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA5OTIwOGVlLTRkNmUtNGI4ZC1hN2VjLTcyMDEzOGY1YTEyNCJ9.eyJ1cmwiOiJzdGFnaW5nL3N5bWJvbC5wbmciLCJpYXQiOjE3NDcxNzA3MTEsImV4cCI6MTc3ODcwNjcxMX0.jfrjqRAYnZzXCpLiUQePvnAWDDlFpvv6rdrgDxtJwJQ"
      },
      {
        "name": "ChartHouse Labs",
        "description": "Charting the Future through Exceptional Web3 Solutions.",
        "domain": "https://charthouse.io",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg"
      },
      {
        "name": "Ethereum",
        "domain": "https://ethereum.org/en/",
        "symbol": "https://verified-assets.fuel.network/images/eth.svg"
      },
      {
        "name": "Fuel",
        "domain": "https://fuel.network",
        "symbol": "https://verified-assets.fuel.network/images/fuel.svg"
      },
   {"name": "WETH", "symbol": "https://verified-assets.fuel.network/images/weth.svg"},
  {"name": "weETH", "symbol": "https://verified-assets.fuel.network/images/weETH.webp"},
  {"name": "rsETH", "symbol": "https://verified-assets.fuel.network/images/rsETH.webp"},
  {"name": "rETH", "symbol": "https://verified-assets.fuel.network/images/reth.svg"},
  {"name": "wbETH", "symbol": "https://verified-assets.fuel.network/images/wbeth.png"},
  {"name": "rstETH", "symbol": "https://verified-assets.fuel.network/images/rstETH.webp"},
  {"name": "amphrETH", "symbol": "https://verified-assets.fuel.network/images/amphrETH.png"},
  {"name": "Manta mBTC", "symbol": "https://verified-assets.fuel.network/images/manta-mbtc.svg"},
  {"name": "Manta mETH", "symbol": "https://verified-assets.fuel.network/images/manta-meth.svg"},
  {"name": "Manta mUSD", "symbol": "https://verified-assets.fuel.network/images/manta-musd.svg"},
  {"name": "pumpBTC", "symbol": "https://verified-assets.fuel.network/images/pumpbtc.webp"},
  {"name": "FBTC", "symbol": "https://verified-assets.fuel.network/images/fbtc.svg"},
  {"name": "SolvBTC", "symbol": "https://verified-assets.fuel.network/images/solvBTC.webp"},
  {"name": "SolvBTC.BBN", "symbol": "https://verified-assets.fuel.network/images/SolvBTC.BBN.png"},
  {"name": "Mantle mETH", "symbol": "https://verified-assets.fuel.network/images/mantle-meth.svg"},
  {"name": "sDAI", "symbol": "https://verified-assets.fuel.network/images/sdai.svg"},
  {"name": "USDT", "symbol": "https://verified-assets.fuel.network/images/usdt.svg"},
  {"name": "USDC", "symbol": "https://verified-assets.fuel.network/images/usdc.svg"},
  {"name": "USDe", "symbol": "https://verified-assets.fuel.network/images/USDe.svg"},
  {"name": "sUSDe", "symbol": "https://verified-assets.fuel.network/images/sUSDe.webp"},
  {"name": "rsUSDe", "symbol": "https://verified-assets.fuel.network/images/rsUSDe.svg"},
  {"name": "wstETH", "symbol": "https://verified-assets.fuel.network/images/wsteth.svg"},
  {"name": "ezETH", "symbol": "https://verified-assets.fuel.network/images/ezeth.webp"},
  {"name": "pzETH", "symbol": "https://verified-assets.fuel.network/images/pzETH.webp"},
  {"name": "Re7LRT", "symbol": "https://verified-assets.fuel.network/images/Re7LRT.png"},
  {"name": "steakLRT", "symbol": "https://verified-assets.fuel.network/images/steakLRT.png"},
  {"name": "USDF", "symbol": "https://verified-assets.fuel.network/images/USDF.png"}
].map(async (brand) => {
      const symbol = await getOrUploadMedia(
        payload,
        req,
        brand.symbol,
        `${brand.name.replace(/ /g, "-").toLowerCase()}-symbol`,
        `${brand.name} Symbol`,
      );

      await payload.create({
        collection: "brands",
        data: {
          name: brand.name,
          description: brand.description || '',
          symbol: symbol?.id || null,
          domain: brand.domain || null,
          links: brand.links || [],
        },
      });
      payload.logger.info(`✅ Inserted brand: ${brand.name}`);
    }),
  );
}
