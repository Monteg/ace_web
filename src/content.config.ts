import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * The catalogue is a typed table, not 24 hand-written pages.
 *
 * Every field that went wrong on the old site is constrained here, so the
 * same mistake cannot be made twice: RTP is a number in a plausible band and
 * gets formatted once at render time, volatility comes from a fixed list, the
 * demo is structured data rather than a pasted URL, and the labels in the spec
 * table live in the template where an editor cannot swap them with the values.
 */
const games = defineCollection({
  loader: glob({ base: './src/content/games', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      name: z.string().min(2),
      type: z.enum(['slot', 'instant', 'table']),
      status: z.enum(['live', 'coming_soon']).default('live'),
      order: z.number().default(100),

      seo: z.object({
        title: z.string().max(70),
        description: z.string().min(60).max(165),
      }),

      card: image(),
      cardLayers: z
        .object({
          background: image(),
          logo: image(),
        })
        .optional(),
      hero: image(),
      gallery: z
        .array(
          z.object({
            image: image(),
            alt: z.string().min(1),
          }),
        )
        .default([]),

      specs: z.object({
        // 0.94, never "0.94" and never a stray "Medium/High"
        rtp: z.union([z.number().min(0.8).max(0.995), z.literal('configurable')]),
        maxWin: z
          .object({
            value: z.number().positive(),
            unit: z.enum(['x', 'coins']),
            approx: z.boolean().default(false),
          })
          .optional(),
        volatility: z.array(z.enum(['low', 'medium', 'high', 'very_high'])).min(1),
        bet: z.object({ min: z.number().positive(), max: z.number().positive() }).optional(),
        mainFeature: z.string().optional(),
        layout: z.string().optional(),
      }),

      // absent means no embed is rendered at all, so `src=""` is unrepresentable
      demo: z
        .discriminatedUnion('mode', [
          z.object({ mode: z.literal('adapter'), gameId: z.string().uuid() }),
          z.object({
            mode: z.literal('direct'),
            build: z.string(),
            version: z.number().int(),
            apiHost: z.string().url().optional(),
          }),
        ])
        .optional(),

      features: z.array(z.object({ title: z.string(), body: z.string() })).default([]),
    }),
});

const legal = defineCollection({
  loader: glob({ base: './src/content/legal', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    updated: z.string(),
  }),
});

export const collections = { games, legal };
