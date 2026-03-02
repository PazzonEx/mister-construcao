
// ============================================================
// convex/assinantes.ts
// ============================================================
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const criar = mutation({
  args: {
    nome: v.string(), cpf: v.string(), email: v.string(),
    telefone: v.string(), endereco: v.string(),
    cpfIndicador: v.optional(v.string()),
    plano: v.string(), valor: v.number(),
  },
  handler: async (ctx, args) => {
    const existe = await ctx.db.query('assinantes')
      .withIndex('by_cpf', q => q.eq('cpf', args.cpf)).first();
    if (existe) throw new Error('CPF já cadastrado');
    return await ctx.db.insert('assinantes', {
      ...args, ativo: true, tokens: 0,
      pagamentos: [{ data: Date.now(), valor: args.valor, metodo: 'simulado' }],
    });
  },
});

export const buscarPorCpf = query({
  args: { cpf: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query('assinantes')
      .withIndex('by_cpf', q => q.eq('cpf', args.cpf)).first();
  },
});

export const adicionarTokens = mutation({
  args: { cpf: v.string(), tokens: v.number() },
  handler: async (ctx, args) => {
    const a = await ctx.db.query('assinantes')
      .withIndex('by_cpf', q => q.eq('cpf', args.cpf)).first();
    if (!a) throw new Error('Assinante não encontrado');
    await ctx.db.patch(a._id, { tokens: (a.tokens || 0) + args.tokens });
  },
});

export const indicacoesPorCpf = query({
  args: { cpf: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query('indicacoes')
      .withIndex('by_indicador', q => q.eq('cpfIndicador', args.cpf)).collect();
  },
});