// async function seed() {
// 	const arr = Object.keys(subjectsMap) as [keyof typeof subjectsMap];
// 	for (let i = 0; i < arr.length; i++) {
// 		await db
// 			.insert(schema.grades)
// 			.values({
// 				id: arr[i],
// 				grade: "4",
// 				date: new Date()
// 					.toLocaleDateString("en-US", {
// 						year: "numeric",
// 						month: "2-digit",
// 						day: "2-digit",
// 					})
// 					.toString(),
// 				maxGrade: "5",
// 				activity: "homework",
// 			})
// 			.onConflictDoNothing({ target: schema.grades.id });
// 	}
// }
//

import axios from "axios";
import { config } from "dotenv";
config();
// seed();
async function test() {
	await axios.post(
		`https://api.telegram.org/bot${process.env.TELEGRAM_API_TOKEN}/sendMessage`,
		{
			chat_id: process.env.TELEGRAM_CHAT_ID,
			text: `You got <b>4/5</b> in homework assignment of <b>Discrete maths</b>`,
			parse_mode: "HTML",
		},
	);
}
test();
