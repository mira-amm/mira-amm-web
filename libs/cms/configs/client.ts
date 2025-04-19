import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { Users } from "@/db/collections";

export const adminConfig = {
   autoLogin:
    process.env.NEXT_PUBLIC_ENABLE_AUTOLOGIN === 'true'
      ? {
          email: 'test@mira.ly',
          password: 'test',
          prefillOnly: true,
        }
      : false,
    components: { // resolves to apps/microgame/src/components, no idea why. Tried to fix it.
      // https://payload-visual-guide.vercel.app/
    meta: {
      description: "Admin Dashboard & Content Management System for Microchain",
      icons: [
        {
          type: "image/ico",
          rel: "icon",
          url: "/assets/favicon.ico",
        },
      ],
      titleSuffix: "- Microchain",
    },
    routes: {
      // createFirstUser: '/create-account',
    },
      // beforeDashboard: ["/components/before-dashboard#BeforeDashboard"],
      // afterDashboard: ["/components/after-dashboard#AfterDashboard"],
      beforeLogin: ['/components/BeforeLogin#BeforeLogin'],
      afterLogin: ["/components/AfterLogin#AfterLogin"],
      graphics: {
        Icon: "/components/icon#Icon",
        Logo: "/components/logo#Logo",
      },
      Nav: '/components/Nav#Nav',
      // https://dev.to/aaronksaunders/payload-cms-add-a-custom-create-account-screen-in-admin-ui-2pdg
      // https://www.youtube.com/watch?v=X-6af837WbY
      views: {
      //   'login': {
      //     Component: '/components/oauth#OAuth',
      //     path: '/login',
      //   },
      //   'create-account': {
      //     Component: '/components/oauth#OAuth',
      //     path: '/create-account',
      //   },
        dashboard: {
          Component: '/components/Dashboard#Dashboard',
        },
      },
    avatar: {
      Component: '/components/Avatar#Avatar',
    },
  },
    importMap: {
      // baseDir: path.resolve("../../../../src"),
      baseDir: "src", // resolves from location of payload.config.ts
    },
    user: Users.slug,
}

export const clientConfig = {
  editor: lexicalEditor({}),
  theme: 'dark', // CREDITS: github.com/akhrarovsaid/payload-theme-quantum-leap
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
      schedulePublish: true,
    },
    maxPerDoc: 20,
  },
}
