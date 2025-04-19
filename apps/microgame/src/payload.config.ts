import { buildConfig } from "payload";
import { clientConfig, adminConfig, serverConfig } from '@/cms/configs'
import { dataBaseConfig } from '@/db/config'

export default buildConfig({
  ...serverConfig,
  ...clientConfig,
  admin: {
    ...adminConfig,
  },
...dataBaseConfig
})
