import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// ── Gera número sequencial da OS ──────────────────────────
async function gerarNumeroOS(ctx: any): Promise<string> {
  const todas = await ctx.db.query('ordensServico').collect();
  const num = String(todas.length + 1).padStart(3, '0');
  const ano = new Date().getFullYear();
  return `OS-${ano}-${num}`;
}

// ── CRIAR OS ──────────────────────────────────────────────
export const criar = mutation({
  args: {
    titulo:          v.string(),
    descricao:       v.string(),
    cpfCliente:      v.string(),
    colaboradores:   v.array(v.object({
      colaboradorId: v.id('colaboradores'),
      nome:          v.string(),
      profissao:     v.string(),
    })),
    dataAgendada:    v.optional(v.number()),
    valorEstimado:   v.optional(v.number()),
    observacoes:     v.optional(v.string()),
    acionamentoId:   v.optional(v.id('acionamentos')),
  },
  handler: async (ctx, args) => {
    // Busca dados do cliente
    const cliente = await ctx.db
      .query('assinantes')
      .withIndex('by_cpf', q => q.eq('cpf', args.cpfCliente))
      .first();
    if (!cliente) throw new Error('Cliente não encontrado');

    const numero = await gerarNumeroOS(ctx);

    const osId = await ctx.db.insert('ordensServico', {
      numero,
      titulo:          args.titulo,
      descricao:       args.descricao,
      cpfCliente:      args.cpfCliente,
      nomeCliente:     cliente.nome,
      telefoneCliente: cliente.telefone,
      enderecoCliente: cliente.endereco,
      colaboradores:   args.colaboradores,
      status:          args.dataAgendada ? 'agendado' : 'em_andamento',
      dataCriacao:     Date.now(),
      dataAgendada:    args.dataAgendada,
      dataInicio:      args.dataAgendada ? undefined : Date.now(),
      valorEstimado:   args.valorEstimado,
      observacoes:     args.observacoes,
      cpfIndicador:    cliente.cpfIndicador,
      acionamentoId:   args.acionamentoId,
    });

    // Se veio de acionamento, marca como convertido
    if (args.acionamentoId) {
      await ctx.db.patch(args.acionamentoId, {
        status: 'convertido',
        ordemServicoId: osId,
      });
    }

    return osId;
  },
});

// ── INICIAR OS (agendado → em_andamento) ─────────────────
export const iniciar = mutation({
  args: { id: v.id('ordensServico') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status:     'em_andamento',
      dataInicio: Date.now(),
    });
  },
});

// ── FINALIZAR OS ──────────────────────────────────────────
export const finalizar = mutation({
  args: {
    id:          v.id('ordensServico'),
    valorFinal:  v.number(),
    observacoes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const os = await ctx.db.get(args.id);
    if (!os) throw new Error('OS não encontrada');

    const token = Math.round(args.valorFinal * 0.10 * 100) / 100;

    // Atualiza a OS
    await ctx.db.patch(args.id, {
      status:          'finalizado',
      dataFinalizacao: Date.now(),
      valorFinal:      args.valorFinal,
      tokenGerado:     token,
      observacoes:     args.observacoes ?? os.observacoes,
    });

    // Registra trabalho para cada colaborador
    for (const col of os.colaboradores) {
      await ctx.db.insert('trabalhos', {
        colaboradorId: col.colaboradorId,
        cpfCliente:    os.cpfCliente,
        descricao:     os.titulo,
        valor:         args.valorFinal,
        data:          Date.now(),
        tokenGerado:   token,
        cpfIndicador:  os.cpfIndicador,
        osId:          args.id,
      });

      // Atualiza totalTrabalhos do colaborador
      const c = await ctx.db.get(col.colaboradorId);
      if (c) {
        await ctx.db.patch(col.colaboradorId, {
          totalTrabalhos: c.totalTrabalhos + 1,
          historico: [...c.historico, {
            descricao:  os.titulo,
            data:       Date.now(),
            osId:       args.id,
          }],
        });
      }
    }

    // Tokens para o indicador (se houver)
    if (os.cpfIndicador) {
      const indicador = await ctx.db
        .query('assinantes')
        .withIndex('by_cpf', q => q.eq('cpf', os.cpfIndicador!))
        .first();
      if (indicador) {
        await ctx.db.patch(indicador._id, {
          tokens: (indicador.tokens || 0) + token,
        });
        await ctx.db.insert('indicacoes', {
          cpfIndicador:  os.cpfIndicador!,
          cpfIndicado:   os.cpfCliente,
          data:          Date.now(),
          tokensGanhos:  token,
          osId:          args.id,
        });
      }
    }
  },
});

// ── CANCELAR OS ───────────────────────────────────────────
export const cancelar = mutation({
  args: {
    id:     v.id('ordensServico'),
    motivo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status:             'cancelado',
      dataCancelamento:   Date.now(),
      motivoCancelamento: args.motivo,
    });
  },
});

// ── EDITAR OS ─────────────────────────────────────────────
export const editar = mutation({
  args: {
    id:           v.id('ordensServico'),
    titulo:       v.optional(v.string()),
    descricao:    v.optional(v.string()),
    dataAgendada: v.optional(v.number()),
    valorEstimado: v.optional(v.number()),
    observacoes:  v.optional(v.string()),
    colaboradores: v.optional(v.array(v.object({
      colaboradorId: v.id('colaboradores'),
      nome:          v.string(),
      profissao:     v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    const clean = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, clean);
  },
});

// ── QUERIES ───────────────────────────────────────────────

export const listarPorStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('ordensServico')
      .withIndex('by_status', q => q.eq('status', args.status))
      .order('desc')
      .collect();
  },
});

export const listarTodas = query({
  args: {},
  handler: async (ctx) =>
    ctx.db.query('ordensServico').order('desc').collect(),
});

export const buscarPorCliente = query({
  args: { cpf: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('ordensServico')
      .withIndex('by_cliente', q => q.eq('cpfCliente', args.cpf))
      .order('desc')
      .collect();
  },
});

export const buscarPorId = query({
  args: { id: v.id('ordensServico') },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

// Pública: OS de um colaborador SEM dados do cliente
export const buscarPorColaborador = query({
  args: { colaboradorId: v.id('colaboradores') },
  handler: async (ctx, args) => {
    const todas = await ctx.db.query('ordensServico').collect();
    return todas
      .filter(os =>
        os.colaboradores.some(c => c.colaboradorId === args.colaboradorId)
      )
      .map(os => ({
        _id:          os._id,
        numero:       os.numero,
        titulo:       os.titulo,
        status:       os.status,
        dataCriacao:  os.dataCriacao,
        dataAgendada: os.dataAgendada,
        dataInicio:   os.dataInicio,
        dataFinalizacao: os.dataFinalizacao,
        // ← sem cpfCliente, nomeCliente, telefone, endereço
      }));
  },
});