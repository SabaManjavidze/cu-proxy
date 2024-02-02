import axios from "axios";

export const sendMessage = async ({
  text,
  chat_id,
  parse_mode,
}: {
  chat_id: string;
  text: string;
  parse_mode: string;
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
