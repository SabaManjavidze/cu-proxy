import express from "express";
import { main } from "./mainFunc";

const app = express();
const port = 3000;

app.get("/cron", async (req, res) => {
  await main();
  res.sendStatus(200);
});
app.get("/", (req, res) => {
  console.log("bitch");
  console.log("please");
  res.sendStatus(200);
});

app.listen(process.env.PORT || port, () =>
  console.log(`Listening on port ${port}`)
);
