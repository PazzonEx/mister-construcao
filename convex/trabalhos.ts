import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// ============================================================
// convex/trabalhos.ts (admin registra trabalho realizado)
// ============================================================
export const registrarTrabalho = mutation({
  args: {
    colaboradorId: v.id('colaboradores'),
    cpfCliente: v.string(),
    descricao: v.string(),
    valor: v.number(),
  },
  handler: async (ctx, args) => {
    const token = Math.round(args.valor * 0.10 * 100) / 100;
    const cliente = await ctx.db.query('assinantes')
      .withIndex('by_cpf', q => q.eq('cpf', args.cpfCliente)).first();

    let cpfIndicador: string | undefined;
    if (cliente?.cpfIndicador) {
      cpfIndicador = cliente.cpfIndicador;
      // Adiciona tokens ao indicador
      const indicador = await ctx.db.query('assinantes')
        .withIndex('by_cpf', q => q.eq('cpf', cpfIndicador!)).first();
      if (indicador) {
        await ctx.db.patch(indicador._id, { tokens: (indicador.tokens || 0) + token });
        await ctx.db.insert('indicacoes', {
          cpfIndicador: cpfIndicador!, cpfIndicado: args.cpfCliente,
          data: Date.now(), tokensGanhos: token,
        });
      }
    }

    // Atualiza colaborador
    const col = await ctx.db.get(args.colaboradorId);
    if (col) {
      await ctx.db.patch(args.colaboradorId, {
        totalTrabalhos: col.totalTrabalhos + 1,
        historico: [...col.historico, { descricao: args.descricao, data: Date.now() }],
      });
    }

    return await ctx.db.insert('trabalhos', {
      ...args, data: Date.now(), tokenGerado: token, cpfIndicador,
    });
  },
});

export const trabalhosPorCliente = query({
  args: { cpf: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query('trabalhos')
      .withIndex('by_cliente', q => q.eq('cpfCliente', args.cpf)).collect();
  },
});