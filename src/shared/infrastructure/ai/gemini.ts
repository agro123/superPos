import { z } from 'zod';
import { AppError } from '@/shared/domain/errors';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

const aiEnvSchema = z.object({
  VITE_GEMINI_API_KEY: z.string().trim().default(''),
  VITE_GEMINI_MODEL: z.string().trim().default(''),
});

export interface GeminiConfig {
  apiKey: string;
  /** Nombre del modelo sin el prefijo `models/` (p. ej. `gemini-2.5-flash`). */
  model: string;
}

/**
 * Configuración de Gemini desde `.env.local`. La clave viaja en el bundle del navegador: debe
 * restringirse por dominio (HTTP referrer) en Google Cloud. Ver ADR 0013.
 */
export function readGeminiConfig(
  source: Record<string, unknown> = import.meta.env,
): GeminiConfig | null {
  const env = aiEnvSchema.parse(source);
  if (!env.VITE_GEMINI_API_KEY || !env.VITE_GEMINI_MODEL) return null;
  return { apiKey: env.VITE_GEMINI_API_KEY, model: env.VITE_GEMINI_MODEL.replace(/^models\//, '') };
}

const modelInfoSchema = z.object({
  name: z.string(),
  displayName: z.string().optional(),
  supportedGenerationMethods: z.array(z.string()).default([]),
});
export type GeminiModelInfo = z.infer<typeof modelInfoSchema>;

async function request(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (cause) {
    throw new AppError('network', 'No se pudo contactar a Gemini', { cause });
  }
}

/**
 * Verifica que el modelo exista y permita `generateContent`. Si no está registrado, la acción se
 * bloquea en la UI con este error.
 */
export async function checkGeminiModel(config: GeminiConfig): Promise<GeminiModelInfo> {
  const response = await request(
    `${BASE_URL}/models/${encodeURIComponent(config.model)}?key=${encodeURIComponent(config.apiKey)}`,
  );
  if (response.status === 404 || response.status === 400) {
    throw new AppError('config', `El modelo "${config.model}" no está registrado en Gemini.`);
  }
  if (response.status === 401 || response.status === 403) {
    throw new AppError(
      'config',
      'La clave de Gemini no es válida o no tiene acceso a este dominio.',
    );
  }
  if (!response.ok) throw new AppError('network', `Gemini respondió ${String(response.status)}`);
  const info = modelInfoSchema.parse(await response.json());
  if (!info.supportedGenerationMethods.includes('generateContent')) {
    throw new AppError('config', `El modelo "${config.model}" no permite generar contenido.`);
  }
  return info;
}

const generateResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({ parts: z.array(z.object({ text: z.string().optional() })) }),
      }),
    )
    .min(1),
});

/** Genera una respuesta JSON (`responseSchema` en formato OpenAPI de Gemini) y la devuelve parseada. */
export async function generateGeminiJson(
  config: GeminiConfig,
  prompt: string,
  responseSchema: Record<string, unknown>,
): Promise<unknown> {
  const response = await request(
    `${BASE_URL}/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.4,
        },
      }),
    },
  );
  if (response.status === 429)
    throw new AppError('rate_limited', 'Gemini alcanzó su límite de uso.');
  if (response.status === 404)
    throw new AppError('config', `El modelo "${config.model}" no está registrado en Gemini.`);
  if (!response.ok) throw new AppError('network', `Gemini respondió ${String(response.status)}`);
  const parsed = generateResponseSchema.safeParse(await response.json());
  const text = parsed.success
    ? parsed.data.candidates[0]?.content.parts.map((p) => p.text ?? '').join('')
    : '';
  try {
    return JSON.parse(text ?? '') as unknown;
  } catch (cause) {
    throw new AppError('validation', 'Gemini devolvió una respuesta que no es JSON.', { cause });
  }
}
