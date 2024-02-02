import express from "express";
import { main } from "./mainFunc";

const app = express();
const port = 3000;

app.get("/cron", async (req, res) => {
  await main();
  console.log("-----------------------------------------------------\n");
  res.sendStatus(200);
});
app.get("/", (req, res) => {
  res.send("hello");
});

app.listen(process.env.PORT || port, () =>
  console.log(`Listening on port ${port}`)
);
