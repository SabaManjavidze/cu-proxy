import axios from "axios";

export const sendMessage = async ({
  text,
  chat_id = process.env.TELEGRAM_CHAT_ID,
  parse_mode = "HTML",
}: {
  chat_id?: string;
  text: string;
  parse_mode?: string;
}) => {
  await axios.post(
    `https://api.telegram.org/bot${process.env.TELEGRAM_API_TOKEN}/sendMessage`,
    {
      chat_id,
      text,
      parse_mode,
    }
  );
};
