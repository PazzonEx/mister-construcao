import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

export default function Pagamento() {
  const params = useLocalSearchParams<any>();
  const router = useRouter();
  const criarAssinante = useMutation(api.assinantes.criar);
  const [loading, setLoading] = useState(false);
  const [pago, setPago]       = useState(false);

  const handlePagar = async () => {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 2000));
      await criarAssinante({
        nome:         String(params.nome || ''),
        cpf:          String(params.cpf || ''),
        email:        String(params.email || ''),
        telefone:     String(params.telefone || ''),
        endereco:     String(params.endereco || ''),
        cpfIndicador: params.cpfIndicador ? String(params.cpfIndicador) : undefined,
        plano:        'mensal',
        valor:        89.90,
      });
      setPago(true);
    } catch (e: any) {
      const msg = e.message?.includes('já cadastrado')
        ? 'Este CPF já possui uma assinatura ativa.'
        : e.message || 'Erro ao processar. Tente novamente.';
      window.alert('Atenção: ' + msg);
    } finally { setLoading(false); }
  };

  if (pago) return (
    <View style={styles.successContainer}>
      <Text style={styles.successIcon}>✅</Text>
      <Text style={styles.successTitle}>Pagamento Confirmado!</Text>
      <Text style={styles.successDesc}>
        Bem-vindo à Mister Construções, {params.nome}!{'\n'}
        Sua assinatura mensal está ativa.{'\n\n'}
        Acesse "Meus Dados" para acompanhar seus serviços.
      </Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.push('/meus-dados')}>
        <Text style={styles.btnText}>👤 Ver Meus Dados</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnOutline} onPress={() => router.push('/')}>
        <Text style={styles.btnOutlineText}>← Voltar ao Início</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <Text style={styles.title}>💳 Confirmar Pagamento</Text>

      {/* Resumo */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>RESUMO DA ASSINATURA</Text>
        {[
          ['Nome',     params.nome],
          ['CPF',      params.cpf],
          ['E-mail',   params.email],
          ['Telefone', params.telefone],
          ['Endereço', params.endereco],
        ].map(([l, v]) => v ? (
          <View key={l as string}>
            <Text style={styles.label}>{l}</Text>
            <Text style={styles.value}>{v}</Text>
          </View>
        ) : null)}
        {params.cpfIndicador && (
          <>
            <Text style={styles.label}>Indicado por (CPF)</Text>
            <Text style={styles.value}>{params.cpfIndicador}</Text>
          </>
        )}
        <View style={styles.divider} />
        <Text style={styles.label}>Plano</Text>
        <Text style={styles.value}>Mensal</Text>
        <Text style={styles.label}>Valor</Text>
        <Text style={styles.preco}>R$ 89,90/mês</Text>
      </View>

      {/* Simulação */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>💳 SIMULAÇÃO DE PAGAMENTO</Text>
        <View style={styles.cartaoFake}>
          <Text style={styles.cartaoNumero}>•••• •••• •••• 4242</Text>
          <Text style={styles.cartaoInfo}>SIMULAÇÃO – Visa</Text>
        </View>
        <Text style={styles.aviso}>⚠️ Ambiente de testes – nenhuma cobrança real</Text>
      </View>

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handlePagar}
        disabled={loading}
      >
        {loading
          ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.btnText}>Processando...</Text>
            </View>
          : <Text style={styles.btnText}>✅ Confirmar e Pagar R$ 89,90</Text>
        }
      </TouchableOpacity>

      <Text style={styles.seguro}>🔒 Pagamento 100% seguro e criptografado</Text>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.voltar}>← Voltar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f8f9fa' },
  title:           { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 20, textAlign: 'center' },
  card:            { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, elevation: 2 },
  sectionLabel:    { fontSize: 11, color: '#f4a261', fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 },
  label:           { fontSize: 12, color: '#888', marginTop: 10 },
  value:           { fontSize: 15, color: '#1a1a2e', fontWeight: '600' },
  preco:           { fontSize: 22, color: '#f4a261', fontWeight: 'bold', marginTop: 4 },
  divider:         { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
  cartaoFake:      { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 20, marginVertical: 10 },
  cartaoNumero:    { color: '#fff', fontSize: 18, letterSpacing: 4, marginBottom: 8 },
  cartaoInfo:      { color: '#aaa', fontSize: 13 },
  aviso:           { color: '#f4a261', fontSize: 12, textAlign: 'center', marginTop: 6 },
  btn:             { backgroundColor: '#f4a261', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  btnDisabled:     { backgroundColor: '#ccc' },
  btnText:         { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnOutline:      { borderWidth: 1, borderColor: '#f4a261', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  btnOutlineText:  { color: '#f4a261', fontWeight: 'bold', fontSize: 15 },
  seguro:          { textAlign: 'center', color: '#888', fontSize: 13, marginBottom: 14 },
  voltar:          { textAlign: 'center', color: '#888', fontSize: 14 },
  successContainer:{ flex: 1, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center', padding: 32 },
  successIcon:     { fontSize: 64, marginBottom: 16 },
  successTitle:    { fontSize: 26, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12 },
  successDesc:     { color: '#555', fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 28 },
});