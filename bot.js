const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_API_KEY);

const Telegram = bot.telegram;

const chatId = process.env.CHAT_ID;

const sendMessage = (message) => Telegram.sendMessage(chatId, message);

module.exports = { sendMessage };

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
