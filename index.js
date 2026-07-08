import 'dotenv/config';
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import OpenAI from 'openai';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 3000;

if (!TELEGRAM_BOT_TOKEN) throw new Error('Missing TELEGRAM_BOT_TOKEN');
if (!OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const app = express();
app.get('/', (req, res) => res.send('LeoMarkets AI is running'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const SYSTEM_PROMPT = `
Eres LeoMarkets AI, asistente personal de trading para Leonardo.
Especialidad: MGC1 / Micro Gold Futures.
Objetivo: reportes rápidos para scalping intradía.

Reglas:
- No inventes datos en vivo.
- Si no tienes precio actual, dilo claramente.
- Entrega análisis útil, breve y accionable.
- Prioriza: tendencia, Bandas de Bollinger, liquidez, VWAP, ATR, estructura, entrada, invalidación.
- Siempre puede ser BUY, SELL o NO TRADE.
- Si falta confirmación, responde NO TRADE.
- No des garantía de ganancia.
- Formato claro para Telegram.

Formato:
LEOMARKETS AI — MGC1
Sesgo:
Estado:
Bollinger:
Liquidez:
Zona clave:
Confirmación:
Operación:
SL:
TP1:
TP2:
Confianza:
Nota:
`;

async function generateReport(userMessage) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.3,
    max_tokens: 700
  });
  return response.choices[0]?.message?.content || 'No pude generar el reporte.';
}

bot.onText(/\/start/, async (msg) => {
  await bot.sendMessage(msg.chat.id, 'LeoMarkets AI activo. Escríbeme: MGC1 ahora');
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';
  if (text.startsWith('/start')) return;

  try {
    await bot.sendMessage(chatId, 'Analizando MGC1...');
    const report = await generateReport(text);
    await bot.sendMessage(chatId, report);
  } catch (error) {
    console.error(error);
    await bot.sendMessage(chatId, 'Error generando el reporte. Revisa las variables del servidor.');
  }
});
