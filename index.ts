import express from "express";
import { main } from "./src";
import { schedule } from "node-cron";

const app = express();
const port = 3000;

app.post("/cron", (req, res) => {
  main();
  res.send(200);
});
app.get("/", (req, res) => res.sendStatus(200));

// schedule("0 12-23/3 * * *", main);
// schedule("*/3 * * * *", main);
// schedule("* * * * *", () => console.log("hello"));
app.listen(process.env.PORT || port, () =>
  console.log(`Listening on port ${port}`)
);
