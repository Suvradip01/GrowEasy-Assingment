'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../../config');

// Singleton Gemini client — initialised once per process
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

/**
 * Returns a Gemini model instance wired for structured JSON output.
 * The responseSchema argument constrains the model to emit valid JSON
 * that matches the provided Gemini SchemaType definition.
 *
 * @param {object} responseSchema - A Gemini SchemaType schema object
 * @returns {GenerativeModel}
 */
const getStructuredModel = (responseSchema) => {
  return genAI.getGenerativeModel({
    model: config.gemini.model,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
      thinkingConfig: { thinkingLevel: 'low' },
      temperature: 0.1,       // Low temperature → consistent, deterministic output
      topP: 0.8,
      maxOutputTokens: 65536, // Raised from 8192 to prevent "Unterminated string in JSON" on large batches
    },
  });
};

module.exports = { getStructuredModel };
