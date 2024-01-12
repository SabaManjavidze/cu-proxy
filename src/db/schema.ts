import { pgTable, varchar } from "drizzle-orm/pg-core";
import { subjectsMap } from "../mainFunc";

type idType = keyof typeof subjectsMap;
export const grades = pgTable("grades", {
  id: varchar("id").$type<idType>().primaryKey(),
  grade: varchar("grade"),
  date: varchar("date"),
  maxGrade: varchar("maxGrade"),
  activity: varchar("activity"),
});
