import {VercelRequest, VercelResponse} from "@vercel/node";
import {Logger, ConsoleLogger} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module.js";
import {SwaggerModule, DocumentBuilder} from "@nestjs/swagger";
import {apiReference} from "@scalar/nestjs-api-reference";
import {express as voyagerMiddleware} from "graphql-voyager/middleware/index.js";

let cachedApp;

async function bootstrap() {
  try {
    if (!cachedApp) {
      const app = await NestFactory.create(AppModule, {
        logger: new ConsoleLogger({
          json: true,
          colors: true,
        }),
      });

      const config = new DocumentBuilder()
        .setTitle("🦕 Microchain API Reference")
        .setDescription(
          [
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
          ].join("\n")
        )
        .setVersion("1.0?")
        .setTermsOfService(
          "https://docs.mira.ly/resources/terms-and-conditions"
        )
        .build();

      const documentFactory = () => SwaggerModule.createDocument(app, config);

      SwaggerModule.setup("/docs/swagger", app, documentFactory, {
        jsonDocumentUrl: "/openapi.json",
        customSiteTitle: "🦕 Microchain API Reference",
        customfavIcon: "https://mira.ly/images/favicon.png",
        explorer: true,
      });

      app.use("/docs/voyager", voyagerMiddleware({endpointUrl: "/graphql"}));

      app
        .getHttpAdapter()
        .get("/voyager", (_req, res) => res.redirect("/docs/voyager"));

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
        })
      );

      app.setGlobalPrefix("api");

      app.getHttpAdapter().get("/api", (_req, res) => {
        res.redirect("/docs/scalar");
      });

      app.getHttpAdapter().get("/api/docs", (_req, res) => {
        res.redirect("/compodoc");
      });

      app.getHttpAdapter().get("/api/docs/compodoc", (_req, res) => {
        res.redirect("/compodoc");
      });

      Logger.log("🚀 Server running at: http://localhost:3000 🧩");

      app.enableCors();
      await app.init();
      cachedApp = app.getHttpAdapter().getInstance();
    }
    return cachedApp;
  } catch (error) {
    Logger.error("Failed to bootstrap application:", error);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("Incoming request URL:", req.url);
  const server = await bootstrap();
  server(req, res);
}
