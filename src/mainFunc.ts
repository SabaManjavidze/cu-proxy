import puppeteer from "puppeteer";
import type { Page } from "puppeteer";
import * as schema from "./db/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import { CONNECTION_STRING } from "./constants";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import axios from "axios";
import { config } from "dotenv";
import { sendMessage } from "./telegram/sendMessage";

config();
const pirn = "01005034686";

const baseUrl = "https://programs.cu.edu.ge/cu";

export const client = postgres(CONNECTION_STRING, { max: 1 });
export const db = drizzle(client, { schema });
export async function signIn(page: Page) {
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
    if (!body?.children) return;
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
        } else if (i == len - 1 && j == item.children.length - 1) {
          const bg = getComputedStyle(
            body.children[i].children[j]
          ).getPropertyValue("background-color");
          if (bg == colorMap.red || bg == colorMap.green) return obj;
        }
      }
    }
    return grade as Grade;
  }, colorMap);
}
export async function main() {
  const browser = await puppeteer.launch({
    headless: true,
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

  console.log("Opened up a browser instance.");
  await signIn(page);
  console.log("Signed into your CU page.");

  // piradi profili
  //
  await page.waitForSelector(
    "body > table > tbody > tr:nth-child(2) > td:nth-child(1) > div > a:nth-child(1)"
  );
  await page.click(
    "body > table > tbody > tr:nth-child(2) > td:nth-child(1) > div > a:nth-child(1)"
  );
  console.log("Went into personal profile page.");
  await page.waitForTimeout(500);

  // GPA
  await page.click("#myform > table > tbody > tr > td > p:nth-child(4) > a");
  console.log("Went into GPA page.");
  await page.waitForTimeout(1000);

  // const keys = Object.keys(subjectsMap) as [keyof typeof subjectsMap];
  const subjectBodySel =
    "body > table > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr > td > table > tbody";
  const subjectLen = await page.$eval(
    subjectBodySel,
    (el) => el.children.length - 5
  );
  for (let j = 0; j < subjectLen; j++) {
    const courseIdSel =
      `body > table > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr > td > table > tbody > tr:nth-child(${
        j + 2
      }) > td:nth-child(2) > form > input.submit_masala` as const;
    const gradeSel =
      `body > table > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr > td > table > tbody > tr:nth-child(${
        j + 2
      }) > td:nth-child(10)` as const;

    const grade = await page.$eval(gradeSel, (el) => el.innerHTML);
    const course = await page.$eval(courseIdSel, (el) => el.value);
    // if coures is not graded than just add it to the db
    if (grade == "") {
      await db.insert(schema.grades).values({
        activity: "",
        grade: "0",
        date: "",
        id: course,
        maxGrade: "0",
      });
      continue;
    }
    console.log("Checked for newly added subjects");
    await page.click(courseIdSel);
    console.log(`Went into ${course} grades page.`);
    await page.waitForTimeout(500);
    const lastGrade = await getLastGrade(page);
    if (!lastGrade) return;
    const dbGrade = await db.query.grades.findFirst({
      where: eq(schema.grades.id, course),
    });
    console.log({ lastGrade, dbGrade });

    if (
      lastGrade.date !== dbGrade?.date ||
      lastGrade.activity !== dbGrade?.activity
    ) {
      // if (dbGrade) {
      await sendMessage({
        chat_id: process.env.TELEGRAM_CHAT_ID as string,
        text: `You got <b>${lastGrade.grade}/${lastGrade.maxGrade}</b> doing ${lastGrade.activity} in <b>${course}</b>`,
        parse_mode: "HTML",
      });
      await db
        .update(schema.grades)
        .set({ ...lastGrade })
        .where(eq(schema.grades.id, course));
      // } else {
      //   await db.insert(schema.grades).values({ ...lastGrade, id: course });
      // }
    }
    await page.goBack();
    await page.waitForTimeout(1000);
  }
  await page.close();
  await browser.close();
}
