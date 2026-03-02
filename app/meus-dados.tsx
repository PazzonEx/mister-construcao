import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useRouter } from 'expo-router';

export default function MeusDados() {
  const [cpf, setCpf] = useState('');
  const [buscar, setBuscar] = useState('');
  const router = useRouter();

  const assinante = useQuery(api.assinantes.buscarPorCpf, buscar ? { cpf: buscar } : 'skip');
  const trabalhos = useQuery(api.trabalhos.trabalhosPorCliente, buscar ? { cpf: buscar } : 'skip') || [];
  const indicacoes = useQuery(api.assinantes.indicacoesPorCpf, buscar ? { cpf: buscar } : 'skip') || [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Text style={styles.back}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>👤 Meus Dados</Text>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="Digite seu CPF"
          value={cpf}
          keyboardType="numeric"
          onChangeText={setCpf}
        />
        <TouchableOpacity style={styles.btn} onPress={() => setBuscar(cpf)}>
          <Text style={styles.btnText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {buscar && assinante === undefined && <ActivityIndicator color="#f4a261" style={{ marginTop: 20 }} />}
      {buscar && assinante === null && (
        <Text style={styles.notFound}>CPF não encontrado. Verifique ou realize sua assinatura.</Text>
      )}

      {assinante && (
        <>
          {/* Dados cadastrais */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>DADOS CADASTRAIS</Text>
            {[
              ['Nome', assinante.nome],
              ['CPF', assinante.cpf],
              ['E-mail', assinante.email],
              ['Telefone', assinante.telefone],
              ['Endereço', assinante.endereco],
              ['Plano', `${assinante.plano} – R$ ${assinante.valor}/mês`],
            ].map(([l, v]) => (
              <View key={l}>
                <Text style={styles.label}>{l}</Text>
                <Text style={styles.value}>{v}</Text>
              </View>
            ))}
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, { color: assinante.ativo ? 'green' : 'red' }]}>
              {assinante.ativo ? '✅ Ativo' : '❌ Inativo'}
            </Text>
          </View>

          {/* Tokens */}
          <View style={[styles.card, styles.tokenCard]}>
            <Text style={styles.tokenTitulo}>🎁 Tokens de Reforma</Text>
            <Text style={styles.tokenValor}>R$ {(assinante.tokens || 0).toFixed(2)}</Text>
            <Text style={styles.tokenDesc}>Acumulados por indicações. Usados em serviços futuros.</Text>
          </View>

          {/* Indicações */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>🤝 MINHAS INDICAÇÕES</Text>
            {indicacoes.length === 0 ? (
              <Text style={styles.notFound}>Nenhuma indicação registrada ainda.</Text>
            ) : (
              indicacoes.map((ind, i) => (
                <View key={i} style={styles.pagItem}>
                  <Text style={styles.pagData}>CPF indicado: {ind.cpfIndicado}</Text>
                  <Text style={styles.pagValor}>+R$ {ind.tokensGanhos.toFixed(2)}</Text>
                </View>
              ))
            )}
            {assinante.cpfIndicador && (
              <Text style={{ color: '#888', fontSize: 12, marginTop: 10 }}>
                Você foi indicado por: {assinante.cpfIndicador}
              </Text>
            )}
          </View>

          {/* Trabalhos realizados */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>🔧 SERVIÇOS REALIZADOS</Text>
            {trabalhos.length === 0 ? (
              <Text style={styles.notFound}>Nenhum serviço registrado ainda.</Text>
            ) : (
              trabalhos.map((t, i) => (
                <View key={i} style={styles.pagItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pagData}>{new Date(t.data).toLocaleDateString('pt-BR')}</Text>
                    <Text style={{ color: '#555', fontSize: 13 }}>{t.descricao}</Text>
                  </View>
                  <Text style={styles.pagValor}>R$ {t.valor.toFixed(2)}</Text>
                </View>
              ))
            )}
          </View>

          {/* Histórico de pagamentos */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>💳 PAGAMENTOS ({assinante.pagamentos?.length || 0})</Text>
            {(assinante.pagamentos || []).map((p, i) => (
              <View key={i} style={styles.pagItem}>
                <Text style={styles.pagData}>{new Date(p.data).toLocaleDateString('pt-BR')}</Text>
                <Text style={styles.pagValor}>R$ {p.valor.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#1a1a2e', padding: 20 },
  back: { color: '#f4a261', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  searchBox: { flexDirection: 'row', gap: 10, margin: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, backgroundColor: '#fff', fontSize: 15 },
  btn: { backgroundColor: '#f4a261', paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, margin: 14, marginTop: 0, elevation: 2 },
  tokenCard: { backgroundColor: '#1a1a2e', alignItems: 'center' },
  tokenTitulo: { color: '#f4a261', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  tokenValor: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  tokenDesc: { color: '#888', fontSize: 12, marginTop: 4, textAlign: 'center' },
  sectionLabel: { fontSize: 11, color: '#f4a261', fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 },
  label: { fontSize: 12, color: '#888', marginTop: 10 },
  value: { fontSize: 15, color: '#1a1a2e', fontWeight: '600' },
  pagItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  pagData: { color: '#555', fontSize: 13 },
  pagValor: { color: '#1a1a2e', fontWeight: 'bold' },
  notFound: { textAlign: 'center', color: '#888', marginTop: 10, fontSize: 14 },
});