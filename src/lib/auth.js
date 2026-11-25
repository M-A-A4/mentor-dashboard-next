
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { db } from "./db";

export const auth = betterAuth({
  appName: "Mentor Dashboard",
  baseURL: process.env.BETTER_AUTH_URL,

  database: db,

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
  ],
});
