
// ============================================================
// convex/acionamentos.ts
// ============================================================
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const criarAcionamento = mutation({
  args: { cpf: v.string(), telefone: v.string(), descricao: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return await ctx.db.insert('acionamentos', {
      ...args, status: 'pendente', data: Date.now(),
    });
  },
});

export const listarAcionamentos = query({
  args: {},
  handler: async (ctx) => ctx.db.query('acionamentos').order('desc').collect(),
});