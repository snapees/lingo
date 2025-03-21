import "dotenv/config";
import type {Config} from "drizzle-kit";

export default {
    dialect: "postgresql",
    schema: "./db/schema.ts",
    out: "./drizzle",
    // driver: "pg",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
} satisfies Config;


