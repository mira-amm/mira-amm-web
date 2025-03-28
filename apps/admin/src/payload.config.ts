import {buildConfig} from "payload";
import {clientConfig, adminConfig, baseConfig} from "@/cms/configs";

export default buildConfig({
  ...baseConfig,
  ...clientConfig,
  admin: {
    ...adminConfig,
  },
});
