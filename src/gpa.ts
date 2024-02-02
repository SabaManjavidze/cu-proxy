import { eq } from "drizzle-orm";
import puppeteer from "puppeteer";
import { signIn, db } from "./mainFunc";
import { sendMessage } from "./telegram/sendMessage";

export async function getGPA() {
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
  await page.waitForTimeout(500);
  console.log("Went into personal profile page.");

  // GPA
  await page.click("#myform > table > tbody > tr > td > p:nth-child(4) > a");
  console.log("Went into GPA page.");
  await page.waitForTimeout(1000);
  const cprecentSel =
    "body > table > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr > td > table > tbody > tr:nth-child(18) > td:nth-child(2) > input";
  const cprecent = await page.$eval(cprecentSel, (el) => el.value);
  const gpaSel =
    "body > table > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr > td > table > tbody > tr:nth-child(18) > td:nth-child(3) > input";
  const gpa = await page.$eval(gpaSel, (el) => el.value);
  console.log("Scraped GPA and Yearly Precentage.");

  await page.close();
  await browser.close();
  return { cprecent, gpa };
}
