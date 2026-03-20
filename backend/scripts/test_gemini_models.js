'use strict';
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI('AIzaSyCaJRzjttFgXV1ccr9R-4jSEKUCeQwvv9o');

const models = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
  'gemini-1.0-pro',
];

(async () => {
  for (const m of models) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const r = await model.generateContent(
        'Return only valid JSON: {"salt":"Paracetamol 500mg","description":"Relieves pain and fever."}'
      );
      console.log('OK   :', m, '->', r.response.text().trim().slice(0, 60));
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
        console.log('QUOTA:', m);
      } else if (msg.includes('404') || msg.includes('not found') || msg.includes('Not Found')) {
        console.log('GONE :', m);
      } else {
        console.log('ERR  :', m, '->', msg.slice(0, 100));
      }
    }
  }
})();
