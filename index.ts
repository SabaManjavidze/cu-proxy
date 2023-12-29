import express from "express";
import { main } from "./src";
import { schedule } from "node-cron";

const app = express();
const port = 3000;

app.get("/cron", async (req, res) => {
  await main();
  res.sendStatus(200);
});
app.get("/", (req, res) => res.sendStatus(200));

// schedule("0 12-23/3 * * *", main);
// schedule("*/3 * * * *", main);
// schedule("* * * * *", () => console.log("hello"));
app.listen(process.env.PORT || port, () =>
  console.log(`Listening on port ${port}`)
);
