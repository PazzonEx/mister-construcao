import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal, TextInput, Alert
} from 'react-native';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ nome: '', endereco: '', cpf: '' });

  const handleAssinar = () => setModalVisible(true);

  const handleFinalizar = () => {
    if (!form.nome || !form.endereco || !form.cpf) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    setModalVisible(false);
    router.push({
      pathname: '/pagamento',
      params: { nome: form.nome, cpf: form.cpf, endereco: form.endereco }
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>🏗️ Mister Construção</Text>
        <Text style={styles.tagline}>Reparos e reformas com profissionais qualificados</Text>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Sua casa sempre em ordem</Text>
        <Text style={styles.heroDesc}>
          Assine e tenha acesso ilimitado a reparos e pequenas reformas na sua residência,
          com profissionais certificados e total responsabilidade da Mister Construções.
        </Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={handleAssinar}>
          <Text style={styles.btnPrimaryText}>✅ Assinar Agora</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => router.push('/meus-dados')}>
          <Text style={styles.btnSecondaryText}>👤 Meus Dados</Text>
        </TouchableOpacity>
      </View>

      {/* Benefícios */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>O que está incluso?</Text>
        {[
          '🔧 Reparos elétricos e hidráulicos',
          '🪣 Pintura e pequenos reparos',
          '🚪 Conserto de portas e janelas',
          '🏠 Manutenção geral da residência',
          '⚡ Atendimento rápido e garantido',
        ].map((item, i) => (
          <Text key={i} style={styles.beneficio}>{item}</Text>
        ))}
      </View>

      {/* Preço */}
      <View style={styles.priceBox}>
        <Text style={styles.priceTitle}>Plano Mensal</Text>
        <Text style={styles.price}>R$ 89,90<Text style={styles.priceSub}>/mês</Text></Text>
        <Text style={styles.priceDesc}>Cancele quando quiser. Sem fidelidade.</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={handleAssinar}>
          <Text style={styles.btnPrimaryText}>Assinar Agora</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Assinatura */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>📋 Dados para Assinatura</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              value={form.nome}
              onChangeText={v => setForm({ ...form, nome: v })}
            />
            <TextInput
              style={styles.input}
              placeholder="Endereço completo"
              value={form.endereco}
              onChangeText={v => setForm({ ...form, endereco: v })}
            />
            <TextInput
              style={styles.input}
              placeholder="CPF (000.000.000-00)"
              value={form.cpf}
              keyboardType="numeric"
              onChangeText={v => setForm({ ...form, cpf: v })}
            />
            <TouchableOpacity style={styles.btnPrimary} onPress={handleFinalizar}>
              <Text style={styles.btnPrimaryText}>Ir para Pagamento →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Mister Construções. Todos os direitos reservados.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#1a1a2e', padding: 24, alignItems: 'center' },
  logo: { fontSize: 28, fontWeight: 'bold', color: '#f4a261', marginBottom: 4 },
  tagline: { color: '#ccc', fontSize: 14 },
  hero: { backgroundColor: '#16213e', padding: 32, alignItems: 'center' },
  heroTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 12 },
  heroDesc: { color: '#aaa', textAlign: 'center', fontSize: 15, marginBottom: 24, lineHeight: 22 },
  btnPrimary: { backgroundColor: '#f4a261', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, marginBottom: 12 },
  btnPrimaryText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnSecondary: { borderWidth: 1, borderColor: '#f4a261', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
  btnSecondaryText: { color: '#f4a261', fontWeight: 'bold', fontSize: 15 },
  section: { padding: 24, backgroundColor: '#fff', margin: 16, borderRadius: 12, elevation: 2 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#1a1a2e' },
  beneficio: { fontSize: 15, marginBottom: 10, color: '#333' },
  priceBox: { margin: 16, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 24, alignItems: 'center' },
  priceTitle: { color: '#f4a261', fontSize: 18, marginBottom: 8 },
  price: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  priceSub: { fontSize: 18, color: '#aaa' },
  priceDesc: { color: '#888', marginBottom: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%', maxWidth: 420 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#1a1a2e', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 15 },
  cancelar: { textAlign: 'center', color: '#888', marginTop: 12, fontSize: 14 },
  footer: { padding: 24, alignItems: 'center' },
  footerText: { color: '#aaa', fontSize: 12 },
});