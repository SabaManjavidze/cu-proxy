import express from "express";
import { main } from "./src";

const app = express();
const port = 3000;

app.use("/cron", main);

app.listen(process.env.PORT || port, () =>
  console.log(`Listening on port ${port}`)
);
