import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  assinantes: defineTable({
    nome: v.string(),
    cpf: v.string(),
    email: v.optional(v.string()),        // opcional para compatibilidade
    telefone: v.optional(v.string()),      // opcional para compatibilidade
    endereco: v.string(),
    cpfIndicador: v.optional(v.string()),
    plano: v.string(),
    valor: v.number(),
    ativo: v.boolean(),
    tokens: v.optional(v.number()),        // opcional para compatibilidade
    pagamentos: v.array(v.object({
      data: v.number(),
      valor: v.number(),
      metodo: v.string(),
    })),
  }).index('by_cpf', ['cpf']),

  acionamentos: defineTable({
    cpf: v.string(),
    telefone: v.string(),
    descricao: v.optional(v.string()),
    status: v.string(),
    data: v.number(),
  }).index('by_cpf', ['cpf']),

  colaboradores: defineTable({
    nome: v.string(),
    profissao: v.string(),
    descricao: v.string(),
    foto: v.string(),
    estrelas: v.number(),
    totalAvaliacoes: v.number(),
    totalTrabalhos: v.number(),
    historico: v.array(v.object({
      descricao: v.string(),
      data: v.number(),
      avaliacao: v.optional(v.number()),
    })),
  }),

  trabalhos: defineTable({
    colaboradorId: v.id('colaboradores'),
    cpfCliente: v.string(),
    descricao: v.string(),
    valor: v.number(),
    data: v.number(),
    tokenGerado: v.number(),
    cpfIndicador: v.optional(v.string()),
  }).index('by_cliente', ['cpfCliente']),

  indicacoes: defineTable({
    cpfIndicador: v.string(),
    cpfIndicado: v.string(),
    data: v.number(),
    tokensGanhos: v.number(),
  }).index('by_indicador', ['cpfIndicador']),
});