import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// ── REGISTRAR TRABALHO (admin) ────────────────────────────
// Ao registrar: atualiza colaborador, gera tokens para indicador
export const registrarTrabalho = mutation({
  args: {
    colaboradorId: v.id('colaboradores'),
    cpfCliente:    v.string(),
    descricao:     v.string(),
    valor:         v.number(),
  },
  handler: async (ctx, args) => {
    const token = Math.round(args.valor * 0.10 * 100) / 100;

    // Busca cliente
    const cliente = await ctx.db
      .query('assinantes')
      .withIndex('by_cpf', q => q.eq('cpf', args.cpfCliente))
      .first();
    if (!cliente) throw new Error('Cliente não encontrado no banco');

    // Se tem indicador, adiciona tokens e registra indicação
    let cpfIndicador: string | undefined;
    if (cliente.cpfIndicador) {
      cpfIndicador = cliente.cpfIndicador;
      const indicador = await ctx.db
        .query('assinantes')
        .withIndex('by_cpf', q => q.eq('cpf', cpfIndicador!))
        .first();
      if (indicador) {
        await ctx.db.patch(indicador._id, {
          tokens: (indicador.tokens || 0) + token,
        });
        await ctx.db.insert('indicacoes', {
          cpfIndicador: cpfIndicador!,
          cpfIndicado:  args.cpfCliente,
          data:         Date.now(),
          tokensGanhos: token,
        });
      }
    }

    // Atualiza colaborador: totalTrabalhos + histórico
    const col = await ctx.db.get(args.colaboradorId);
    if (col) {
      await ctx.db.patch(args.colaboradorId, {
        totalTrabalhos: col.totalTrabalhos + 1,
        historico: [
          ...col.historico,
          {
            descricao:  args.descricao,
            data:       Date.now(),
            cpfCliente: args.cpfCliente,
          },
        ],
      });
    }

    // Salva o trabalho
    return await ctx.db.insert('trabalhos', {
      colaboradorId: args.colaboradorId,
      cpfCliente:    args.cpfCliente,
      descricao:     args.descricao,
      valor:         args.valor,
      data:          Date.now(),
      tokenGerado:   token,
      cpfIndicador,
    });
  },
});

// ── TRABALHOS POR CLIENTE ─────────────────────────────────
export const trabalhosPorCliente = query({
  args: { cpf: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('trabalhos')
      .withIndex('by_cliente', q => q.eq('cpfCliente', args.cpf))
      .order('desc')
      .collect();
  },
});

// ── TRABALHOS POR COLABORADOR ─────────────────────────────
export const trabalhosPorColaborador = query({
  args: { colaboradorId: v.id('colaboradores') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('trabalhos')
      .withIndex('by_colaborador', q => q.eq('colaboradorId', args.colaboradorId))
      .order('desc')
      .collect();
  },
});

// ── TODOS OS TRABALHOS (admin) ────────────────────────────
export const listarTodos = query({
  args: {},
  handler: async (ctx) => ctx.db.query('trabalhos').order('desc').collect(),
});