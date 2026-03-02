import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput, Alert, FlatList, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

const { width } = Dimensions.get('window');

// ── Estrelas ──────────────────────────────────────────────
function Estrelas({ valor }: { valor: number }) {
  return (
    <Text style={{ color: '#f4a261', fontSize: 13 }}>
      {'★'.repeat(Math.round(valor))}{'☆'.repeat(5 - Math.round(valor))} {valor.toFixed(1)}
    </Text>
  );
}

// ── Tabela de cobertura ────────────────────────────────────
const SERVICOS = [
  { cat: '🔧 Hidráulica', itens: ['Reparo de vazamento em torneira','Substituição de sifão','Desentupimento de ralo','Reparo de descarga','Vedação de canos','Instalação de torneira','Reparo de caixa d\'água'] },
  { cat: '⚡ Elétrica', itens: ['Troca de tomada ou interruptor','Instalação de lâmpada/lustre','Troca de disjuntor','Reparo de curto-circuito simples','Instalação de ventilador de teto','Reparo de campainha'] },
  { cat: '🎨 Pintura', itens: ['Retoque de parede interna','Correção de manchas','Pintura de rodapé','Reparo de descascamento'] },
  { cat: '🧱 Alvenaria', itens: ['Correção de rachaduras','Rejunte de azulejo','Reparo de piso solto','Reforço de parede'] },
  { cat: '🚪 Marcenaria', itens: ['Ajuste de porta','Reparo de dobradiça','Fixação de prateleira','Reparo de gaveta','Ajuste de janela'] },
  { cat: '🏠 Telhado', itens: ['Vedação de goteira','Fixação de calha','Troca de telha quebrada'] },
  { cat: '❄️ Ar-condicionado', itens: ['Limpeza de filtro','Verificação de gás','Instalação simples'] },
  { cat: '🪑 Montagem', itens: ['Montagem de móvel','Instalação de suporte TV','Fixação de quadro pesado'] },
];

function TabelaCobertura() {
  return (
    <View style={styles.tabelaContainer}>
      <Text style={styles.sectionTitle}>📋 Tabela de Cobertura do Plano</Text>
      <Text style={styles.tabelaDesc}>
        ✅ = Cobertura total incluída no plano &nbsp; ⚡ = Cobertura parcial (mão de obra inclusa, material cobrado à parte)
      </Text>
      {SERVICOS.map((s, i) => (
        <View key={i} style={styles.tabelaCat}>
          <Text style={styles.tabelaCatTitle}>{s.cat}</Text>
          {s.itens.map((item, j) => (
            <View key={j} style={styles.tabelaRow}>
              <Text style={styles.tabelaItem}>{item}</Text>
              <Text style={styles.tabelaBadge}>✅</Text>
            </View>
          ))}
        </View>
      ))}
      <View style={styles.tabelaInfo}>
        <Text style={styles.tabelaInfoTitle}>ℹ️ Como funciona a cobertura?</Text>
        <Text style={styles.tabelaInfoText}>
          <Text style={{ fontWeight: 'bold' }}>Cobertura Total:</Text> Mão de obra e materiais básicos inclusos no plano mensal. Sem custo adicional por acionamento.{'\n\n'}
          <Text style={{ fontWeight: 'bold' }}>Cobertura Parcial:</Text> Mão de obra inclusa no plano. Materiais especiais ou de alto custo são cobrados separadamente com orçamento prévio aprovado pelo cliente.{'\n\n'}
          <Text style={{ fontWeight: 'bold' }}>Acionamento:</Text> Cada acionamento gera uma ordem de serviço. Assinantes do plano mensal têm direito a até 2 acionamentos por mês inclusos.
        </Text>
      </View>
    </View>
  );
}

