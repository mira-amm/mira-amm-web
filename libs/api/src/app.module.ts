import {Module} from "@nestjs/common";
import {ConfigModule} from "@nestjs/config";
import {GraphQLModule} from "@nestjs/graphql";
import {ApolloDriver, type ApolloDriverConfig} from "@nestjs/apollo";
import {ReadAmmService} from "./features/read-amm/services/read-amm.service.js";
import {ReadAmmModule} from "./features/read-amm/read-amm.module.js";
import {ReadAmmResolver} from "./features/read-amm/resolvers/read-amm.resolver.js";
import {TaskModule} from "./features/task/task.module.js";
import {ApolloServerPluginLandingPageLocalDefault} from "@apollo/server/plugin/landingPage/default";
import {ServeStaticModule} from "@nestjs/serve-static";

import {join} from "node:path";
import {dirname} from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: false,
      // graphiql: true,
      autoSchemaFile: true,
      sortSchema: true,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "documentation"),
      renderPath: "/compodoc",
    }),
    ReadAmmModule,
    TaskModule,
  ],
  controllers: [],
  providers: [ReadAmmService, ReadAmmResolver],
  exports: [],
})
export class AppModule {}
