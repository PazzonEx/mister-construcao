import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Cria acionamento e já verifica se CPF é assinante
export const criarAcionamento = mutation({
  args: {
    cpf:       v.string(),
    telefone:  v.string(),
    descricao: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const assinante = await ctx.db
      .query('assinantes')
      .withIndex('by_cpf', q => q.eq('cpf', args.cpf))
      .first();

    return await ctx.db.insert('acionamentos', {
      cpf:        args.cpf,
      telefone:   args.telefone,
      descricao:  args.descricao,
      cadastrado: !!assinante,   // true se é assinante
      status:     'pendente',
      data:       Date.now(),
    });
  },
});

export const listarAcionamentos = query({
  args: {},
  handler: async (ctx) =>
    ctx.db.query('acionamentos').order('desc').collect(),
});

export const atualizarStatus = mutation({
  args: { id: v.id('acionamentos'), status: v.string() },
  handler: async (ctx, args) =>
    ctx.db.patch(args.id, { status: args.status }),
});