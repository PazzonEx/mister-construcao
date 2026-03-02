import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({

  // ── ASSINANTES ─────────────────────────────────────────
  assinantes: defineTable({
    nome:         v.string(),
    cpf:          v.string(),
    email:        v.optional(v.string()),
    telefone:     v.optional(v.string()),
    endereco:     v.string(),
    cpfIndicador: v.optional(v.string()),
    senha:        v.optional(v.string()),
    foto:         v.optional(v.string()),
    plano:        v.string(),
    valor:        v.number(),
    ativo:        v.boolean(),
    tokens:       v.optional(v.number()),
    pagamentos: v.array(v.object({
      data:   v.number(),
      valor:  v.number(),
      metodo: v.string(),
    })),
  }).index('by_cpf', ['cpf']),

  // ── ACIONAMENTOS ───────────────────────────────────────
  acionamentos: defineTable({
    cpf:            v.string(),
    telefone:       v.string(),
    descricao:      v.optional(v.string()),
    cadastrado: v.optional(v.boolean()),  // se o CPF é assinante
    status:         v.string(),    // 'pendente' | 'visto' | 'convertido'
    data:           v.number(),
    ordemServicoId: v.optional(v.id('ordensServico')),
  }).index('by_cpf', ['cpf']),

  // ── ORDENS DE SERVIÇO ──────────────────────────────────
  ordensServico: defineTable({
    // Identificação
    numero:         v.string(),   // ex: "OS-2025-001"
    titulo:         v.string(),   // resumo do serviço
    descricao:      v.string(),   // detalhe completo

    // Cliente
    cpfCliente:     v.string(),
    nomeCliente:    v.string(),
    telefoneCliente: v.optional(v.string()),
    enderecoCliente: v.optional(v.string()),

    // Colaboradores (pode ter mais de um)
    colaboradores:  v.array(v.object({
      colaboradorId: v.id('colaboradores'),
      nome:          v.string(),
      profissao:     v.string(),
    })),

    // Status e datas
    // 'agendado' | 'em_andamento' | 'finalizado' | 'cancelado'
    status:          v.string(),
    dataCriacao:     v.number(),
    dataAgendada:    v.optional(v.number()),   // quando está agendado
    dataInicio:      v.optional(v.number()),   // quando virou em_andamento
    dataFinalizacao: v.optional(v.number()),   // quando finalizou
    dataCancelamento: v.optional(v.number()),

    // Financeiro
    valorEstimado:  v.optional(v.number()),
    valorFinal:     v.optional(v.number()),
    tokenGerado:    v.optional(v.number()),    // 10% para indicador

    // Indicador
    cpfIndicador:   v.optional(v.string()),

    // Origem
    acionamentoId:  v.optional(v.id('acionamentos')),

    // Observações internas (admin)
    observacoes:    v.optional(v.string()),

    // Motivo cancelamento
    motivoCancelamento: v.optional(v.string()),
  })
    .index('by_cliente', ['cpfCliente'])
    .index('by_status', ['status']),

  // ── COLABORADORES ──────────────────────────────────────
  colaboradores: defineTable({
    nome:            v.string(),
    profissao:       v.string(),
    descricao:       v.string(),
    foto:            v.string(),
    estrelas:        v.number(),
    totalAvaliacoes: v.number(),
    totalTrabalhos:  v.number(),
    historico: v.array(v.object({
      descricao:    v.string(),
      data:         v.number(),
      avaliacao:    v.optional(v.number()),
      cpfCliente:   v.optional(v.string()),
      osId:         v.optional(v.string()),
    })),
  }),

  // ── TRABALHOS (legado / pagamentos de OS) ──────────────
  trabalhos: defineTable({
    colaboradorId:  v.id('colaboradores'),
    cpfCliente:     v.string(),
    descricao:      v.string(),
    valor:          v.number(),
    data:           v.number(),
    tokenGerado:    v.number(),
    cpfIndicador:   v.optional(v.string()),
    osId:           v.optional(v.id('ordensServico')),
  })
    .index('by_cliente', ['cpfCliente'])
    .index('by_colaborador', ['colaboradorId']),

  // ── INDICAÇÕES ─────────────────────────────────────────
  indicacoes: defineTable({
    cpfIndicador:  v.string(),
    cpfIndicado:   v.string(),
    data:          v.number(),
    tokensGanhos:  v.number(),
    osId:          v.optional(v.id('ordensServico')),
  }).index('by_indicador', ['cpfIndicador']),

});