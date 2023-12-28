import puppeteer from "puppeteer";
import type { Page } from "puppeteer";
import * as schema from "./db/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import { CONNECTION_STRING } from "./constants";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import axios from "axios";
import { config } from "dotenv";
import type Express from "express";

config();
const pirn = "01005034686";
const baseUrl = "https://programs.cu.edu.ge/cu";

export const subjectsMap = {
  "DM 1140": 0,
  "PCP 1140": 1,
  "ICS 1140": 2,
  "ACWR 0007": 3,
  "MATH 0003": 4,
  "OS 1240": 5,
  "CARC 1240": 6,
} as const;
export const client = postgres(CONNECTION_STRING, { max: 1 });
export const db = drizzle(client, { schema });
async function signIn(page: Page) {
  await page.goto(`${baseUrl}/loginStud`, { waitUntil: "domcontentloaded" });
  await page.type("#pirn", pirn, { delay: 100 });
  await page.type("input[name='password']", pirn, { delay: 100 });
  await page.click("button[value='Login']", { delay: 100 });
}
type Grade = {
  grade: string;
  maxGrade: string;
  activity: string;
  date: string;
};
const colorMap = {
  red: "rgb(255, 0, 0)",
  green: "rgb(189, 255, 206)",
};
async function getLastGrade(pg: Page) {
  return await pg.evaluate(async (colorMap) => {
    let body = document.querySelector("body > table > tbody");
    if (!body?.children)
      return new Error("something went wrong during getting tbody");
    const keys = ["date", "activity", "maxGrade", "grade"] as const;
    let grade: Grade = { grade: "0", date: "", activity: "", maxGrade: "0" };
    const len = body.children.length - 6;
    for (let i = 2; i < len; i++) {
      const item = body.children[i];
      const obj: Grade = { date: "", activity: "", maxGrade: "", grade: "" };
      for (let j = 0; j < item.children.length; j++) {
        obj[keys[j]] = item.children[j].innerHTML;
        if (i < len - 1 && j == item.children.length - 1) {
          const bg = getComputedStyle(
            body.children[i + 1].children[j]
          ).getPropertyValue("background-color");
          if (bg !== colorMap.red && bg !== colorMap.green) return obj;
        }
      }
    }
    return grade;
  }, colorMap);
}
async function extractGrades(pg: Page) {
  return await pg.evaluate(async () => {
    if (typeof document == "undefined") return;
    let body = document.querySelector("body > table > tbody");
    if (!body?.children)
      return new Error("something went wrong during getting tbody");
    const arr: Grade[] = [];
    console.log({ body });
    const keys = ["date", "activity", "maxGrade", "grade"] as const;
    for (let i = 2; i < body.children.length - 6; i++) {
      const item = body.children[i];
      const obj: Grade = { date: "", activity: "", maxGrade: "", grade: "" };
      for (let j = 0; j < item.children.length; j++) {
        obj[keys[j]] = item.children[j].innerHTML;
      }
      arr.push(obj);
    }
    return arr;
  });
}
export async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--disable-dev-shm-usage",
      "--start-maximized",
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    defaultViewport: null,
    executablePath:
      process.env.NODE_ENV == "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
  const page = await browser.newPage();
  const userAgent =
    "Mozilla/5.0 (X11; Linux x86_64)" +
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36";
  await page.setUserAgent(userAgent);
  console.log("shemevida 1");
  await signIn(page);
  console.log("shemevida 2");

  // piradi profili
  //
  await page.waitForTimeout(1000);
  console.log("shemevida 3");
  await page.click(
    "body > table > tbody > tr:nth-child(2) > td:nth-child(1) > div > a:nth-child(1)"
  );

  await page.waitForTimeout(1000);
  // GPA
  await page.click(
    "#myform > table > tbody > tr > td > p:nth-child(4) > a",
    {}
  );
  await page.waitForTimeout(1000);

  const keys = Object.keys(subjectsMap) as [keyof typeof subjectsMap];
  for (let j = 0; j < keys.length; j++) {
    const course = (await page.$eval(
      `body > table > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr > td > table > tbody > tr:nth-child(${
        j + 2
      }) > td:nth-child(2) > form > input.submit_masala`,
      (el) => el.value
    )) as keyof typeof subjectsMap;
    await page.click(
      `body > table > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr > td > table > tbody > tr:nth-child(${
        j + 2
      }) > td:nth-child(2) > form > input.submit_masala`
    );
    await page.waitForTimeout(1000);
    const lastGrade = (await getLastGrade(page)) as Grade;
    const dbGrade = await db.query.grades.findFirst({
      where: eq(schema.grades.id, course),
    });
    console.log({ lastGrade, dbGrade });

    if (
      lastGrade.date !== dbGrade?.date ||
      lastGrade.activity !== dbGrade?.activity
    ) {
      if (dbGrade) {
        await axios.post(
          `https://api.telegram.org/bot${process.env.TELEGRAM_API_TOKEN}/sendMessage`,
          {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: `You got <b>${lastGrade.grade}/${lastGrade.maxGrade}</b> doing ${lastGrade.activity} in <b>${course}</b>`,
            parse_mode: "HTML",
          }
        );
      }
      await db.insert(schema.grades).values({ ...lastGrade, id: course });
    }
    await page.goBack();
    await page.waitForTimeout(1000);
  }
  await page.close();
}