// ── Componente principal ───────────────────────────────────
export default function Home() {
  const router = useRouter();
  const colaboradores = useQuery(api.colaboradores.listarColaboradores) || [];
  const criarAcionamento = useMutation(api.acionamentos.criarAcionamento);

  const [modalAssinar, setModalAssinar] = useState(false);
  const [modalAcionar, setModalAcionar] = useState(false);
  const [form, setForm] = useState({ nome: '', endereco: '', cpf: '', email: '', telefone: '', cpfIndicador: '' });
  const [acionar, setAcionar] = useState({ cpf: '', telefone: '' });
  const [loadingAcionar, setLoadingAcionar] = useState(false);

  const handleAssinar = () => {
    if (!form.nome || !form.endereco || !form.cpf || !form.email || !form.telefone) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.'); return;
    }
    setModalAssinar(false);
    router.push({ pathname: '/pagamento', params: { ...form } });
  };

  const handleAcionar = async () => {
    if (!acionar.cpf || !acionar.telefone) {
      Alert.alert('Atenção', 'Preencha CPF e telefone.'); return;
    }
    setLoadingAcionar(true);
    try {
      await criarAcionamento({ cpf: acionar.cpf, telefone: acionar.telefone });
      Alert.alert('✅ Acionamento enviado!', 'Nossa equipe entrará em contato em breve.');
      setAcionar({ cpf: '', telefone: '' });
      setModalAcionar(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar. Tente novamente.');
    } finally { setLoadingAcionar(false); }
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
          Assine e tenha acesso a reparos e pequenas reformas na sua residência,
          com profissionais certificados e total responsabilidade da Mister Construções.
        </Text>
        <View style={styles.botoesRow}>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => setModalAssinar(true)}>
            <Text style={styles.btnPrimaryText}>✅ Assinar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnWarning} onPress={() => setModalAcionar(true)}>
            <Text style={styles.btnPrimaryText}>🔔 Acionar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={() => router.push('/meus-dados')}>
            <Text style={styles.btnSecondaryText}>👤 Meus Dados</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Colaboradores */}
      {colaboradores.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👷 Nossos Colaboradores</Text>
          <FlatList
            data={colaboradores}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={i => i._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.colaboradorCard}
                onPress={() => router.push({ pathname: '/colaborador', params: { id: item._id } })}
              >
                <View style={styles.fotoPlaceholder}>
                  <Text style={{ fontSize: 32 }}>👷</Text>
                </View>
                <Text style={styles.colaboradorNome}>{item.nome}</Text>
                <Text style={styles.colaboradorProfissao}>{item.profissao}</Text>
                <Estrelas valor={item.estrelas} />
                <Text style={styles.colaboradorTrabalhos}>{item.totalTrabalhos} trabalhos</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Benefícios */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>O que está incluso?</Text>
        {['🔧 Reparos elétricos e hidráulicos','🪣 Pintura e pequenos reparos','🚪 Conserto de portas e janelas','🏠 Manutenção geral da residência','⚡ Atendimento rápido e garantido','🎁 Programa Indique e Ganhe tokens de reforma'].map((item, i) => (
          <Text key={i} style={styles.beneficio}>{item}</Text>
        ))}
      </View>

      {/* Indique e Ganhe */}
      <View style={styles.indicaBox}>
        <Text style={styles.indicaTitulo}>🎁 Indique e Ganhe!</Text>
        <Text style={styles.indicaDesc}>
          Indique amigos e ganhe até <Text style={{ fontWeight: 'bold', color: '#f4a261' }}>10% do valor</Text> dos serviços realizados pelos seus indicados em Tokens de Reforma.{'\n'}
          Use seus tokens para abater serviços futuros!
        </Text>
      </View>

      {/* Tabela de cobertura */}
      <TabelaCobertura />

      {/* Preço */}
      <View style={styles.priceBox}>
        <Text style={styles.priceTitle}>Plano Mensal</Text>
        <Text style={styles.price}>R$ 89,90<Text style={styles.priceSub}>/mês</Text></Text>
        <Text style={styles.priceDesc}>Cancele quando quiser. Sem fidelidade.</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => setModalAssinar(true)}>
          <Text style={styles.btnPrimaryText}>Assinar Agora</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Assinar */}
      <Modal visible={modalAssinar} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>📋 Dados para Assinatura</Text>
              {[
                { ph: 'Nome completo *', key: 'nome' },
                { ph: 'E-mail *', key: 'email', kb: 'email-address' },
                { ph: 'Telefone / WhatsApp *', key: 'telefone', kb: 'phone-pad' },
                { ph: 'CPF *', key: 'cpf', kb: 'numeric' },
                { ph: 'Endereço completo *', key: 'endereco' },
                { ph: 'CPF de quem te indicou (opcional)', key: 'cpfIndicador', kb: 'numeric' },
              ].map(f => (
                <TextInput
                  key={f.key}
                  style={styles.input}
                  placeholder={f.ph}
                  value={(form as any)[f.key]}
                  keyboardType={(f.kb as any) || 'default'}
                  onChangeText={v => setForm({ ...form, [f.key]: v })}
                />
              ))}
              <TouchableOpacity style={styles.btnPrimary} onPress={handleAssinar}>
                <Text style={styles.btnPrimaryText}>Ir para Pagamento →</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalAssinar(false)}>
                <Text style={styles.cancelar}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Acionar */}
      <Modal visible={modalAcionar} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🔔 Acionar Serviço</Text>
            <Text style={styles.modalDesc}>Nossa equipe entrará em contato para agendar o atendimento.</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu CPF *"
              value={acionar.cpf}
              keyboardType="numeric"
              onChangeText={v => setAcionar({ ...acionar, cpf: v })}
            />
            <TextInput
              style={styles.input}
              placeholder="Telefone / WhatsApp *"
              value={acionar.telefone}
              keyboardType="phone-pad"
              onChangeText={v => setAcionar({ ...acionar, telefone: v })}
            />
            <TouchableOpacity
              style={[styles.btnWarning, loadingAcionar && { opacity: 0.6 }]}
              onPress={handleAcionar}
              disabled={loadingAcionar}
            >
              <Text style={styles.btnPrimaryText}>{loadingAcionar ? 'Enviando...' : '✅ Enviar Acionamento'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalAcionar(false)}>
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
  botoesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  btnPrimary: { backgroundColor: '#f4a261', paddingVertical: 13, paddingHorizontal: 22, borderRadius: 8, marginBottom: 8 },
  btnWarning: { backgroundColor: '#e63946', paddingVertical: 13, paddingHorizontal: 22, borderRadius: 8, marginBottom: 8 },
  btnPrimaryText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  btnSecondary: { borderWidth: 1, borderColor: '#f4a261', paddingVertical: 12, paddingHorizontal: 22, borderRadius: 8, marginBottom: 8 },
  btnSecondaryText: { color: '#f4a261', fontWeight: 'bold', fontSize: 15 },
  section: { padding: 20, backgroundColor: '#fff', margin: 14, borderRadius: 12, elevation: 2 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#1a1a2e' },
  beneficio: { fontSize: 15, marginBottom: 10, color: '#333' },
  colaboradorCard: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 14, marginRight: 12, alignItems: 'center', width: 140, borderWidth: 1, borderColor: '#eee' },
  fotoPlaceholder: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  colaboradorNome: { fontWeight: 'bold', color: '#1a1a2e', textAlign: 'center', fontSize: 13 },
  colaboradorProfissao: { color: '#888', fontSize: 11, marginBottom: 4, textAlign: 'center' },
  colaboradorTrabalhos: { color: '#aaa', fontSize: 11, marginTop: 4 },
  indicaBox: { margin: 14, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 24 },
  indicaTitulo: { color: '#f4a261', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  indicaDesc: { color: '#ccc', fontSize: 14, lineHeight: 22 },
  tabelaContainer: { margin: 14, backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 2 },
  tabelaDesc: { color: '#555', fontSize: 13, marginBottom: 16, lineHeight: 20 },
  tabelaCat: { marginBottom: 16 },
  tabelaCatTitle: { fontWeight: 'bold', color: '#1a1a2e', fontSize: 15, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 4 },
  tabelaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
  tabelaItem: { color: '#444', fontSize: 14, flex: 1 },
  tabelaBadge: { fontSize: 16 },
  tabelaInfo: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 16, marginTop: 8 },
  tabelaInfoTitle: { fontWeight: 'bold', color: '#1a1a2e', marginBottom: 10, fontSize: 15 },
  tabelaInfoText: { color: '#555', fontSize: 13, lineHeight: 22 },
  priceBox: { margin: 14, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 24, alignItems: 'center' },
  priceTitle: { color: '#f4a261', fontSize: 18, marginBottom: 8 },
  price: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  priceSub: { fontSize: 18, color: '#aaa' },
  priceDesc: { color: '#888', marginBottom: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%', maxWidth: 440 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 6, color: '#1a1a2e', textAlign: 'center' },
  modalDesc: { color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 15 },
  cancelar: { textAlign: 'center', color: '#888', marginTop: 14, fontSize: 14 },
  footer: { padding: 24, alignItems: 'center' },
  footerText: { color: '#aaa', fontSize: 12 },
});