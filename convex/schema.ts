import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  assinantes: defineTable({
    nome: v.string(),
    cpf: v.string(),
    endereco: v.string(),
    plano: v.string(),
    valor: v.number(),
    ativo: v.boolean(),
    pagamentos: v.array(v.object({
      data: v.number(),    // timestamp
      valor: v.number(),
      metodo: v.string(),
    })),
  }).index('by_cpf', ['cpf']),
});