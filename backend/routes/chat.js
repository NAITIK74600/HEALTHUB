'use strict';
/**
 * chat.js — MedBot AI chatbot endpoint (powered by Gemini)
 * POST /api/chat  { message: string, history: [{role, text}] }
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Stricter rate limit for chat to prevent Gemini quota abuse
const chatLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: 'Too many messages. Please wait a moment before sending more.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const SYSTEM_PROMPT = `You are MedBot, a helpful and friendly pharmacy assistant for Batla Medicos — a trusted medical store located in Batla House, New Delhi (Jamia Nagar area, 110025).

You help customers with:
- Information about medicines, their common uses, general dosage guidance, and side effects
- Finding products and checking if something might be available at the store
- General health and wellness tips
- Information about lab tests and home sample collection services
- Guidance on when to seek a doctor's advice
- Order-related queries and store information

Always:
- Be warm, helpful, and concise (2–4 sentences unless more detail is genuinely needed)
- Recommend consulting a qualified doctor or pharmacist for specific prescriptions, serious symptoms, or treatment decisions
- Never prescribe medicines or give specific dosage for a patient's condition
- Respond in the same language the user writes in (Hindi or English — mix is fine)
- When unsure, say so honestly and suggest they call the store or visit in person

Store details:
- Name: Batla Medicos
- Location: Batla House, New Delhi – 110025
- Services: Medicines, OTC products, lab tests, home delivery
- Website: batlamedicos.shop`;

const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
];

router.post('/', chatLimit, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    const trimmed = message.trim().slice(0, 500);

    const { getGeminiKey } = require('../utils/gemini');
    const geminiKey = getGeminiKey();
    if (!geminiKey) {
      return res.status(503).json({
        message: 'AI chat is not configured yet. Please add GEMINI_API_KEY to the backend .env file. Get a free key at aistudio.google.com',
      });
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(geminiKey);

    // Sanitize and limit history to last 10 turns
    const safeHistory = Array.isArray(history)
      ? history.slice(-10).map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: String(h.text || '').slice(0, 500) }],
        }))
      : [];

    let lastError;
    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
        });

        const chat = model.startChat({ history: safeHistory });
        const result = await chat.sendMessage(trimmed);
        const reply = result.response.text();

        return res.json({ reply });
      } catch (err) {
        lastError = err;
        const msg = err.message || '';
        if (/quota|429|503|not.?found|RESOURCE_EXHAUSTED/i.test(msg)) continue;
        break;
      }
    }

    throw lastError || new Error('All Gemini models failed');
  } catch (err) {
    console.error('[chat] error:', err.message);
    res.status(500).json({ message: 'Chat is temporarily unavailable. Please try again shortly.' });
  }
});

module.exports = router;
