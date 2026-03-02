import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

function Estrelas({ valor, grande }: { valor: number; grande?: boolean }) {
  const s = grande ? 28 : 16;
  return (
    <Text style={{ color: '#f4a261', fontSize: s }}>
      {'★'.repeat(Math.round(valor))}{'☆'.repeat(5 - Math.round(valor))}
      <Text style={{ fontSize: grande ? 16 : 13, color: '#aaa' }}> {valor.toFixed(1)}</Text>
    </Text>
  );
}

export default function Colaborador() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const colaborador = useQuery(
    api.colaboradores.buscarColaborador,
    id ? { id: id as any } : 'skip'
  );
  const trabalhos = useQuery(
    api.trabalhos.trabalhosPorColaborador,
    id ? { colaboradorId: id as any } : 'skip'
  ) || [];

  if (!colaborador) return (
    <View style={styles.loading}>
      <Text style={styles.loadingText}>Carregando...</Text>
    </View>
  );

  const totalFaturado = trabalhos.reduce((s, t) => s + t.valor, 0);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Text style={styles.back}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Colaborador</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Perfil */}
      <View style={styles.perfilBox}>
        {colaborador.foto
          ? <Image source={{ uri: colaborador.foto }} style={styles.foto} />
          : <View style={styles.fotoPlaceholder}><Text style={{ fontSize: 52 }}>👷</Text></View>
        }
        <Text style={styles.nome}>{colaborador.nome}</Text>
        <Text style={styles.profissao}>{colaborador.profissao}</Text>
        <Estrelas valor={colaborador.estrelas} grande />
        <Text style={styles.avaliacoes}>{colaborador.totalAvaliacoes} avaliações</Text>
      </View>

      {/* Resumo */}
      <View style={styles.resumoRow}>
        <View style={styles.resumoItem}>
          <Text style={styles.resumoNum}>{colaborador.totalTrabalhos}</Text>
          <Text style={styles.resumoLabel}>Trabalhos{'\n'}Realizados</Text>
        </View>
        <View style={styles.resumoItem}>
          <Text style={styles.resumoNum}>{colaborador.estrelas.toFixed(1)}</Text>
          <Text style={styles.resumoLabel}>Média de{'\n'}Estrelas</Text>
        </View>
        <View style={styles.resumoItem}>
          <Text style={styles.resumoNum}>{colaborador.totalAvaliacoes}</Text>
          <Text style={styles.resumoLabel}>Clientes{'\n'}Avaliaram</Text>
        </View>
      </View>

      {/* Sobre */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>📝 Sobre</Text>
        <Text style={styles.descricao}>{colaborador.descricao}</Text>
      </View>

      {/* Histórico de trabalhos */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>🔧 Histórico de Trabalhos ({trabalhos.length})</Text>
        {trabalhos.length === 0
          ? <Text style={styles.vazio}>Nenhum trabalho registrado ainda.</Text>
          : trabalhos.map((t, i) => (
            <View key={i} style={styles.trabalhoItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.trabalhoDesc}>{t.descricao}</Text>
                <Text style={styles.trabalhoData}>{new Date(t.data).toLocaleDateString('pt-BR')}</Text>
              </View>
              <Text style={styles.trabalhoValor}>R$ {t.valor.toFixed(2)}</Text>
            </View>
          ))
        }
        {trabalhos.length > 0 && (
          <Text style={styles.total}>
            Total faturado: <Text style={{ fontWeight: 'bold', color: '#f4a261' }}>R$ {totalFaturado.toFixed(2)}</Text>
          </Text>
        )}
      </View>

      {/* Avaliações dos clientes */}
      {colaborador.historico.filter(h => h.avaliacao).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>⭐ Avaliações dos Clientes</Text>
          {colaborador.historico
            .filter(h => h.avaliacao)
            .slice(-10)
            .reverse()
            .map((h, i) => (
              <View key={i} style={styles.avaliacaoItem}>
                <View style={styles.avaliacaoHeader}>
                  <Text style={{ color: '#f4a261' }}>{'★'.repeat(h.avaliacao || 0)}</Text>
                  <Text style={styles.avaliacaoData}>{new Date(h.data).toLocaleDateString('pt-BR')}</Text>
                </View>
                <Text style={styles.avaliacaoDesc}>{h.descricao}</Text>
              </View>
            ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f0f0f0' },
  loading:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:     { color: '#888' },
  header:          { backgroundColor: '#1a1a2e', padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back:            { color: '#f4a261', fontSize: 14 },
  headerTitulo:    { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  perfilBox:       { backgroundColor: '#fff', alignItems: 'center', padding: 28 },
  foto:            { width: 110, height: 110, borderRadius: 55, marginBottom: 12 },
  fotoPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  nome:            { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e' },
  profissao:       { color: '#888', fontSize: 15, marginBottom: 8 },
  avaliacoes:      { color: '#aaa', fontSize: 13, marginTop: 4 },
  resumoRow:       { flexDirection: 'row', margin: 14, gap: 10 },
  resumoItem:      { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14, alignItems: 'center' },
  resumoNum:       { fontSize: 26, fontWeight: 'bold', color: '#f4a261' },
  resumoLabel:     { color: '#888', fontSize: 11, textAlign: 'center', marginTop: 4 },
  card:            { backgroundColor: '#fff', borderRadius: 12, margin: 14, marginTop: 0, padding: 18 },
  cardTitulo:      { fontSize: 15, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12 },
  descricao:       { color: '#555', fontSize: 14, lineHeight: 22 },
  trabalhoItem:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  trabalhoDesc:    { color: '#444', fontSize: 14 },
  trabalhoData:    { color: '#aaa', fontSize: 12, marginTop: 2 },
  trabalhoValor:   { color: '#1a1a2e', fontWeight: 'bold' },
  total:           { color: '#555', fontSize: 13, textAlign: 'right', marginTop: 10 },
  avaliacaoItem:   { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  avaliacaoHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  avaliacaoData:   { color: '#aaa', fontSize: 12 },
  avaliacaoDesc:   { color: '#555', fontSize: 13 },
  vazio:           { color: '#aaa', textAlign: 'center', padding: 16 },
});