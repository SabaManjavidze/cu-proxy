import { pgTable, varchar } from "drizzle-orm/pg-core";

export const grades = pgTable("grades", {
  id: varchar("id").primaryKey(),
  grade: varchar("grade"),
  date: varchar("date"),
  maxGrade: varchar("maxGrade"),
  activity: varchar("activity"),
});
