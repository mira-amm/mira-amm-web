import {ConfigService} from "@nestjs/config";
import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module.js";
import {SwaggerModule, DocumentBuilder} from "@nestjs/swagger";
import {apiReference} from "@scalar/nestjs-api-reference";
import { express as voyagerMiddleware } from 'graphql-voyager/middleware'

const app = await NestFactory.create(AppModule);

const config = new DocumentBuilder()
  .setTitle("🦕 Microchain API Reference")
  .setDescription([
    "🧩 OpenAPI Spec for the Microchain Platform.",
    "",
    "- ✨ [Scalar UI:](/docs/scalar) `/docs/scalar`",
    "",
    "- 📚 [Compodoc UI:](/compodoc) `/compodoc`",
    "",
    "- 📗 [Swagger UI:](/docs/swagger) `/docs/swagger`",
    "",
    "- 🕸 [GraphQL Voyager:](/docs/voyager) `/docs/voyager`",
    "",
    "- 🛝 [GraphQL Playground - Apollo Server:](/graphql) `/graphql`",
  ].join('\n'))
  .setVersion("1.0?")
  .setTermsOfService("https://docs.mira.ly/resources/terms-and-conditions")
  .build();

const documentFactory = () => SwaggerModule.createDocument(app, config);

SwaggerModule.setup("/docs/swagger", app, documentFactory, {
  jsonDocumentUrl: "/openapi.json",
  customSiteTitle: "🦕 Microchain API Reference",
  customfavIcon: "https://mira.ly/images/favicon.png",
  explorer: true,
});

const configService = app.get(ConfigService);
const port = configService.get("PORT") ?? (process.env.API_SERVER_PORT || 8080);

app.use('/docs/voyager', voyagerMiddleware({endpointUrl: '/graphql'}))

app.getHttpAdapter().get("/voyager", (_req, res) => {
  res.redirect("/docs/voyager");
});

app.use(
  "/docs/scalar",
  apiReference({
    theme:
      // "alternate",
      // "default",
      // "moon",
      // "purple",
      // "solarized",
      // "bluePlanet",
      // "deepSpace",
      // "saturn",
      // "kepler",
      // "elysiajs",
      // "fastify",
      "mars",
    // "laserwave",
    // "none",
    url: "/openapi.json",
    favicon: "https://mira.ly/images/favicon.png",
  }),
);

app.getHttpAdapter().get("/", (_req, res) => {
  res.redirect("/docs/scalar");
});


app.getHttpAdapter().get("/docs", (_req, res) => {
  res.redirect("/compodoc");
});

app.getHttpAdapter().get("/docs/compodoc", (_req, res) => {
  res.redirect("/compodoc");
});

await app.listen(port);
