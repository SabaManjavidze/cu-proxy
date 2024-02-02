import express from "express";
import { main } from "./mainFunc";

const app = express();
const port = 3000;

app.get("/cron", async (req, res) => {
  await main();
  console.log("-----------------------------------------------------\n");
  res.sendStatus(200);
});
app.post("/command", (req, res) => {
  console.log(req.body);
  res.send("hello");
});
app.get("/", (req, res) => {
  console.log("test was successful");
  res.send("hello");
});

app.listen(process.env.PORT || port, () =>
  console.log(`Listening on port ${port}`)
);
