import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkGeminiModel, generateGeminiJson, readGeminiConfig } from './gemini';

const config = { apiKey: 'k', model: 'gemini-x' };
const respond = (status: number, body: unknown) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('gemini', () => {
  it('lee la configuración del entorno (o null si falta)', () => {
    expect(
      readGeminiConfig({ VITE_GEMINI_API_KEY: 'k', VITE_GEMINI_MODEL: 'models/gemini-x' }),
    ).toEqual(config);
    expect(readGeminiConfig({ VITE_GEMINI_API_KEY: 'k' })).toBeNull();
  });

  it('bloquea un modelo no registrado o sin generateContent', async () => {
    respond(404, { error: {} });
    await expect(checkGeminiModel(config)).rejects.toThrow('no está registrado');
    respond(200, { name: 'models/gemini-x', supportedGenerationMethods: ['embedContent'] });
    await expect(checkGeminiModel(config)).rejects.toMatchObject({ code: 'config' });
    respond(200, { name: 'models/gemini-x', supportedGenerationMethods: ['generateContent'] });
    await expect(checkGeminiModel(config)).resolves.toMatchObject({ name: 'models/gemini-x' });
  });

  it('devuelve el JSON generado', async () => {
    respond(200, { candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }] });
    await expect(generateGeminiJson(config, 'hola', {})).resolves.toEqual({ ok: true });
    respond(429, {});
    await expect(generateGeminiJson(config, 'hola', {})).rejects.toMatchObject({
      code: 'rate_limited',
    });
  });
});
