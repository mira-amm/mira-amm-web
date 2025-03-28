import {lexicalEditor} from "@payloadcms/richtext-lexical";
import {Users} from "@/db/collections";

export const adminConfig = {
  autoLogin:
    process.env.NEXT_PUBLIC_ENABLE_AUTOLOGIN === "true"
      ? {
          email: "test@mira.ly",
          password: "test",
          prefillOnly: true,
        }
      : false,
  components: {
    // resolves to apps/admin/src/components, no idea why. Tried to fix it.
    // https://payload-visual-guide.vercel.app/
    meta: {
      description:
        "Admin Dashboard & Content Management System for the Mira Platform",
      icons: [
        {
          type: "image/ico",
          rel: "icon",
          url: "https://mira.ly/images/favicon.png",
        },
      ],
      titleSuffix: "- Mira",
    },
    // routes: {
    // },
    beforeLogin: ["/components/BeforeLogin#BeforeLogin"],
    afterLogin: ["/components/AfterLogin#AfterLogin"],
    graphics: {
      Icon: "/components/icon#Icon",
      Logo: "/components/logo#Logo",
    },
    Nav: "/components/Nav#Nav",
    views: {
      dashboard: {
        Component: "/components/Dashboard#Dashboard",
      },
    },
    avatar: {
      Component: "/components/Avatar#Avatar",
    },
  },
  importMap: {
    baseDir: "src", // resolves from location of payload.config.ts
  },
  user: Users.slug,
};

export const clientConfig = {
  editor: lexicalEditor({}),
  theme: "dark", // CREDITS: github.com/akhrarovsaid/payload-theme-quantum-leap
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
      schedulePublish: true,
    },
    maxPerDoc: 20,
  },
};
