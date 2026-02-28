import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

export default function MeusDados() {
  const [cpf, setCpf] = useState('');
  const [buscar, setBuscar] = useState('');

  const assinante = useQuery(
    api.assinantes.buscarPorCpf,
    buscar ? { cpf: buscar } : 'skip'
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 Meus Dados</Text>
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

      {buscar && assinante === undefined && <ActivityIndicator color="#f4a261" />}

      {assinante === null && (
        <Text style={styles.notFound}>CPF não encontrado. Verifique e tente novamente.</Text>
      )}

      {assinante && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>DADOS CADASTRAIS</Text>
          <Text style={styles.label}>Nome</Text>
          <Text style={styles.value}>{assinante.nome}</Text>
          <Text style={styles.label}>CPF</Text>
          <Text style={styles.value}>{assinante.cpf}</Text>
          <Text style={styles.label}>Endereço</Text>
          <Text style={styles.value}>{assinante.endereco}</Text>
          <Text style={styles.label}>Plano</Text>
          <Text style={styles.value}>{assinante.plano} – R$ {assinante.valor}/mês</Text>
          <Text style={styles.label}>Status</Text>
          <Text style={[styles.value, { color: assinante.ativo ? 'green' : 'red' }]}>
            {assinante.ativo ? '✅ Ativo' : '❌ Inativo'}
          </Text>

          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>HISTÓRICO DE PAGAMENTOS</Text>
          <Text style={styles.pagCount}>Total de pagamentos: {assinante.pagamentos?.length || 0}</Text>
          {(assinante.pagamentos || []).map((p: any, i: number) => (
            <View key={i} style={styles.pagItem}>
              <Text style={styles.pagData}>{new Date(p.data).toLocaleDateString('pt-BR')}</Text>
              <Text style={styles.pagValor}>R$ {p.valor.toFixed(2)}</Text>
            </View>
          ))}
          {(!assinante.pagamentos || assinante.pagamentos.length === 0) && (
            <Text style={styles.notFound}>Nenhum pagamento registrado ainda.</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 24, textAlign: 'center' },
  searchBox: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, backgroundColor: '#fff', fontSize: 15 },
  btn: { backgroundColor: '#f4a261', paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 2 },
  sectionLabel: { fontSize: 12, color: '#f4a261', fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
  label: { fontSize: 12, color: '#888', marginTop: 12 },
  value: { fontSize: 16, color: '#1a1a2e', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 16 },
  pagCount: { color: '#333', marginBottom: 10, fontSize: 14 },
  pagItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  pagData: { color: '#555' },
  pagValor: { color: '#1a1a2e', fontWeight: 'bold' },
  notFound: { textAlign: 'center', color: '#888', marginTop: 20 },
});