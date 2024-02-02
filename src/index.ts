import express from "express";
import { main } from "./mainFunc";
import { CommandRequestBody } from "./utils/telegram/teleTypes";
import { sendMessage } from "./telegram/sendMessage";
import { getGPA } from "./gpa";

const app = express();
const port = 3000;
app.use(express.json());

app.get("/cron", async (req, res) => {
  await main();
  console.log("-----------------------------------------------------\n");
  res.sendStatus(200);
});
app.post("/command", async (req, res) => {
  const {
    message: {
      text,
      from: { first_name, last_name },
    },
  } = req.body as CommandRequestBody;
  if (text == "/hello") {
    await sendMessage({ text: `გამარჯობა ${first_name} ${last_name}` });
  }
  if (text == "/gpa") {
    const { cprecent, gpa } = await getGPA();
    await sendMessage({
      text: `Your GPA is: <b>${gpa}</b> and your yearly precentage is: <b>${cprecent}</b>`,
    });
  }
  res.send("hello");
});
app.get("/", (req, res) => {
  console.log("test was successful");
  res.send("hello");
});

app.listen(process.env.PORT || port, () =>
  console.log(`Listening on port ${port}`)
);
