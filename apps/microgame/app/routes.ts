import {type RouteConfig, index, route, layout} from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("./routes/index.tsx"),
    route("login", "./routes/login.tsx"),
    route("notes", "./routes/notes.tsx"),
    route("menu", "./routes/menu.tsx"),
    route("countdown", "./routes/countdown.tsx"),
    route("game", "./routes/game.tsx"),
    route("logout", "./routes/logout.tsx"),
  ]),
] satisfies RouteConfig;
