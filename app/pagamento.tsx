import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

export default function Pagamento() {
  const { nome, cpf, endereco } = useLocalSearchParams<any>();
  const router = useRouter();
  const criarAssinante = useMutation(api.assinantes.criar);
  const [loading, setLoading] = useState(false);
  const [pago, setPago] = useState(false);

  const handlePagar = async () => {
    setLoading(true);
    try {
      // Simula 2 segundos de processamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      await criarAssinante({
        nome: String(nome),
        cpf: String(cpf),
        endereco: String(endereco),
        plano: 'mensal',
        valor: 89.90,
      });

      setPago(true);
    } catch (e: any) {
      const msg = e.message?.includes('já cadastrado')
        ? 'Este CPF já possui uma assinatura ativa.'
        : 'Erro ao processar. Tente novamente.';
      Alert.alert('Atenção', msg);
    } finally {
      setLoading(false);
    }
  };

  // Tela de sucesso
  if (pago) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Pagamento Confirmado!</Text>
        <Text style={styles.successDesc}>
          Bem-vindo à Mister Construções, {nome}!{'\n'}
          Sua assinatura mensal está ativa.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/meus-dados')}>
          <Text style={styles.btnText}>Ver Meus Dados</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnOutline} onPress={() => router.push('/')}>
          <Text style={styles.btnOutlineText}>Voltar ao Início</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💳 Confirmar Pagamento</Text>

      {/* Resumo do pedido */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>RESUMO DA ASSINATURA</Text>
        <Text style={styles.label}>Nome</Text>
        <Text style={styles.value}>{nome}</Text>
        <Text style={styles.label}>CPF</Text>
        <Text style={styles.value}>{cpf}</Text>
        <Text style={styles.label}>Endereço</Text>
        <Text style={styles.value}>{endereco}</Text>
        <View style={styles.divider} />
        <Text style={styles.label}>Plano</Text>
        <Text style={styles.value}>Mensal</Text>
        <Text style={styles.label}>Valor</Text>
        <Text style={styles.preco}>R$ 89,90/mês</Text>
      </View>

      {/* Simulação de cartão */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>💳 SIMULAÇÃO DE PAGAMENTO</Text>
        <View style={styles.cartaoFake}>
          <Text style={styles.cartaoNumero}>•••• •••• •••• 4242</Text>
          <Text style={styles.cartaoInfo}>SIMULAÇÃO – Visa</Text>
        </View>
        <Text style={styles.aviso}>⚠️ Ambiente de testes – nenhuma cobrança real será feita</Text>
      </View>

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handlePagar}
        disabled={loading}
      >
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.btnText}>  Processando...</Text>
          </View>
        ) : (
          <Text style={styles.btnText}>✅ Confirmar e Pagar R$ 89,90</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.seguro}>🔒 Pagamento 100% seguro e criptografado</Text>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.voltar}>← Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 24, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  sectionLabel: { fontSize: 11, color: '#f4a261', fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 },
  label: { fontSize: 12, color: '#888', marginTop: 10 },
  value: { fontSize: 15, color: '#1a1a2e', fontWeight: '600' },
  preco: { fontSize: 22, color: '#f4a261', fontWeight: 'bold', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
  cartaoFake: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 20, marginVertical: 10 },
  cartaoNumero: { color: '#fff', fontSize: 18, letterSpacing: 4, marginBottom: 8 },
  cartaoInfo: { color: '#aaa', fontSize: 13 },
  aviso: { color: '#f4a261', fontSize: 12, textAlign: 'center', marginTop: 8 },
  btn: { backgroundColor: '#f4a261', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  btnDisabled: { backgroundColor: '#ccc' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnOutline: { borderWidth: 1, borderColor: '#f4a261', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  btnOutlineText: { color: '#f4a261', fontWeight: 'bold', fontSize: 15 },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  seguro: { textAlign: 'center', color: '#888', fontSize: 13, marginBottom: 16 },
  voltar: { textAlign: 'center', color: '#888', fontSize: 14 },
  successContainer: { flex: 1, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center', padding: 32 },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 26, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12 },
  successDesc: { color: '#555', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
});