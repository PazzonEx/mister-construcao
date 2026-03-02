import { mutation, query } from './_generated/server';
import { v } from 'convex/values';


// ============================================================
// convex/colaboradores.ts
// ============================================================
export const criarColaborador = mutation({
  args: {
    nome: v.string(), profissao: v.string(),
    descricao: v.string(), foto: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('colaboradores', {
      ...args, estrelas: 5, totalAvaliacoes: 0, totalTrabalhos: 0, historico: [],
    });
  },
});

export const listarColaboradores = query({
  args: {},
  handler: async (ctx) => ctx.db.query('colaboradores').collect(),
});

export const buscarColaborador = query({
  args: { id: v.id('colaboradores') },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const avaliarColaborador = mutation({
  args: { id: v.id('colaboradores'), estrelas: v.number(), descricao: v.string() },
  handler: async (ctx, args) => {
    const c = await ctx.db.get(args.id);
    if (!c) throw new Error('Colaborador não encontrado');
    const totalAvaliacoes = c.totalAvaliacoes + 1;
    const novaMedia = ((c.estrelas * c.totalAvaliacoes) + args.estrelas) / totalAvaliacoes;
    await ctx.db.patch(args.id, {
      estrelas: Math.round(novaMedia * 10) / 10,
      totalAvaliacoes,
      historico: [...c.historico, { descricao: args.descricao, data: Date.now(), avaliacao: args.estrelas }],
    });
  },
});

// Gera URL temporária para fazer upload
export const gerarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Salva o storageId como URL permanente
export const salvarFoto = mutation({
  args: { colaboradorId: v.id('colaboradores'), storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    await ctx.db.patch(args.colaboradorId, { foto: url ?? '' });
  },
});
