import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const criar = mutation({
  args: {
    nome:         v.string(),
    cpf:          v.string(),
    email:        v.optional(v.string()),
    telefone:     v.optional(v.string()),
    endereco:     v.string(),
    cpfIndicador: v.optional(v.string()),
    senha:        v.optional(v.string()),
    plano:        v.string(),
    valor:        v.number(),
  },
  handler: async (ctx, args) => {
    const existe = await ctx.db
      .query('assinantes')
      .withIndex('by_cpf', q => q.eq('cpf', args.cpf))
      .first();
    if (existe) throw new Error('CPF já cadastrado');

    // CPF indicador: salva mesmo se não encontrado no sistema ainda
    return await ctx.db.insert('assinantes', {
      nome:         args.nome,
      cpf:          args.cpf,
      email:        args.email,
      telefone:     args.telefone,
      endereco:     args.endereco,
      cpfIndicador: args.cpfIndicador || undefined,
      senha:        args.senha,
      foto:         undefined,
      plano:        args.plano,
      valor:        args.valor,
      ativo:        true,
      tokens:       0,
      pagamentos:   [{ data: Date.now(), valor: args.valor, metodo: 'simulado' }],
    });
  },
});

export const buscarPorCpf = query({
  args: { cpf: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('assinantes')
      .withIndex('by_cpf', q => q.eq('cpf', args.cpf))
      .first();
  },
});

export const login = query({
  args: { cpf: v.string(), senha: v.string() },
  handler: async (ctx, args) => {
    const a = await ctx.db
      .query('assinantes')
      .withIndex('by_cpf', q => q.eq('cpf', args.cpf))
      .first();
    if (!a) return null;
    if (a.senha && a.senha !== args.senha) return 'senha_errada';
    return a;
  },
});

export const editar = mutation({
  args: {
    cpf:       v.string(),
    senha:     v.string(),
    nome:      v.optional(v.string()),
    email:     v.optional(v.string()),
    telefone:  v.optional(v.string()),
    endereco:  v.optional(v.string()),
    novaSenha: v.optional(v.string()),
    foto:      v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const a = await ctx.db
      .query('assinantes')
      .withIndex('by_cpf', q => q.eq('cpf', args.cpf))
      .first();
    if (!a) throw new Error('Assinante não encontrado');
    if (a.senha && a.senha !== args.senha) throw new Error('Senha incorreta');
    const patch: any = {};
    if (args.nome)      patch.nome     = args.nome;
    if (args.email)     patch.email    = args.email;
    if (args.telefone)  patch.telefone = args.telefone;
    if (args.endereco)  patch.endereco = args.endereco;
    if (args.novaSenha) patch.senha    = args.novaSenha;
    if (args.foto)      patch.foto     = args.foto;
    await ctx.db.patch(a._id, patch);
    return true;
  },
});

export const definirSenha = mutation({
  args: { cpf: v.string(), senha: v.string() },
  handler: async (ctx, args) => {
    const a = await ctx.db
      .query('assinantes')
      .withIndex('by_cpf', q => q.eq('cpf', args.cpf))
      .first();
    if (!a) throw new Error('Assinante não encontrado');
    await ctx.db.patch(a._id, { senha: args.senha });
    return true;
  },
});

export const adicionarTokens = mutation({
  args: { cpf: v.string(), tokens: v.number() },
  handler: async (ctx, args) => {
    const a = await ctx.db
      .query('assinantes')
      .withIndex('by_cpf', q => q.eq('cpf', args.cpf))
      .first();
    if (!a) throw new Error('Assinante não encontrado');
    await ctx.db.patch(a._id, { tokens: (a.tokens || 0) + args.tokens });
  },
});

export const listarTodos = query({
  args: {},
  handler: async (ctx) => ctx.db.query('assinantes').collect(),
});

export const indicacoesPorCpf = query({
  args: { cpf: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('indicacoes')
      .withIndex('by_indicador', q => q.eq('cpfIndicador', args.cpf))
      .collect();
  },
});

export const gerarUploadUrlAssinante = mutation({
  args: {},
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
});

export const salvarFotoAssinante = mutation({
  args: { cpf: v.string(), storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    const a = await ctx.db
      .query('assinantes')
      .withIndex('by_cpf', q => q.eq('cpf', args.cpf))
      .first();
    if (!a) throw new Error('Assinante não encontrado');
    await ctx.db.patch(a._id, { foto: url ?? '' });
  },
});