import express from "express";
import { main } from "./src";
import { schedule } from "node-cron";

const app = express();
const port = 3000;

app.post("/cron", (req, res) => {
  main();
  res.send(200);
});
app.get("/", (req, res) => res.send("hello"));

// schedule("0 6-23/6 * * *", main);
schedule("* * * * *", main);
app.listen(process.env.PORT || port, () =>
  console.log(`Listening on port ${port}`)
);
