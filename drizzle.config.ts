import { CONNECTION_STRING } from "./src/constants";

export default {
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dbCredentials: {
		connectionString: CONNECTION_STRING,
	},
	driver: "pg",
};
