import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Criar novo assinante
export const criar = mutation({
  args: {
    nome: v.string(),
    cpf: v.string(),
    endereco: v.string(),
    plano: v.string(),
    valor: v.number(),
  },
  handler: async (ctx, args) => {
    // Verifica se CPF já existe
    const existe = await ctx.db
      .query('assinantes')
      .withIndex('by_cpf', q => q.eq('cpf', args.cpf))
      .first();
    if (existe) throw new Error('CPF já cadastrado');

    return await ctx.db.insert('assinantes', {
      ...args,
      ativo: true,
      pagamentos: [{
        data: Date.now(),
        valor: args.valor,
        metodo: 'cartao',
      }],
    });
  },
});

// Buscar por CPF
export const buscarPorCpf = query({
  args: { cpf: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('assinantes')
      .withIndex('by_cpf', q => q.eq('cpf', args.cpf))
      .first();
  },
});

// Adicionar pagamento
export const adicionarPagamento = mutation({
  args: {
    cpf: v.string(),
    valor: v.number(),
    metodo: v.string(),
  },
  handler: async (ctx, args) => {
    const assinante = await ctx.db
      .query('assinantes')
      .withIndex('by_cpf', q => q.eq('cpf', args.cpf))
      .first();
    if (!assinante) throw new Error('Assinante não encontrado');

    const pagamentos = [
      ...(assinante.pagamentos || []),
      { data: Date.now(), valor: args.valor, metodo: args.metodo },
    ];
    await ctx.db.patch(assinante._id, { pagamentos });
  },
});