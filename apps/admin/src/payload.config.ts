import { buildConfig } from "payload";
import { dbConfig, serverConfig} from '@/db/server.config'
import { clientConfig, adminConfig } from '@/db/ui.config'

export default buildConfig({
  ...serverConfig,
  ...clientConfig,
  ...adminConfig,
  ...dbConfig
})
