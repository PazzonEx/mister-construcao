import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, Image
} from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import * as ImagePicker from 'expo-image-picker';

const SENHA_ADMIN = 'mister2025';

function Estrelas({ valor }: { valor: number }) {
  return (
    <Text style={{ color: '#f4a261' }}>
      {'★'.repeat(Math.round(valor))}{'☆'.repeat(5 - Math.round(valor))} {valor.toFixed(1)}
    </Text>
  );
}

export default function Admin() {
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState('');
  const [aba, setAba] = useState<'colaboradores' | 'acionamentos' | 'trabalhos'>('colaboradores');

  // ── Colaboradores ──────────────────────────────────────
  const colaboradores = useQuery(api.colaboradores.listarColaboradores) || [];
  const criarColaborador = useMutation(api.colaboradores.criarColaborador);
  const gerarUploadUrl = useMutation(api.colaboradores.gerarUploadUrl);
  const salvarFoto = useMutation(api.colaboradores.salvarFoto);

  const [formCol, setFormCol] = useState({ nome: '', profissao: '', descricao: '' });
  const [fotoUri, setFotoUri] = useState('');       // URI local para preview
  const [loadingCol, setLoadingCol] = useState(false);

  // ── Acionamentos ───────────────────────────────────────
  const acionamentos = useQuery(api.acionamentos.listarAcionamentos) || [];

  // ── Trabalhos ──────────────────────────────────────────
  const registrarTrabalho = useMutation(api.trabalhos.registrarTrabalho);
  const [formTrab, setFormTrab] = useState({
    colaboradorId: '', cpfCliente: '', descricao: '', valor: ''
  });
  const [loadingTrab, setLoadingTrab] = useState(false);

  // ── Login ──────────────────────────────────────────────
  if (!autenticado) {
    return (
      <View style={styles.loginContainer}>
        <Text style={styles.loginTitle}>🔐 Painel Admin</Text>
        <Text style={styles.loginSubtitle}>Mister Construções</Text>
        <TextInput
          style={styles.input}
          placeholder="Senha de acesso"
          placeholderTextColor="#666"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => {
            if (senha === SENHA_ADMIN) setAutenticado(true);
            else Alert.alert('Senha incorreta');
          }}
        >
          <Text style={styles.btnText}>Entrar</Text>
        </TouchableOpacity>
        <Text style={styles.loginDica}>Acesse: seusite.expo.app/admin</Text>
      </View>
    );
  }

  // ── Escolher foto da galeria ───────────────────────────
  const handleEscolherFoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão negada', 'Precisamos acessar sua galeria.'); return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setFotoUri(result.assets[0].uri);
  };

  // ── Cadastrar colaborador com upload de foto ───────────
  const handleCriarColaborador = async () => {
    if (!formCol.nome || !formCol.profissao || !formCol.descricao) {
      Alert.alert('Atenção', 'Preencha nome, profissão e descrição.'); return;
    }
    setLoadingCol(true);
    try {
      // 1. Cria colaborador sem foto ainda
      const id = await criarColaborador({ ...formCol, foto: '' });

      // 2. Se tiver foto selecionada, faz upload para o Convex Storage
      if (fotoUri) {
        const uploadUrl = await gerarUploadUrl();
        const response = await fetch(fotoUri);
        const blob = await response.blob();
        const upload = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': blob.type },
          body: blob,
        });
        const { storageId } = await upload.json();
        await salvarFoto({ colaboradorId: id, storageId });
      }

      Alert.alert('✅ Colaborador cadastrado com sucesso!');
      setFormCol({ nome: '', profissao: '', descricao: '' });
      setFotoUri('');
    } catch (e: any) {
      Alert.alert('Erro ao cadastrar', String(e?.message || e));
    } finally {
      setLoadingCol(false);
    }
  };

  // ── Registrar trabalho realizado ───────────────────────
  const handleRegistrarTrabalho = async () => {
    if (!formTrab.colaboradorId || !formTrab.cpfCliente || !formTrab.descricao || !formTrab.valor) {
      Alert.alert('Atenção', 'Preencha todos os campos.'); return;
    }
    setLoadingTrab(true);
    try {
      await registrarTrabalho({
        colaboradorId: formTrab.colaboradorId as any,
        cpfCliente: formTrab.cpfCliente,
        descricao: formTrab.descricao,
        valor: parseFloat(formTrab.valor),
      });
      Alert.alert('✅ Trabalho registrado!\nTokens enviados ao indicador se houver.');
      setFormTrab({ colaboradorId: '', cpfCliente: '', descricao: '', valor: '' });
    } catch (e: any) {
      Alert.alert('Erro', e?.message || String(e));
    } finally {
      setLoadingTrab(false);
    }
  };

  // ── UI principal ───────────────────────────────────────
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Admin – Mister Construções</Text>
        <TouchableOpacity onPress={() => setAutenticado(false)}>
          <Text style={styles.sair}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Abas */}
      <View style={styles.abas}>
        {(['colaboradores', 'acionamentos', 'trabalhos'] as const).map(a => (
          <TouchableOpacity
            key={a}
            style={[styles.aba, aba === a && styles.abaAtiva]}
            onPress={() => setAba(a)}
          >
            <Text style={[styles.abaText, aba === a && styles.abaTextAtiva]}>
              {a === 'colaboradores' ? '👷 Equipe' : a === 'acionamentos' ? '🔔 Chamados' : '🔧 Trabalhos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── ABA COLABORADORES ── */}
      {aba === 'colaboradores' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cadastrar Colaborador</Text>

          {/* Foto */}
          <TouchableOpacity style={styles.fotoBotao} onPress={handleEscolherFoto}>
            {fotoUri ? (
              <Image source={{ uri: fotoUri }} style={styles.fotoPreview} />
            ) : (
              <View style={styles.fotoPlaceholder}>
                <Text style={styles.fotoIcon}>📷</Text>
                <Text style={styles.fotoBotaoText}>Escolher Foto</Text>
              </View>
            )}
          </TouchableOpacity>
          {fotoUri && (
            <TouchableOpacity onPress={() => setFotoUri('')}>
              <Text style={styles.removerFoto}>✕ Remover foto</Text>
            </TouchableOpacity>
          )}

          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            value={formCol.nome}
            onChangeText={v => setFormCol({ ...formCol, nome: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="Profissão (ex: Eletricista, Encanador)"
            value={formCol.profissao}
            onChangeText={v => setFormCol({ ...formCol, profissao: v })}
          />
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
            placeholder="Descrição das habilidades..."
            multiline
            value={formCol.descricao}
            onChangeText={v => setFormCol({ ...formCol, descricao: v })}
          />

          <TouchableOpacity
            style={[styles.btnPrimary, loadingCol && { opacity: 0.6 }]}
            onPress={handleCriarColaborador}
            disabled={loadingCol}
          >
            <Text style={styles.btnText}>
              {loadingCol ? '⏳ Cadastrando...' : '+ Cadastrar Colaborador'}
            </Text>
          </TouchableOpacity>

          {/* Lista de colaboradores */}
          <Text style={[styles.sectionTitle, { marginTop: 28 }]}>
            Colaboradores Cadastrados ({colaboradores.length})
          </Text>
          {colaboradores.length === 0 && (
            <Text style={styles.vazio}>Nenhum colaborador cadastrado ainda.</Text>
          )}
          {colaboradores.map(c => (
            <View key={c._id} style={styles.colaboradorItem}>
              <View style={styles.colaboradorRow}>
                {c.foto ? (
                  <Image source={{ uri: c.foto }} style={styles.colaboradorFoto} />
                ) : (
                  <View style={styles.colaboradorFotoPlaceholder}>
                    <Text style={{ fontSize: 24 }}>👷</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.colaboradorNome}>{c.nome}</Text>
                  <Text style={styles.colaboradorProfissao}>{c.profissao}</Text>
                  <Estrelas valor={c.estrelas} />
                  <Text style={{ color: '#888', fontSize: 12 }}>{c.totalTrabalhos} trabalhos</Text>
                </View>
              </View>
              <Text style={{ color: '#555', fontSize: 13, marginTop: 6 }}>{c.descricao}</Text>
              <View style={styles.idBox}>
                <Text style={styles.idText}>ID: {c._id}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── ABA ACIONAMENTOS ── */}
      {aba === 'acionamentos' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Pedidos de Acionamento ({acionamentos.length})
          </Text>
          {acionamentos.length === 0 && (
            <Text style={styles.vazio}>Nenhum acionamento ainda.</Text>
          )}
          {acionamentos.map((a, i) => (
            <View key={i} style={styles.acionamentoItem}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: a.status === 'pendente' ? '#e63946' : a.status === 'em_andamento' ? '#f4a261' : '#2a9d8f' }
              ]}>
                <Text style={styles.statusText}>{a.status.toUpperCase()}</Text>
              </View>
              <Text style={styles.acionamentoCpf}>CPF: {a.cpf}</Text>
              <Text style={styles.acionamentoTel}>📱 {a.telefone}</Text>
              <Text style={styles.acionamentoData}>
                {new Date(a.data).toLocaleString('pt-BR')}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* ── ABA TRABALHOS ── */}
      {aba === 'trabalhos' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registrar Trabalho Realizado</Text>
          <View style={styles.dica}>
            <Text style={styles.dicaText}>
              ℹ️ Ao registrar, o sistema calcula automaticamente 10% do valor como tokens
              para o indicador do cliente (se houver).
            </Text>
          </View>

          <Text style={styles.label}>ID do Colaborador</Text>
          <Text style={styles.labelDica}>Copie o ID da aba Equipe acima</Text>
          <TextInput
            style={styles.input}
            placeholder="Cole o ID do colaborador aqui"
            value={formTrab.colaboradorId}
            onChangeText={v => setFormTrab({ ...formTrab, colaboradorId: v })}
          />

          <Text style={styles.label}>CPF do Cliente</Text>
          <TextInput
            style={styles.input}
            placeholder="CPF do cliente"
            keyboardType="numeric"
            value={formTrab.cpfCliente}
            onChangeText={v => setFormTrab({ ...formTrab, cpfCliente: v })}
          />

          <Text style={styles.label}>Descrição do serviço</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Ex: Reparo de torneira na cozinha"
            multiline
            value={formTrab.descricao}
            onChangeText={v => setFormTrab({ ...formTrab, descricao: v })}
          />

          <Text style={styles.label}>Valor total do serviço (R$)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 150.00"
            keyboardType="numeric"
            value={formTrab.valor}
            onChangeText={v => setFormTrab({ ...formTrab, valor: v })}
          />

          {!!formTrab.valor && parseFloat(formTrab.valor) > 0 && (
            <View style={styles.tokenPreviewBox}>
              <Text style={styles.tokenPreview}>
                🎁 Tokens para o indicador: R$ {(parseFloat(formTrab.valor) * 0.1).toFixed(2)}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btnPrimary, loadingTrab && { opacity: 0.6 }]}
            onPress={handleRegistrarTrabalho}
            disabled={loadingTrab}
          >
            <Text style={styles.btnText}>
              {loadingTrab ? '⏳ Registrando...' : '✅ Registrar Trabalho'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },

  // Login
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#1a1a2e', minHeight: 500 },
  loginTitle: { fontSize: 28, fontWeight: 'bold', color: '#f4a261', marginBottom: 8 },
  loginSubtitle: { color: '#aaa', marginBottom: 32, fontSize: 15 },
  loginDica: { color: '#555', marginTop: 20, fontSize: 12, textAlign: 'center' },

  // Header
  header: { backgroundColor: '#1a1a2e', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#f4a261', fontWeight: 'bold', fontSize: 15 },
  sair: { color: '#e63946', fontSize: 14, fontWeight: 'bold' },

  // Abas
  abas: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  aba: { flex: 1, padding: 14, alignItems: 'center' },
  abaAtiva: { borderBottomWidth: 3, borderBottomColor: '#f4a261' },
  abaText: { color: '#aaa', fontSize: 12, fontWeight: '600' },
  abaTextAtiva: { color: '#f4a261' },

  // Seção
  section: { margin: 14, backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 2 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 14 },

  // Inputs
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14, backgroundColor: '#fafafa' },
  label: { fontSize: 13, color: '#555', fontWeight: '600', marginBottom: 2 },
  labelDica: { fontSize: 11, color: '#aaa', marginBottom: 8 },

  // Botão principal
  btnPrimary: { backgroundColor: '#f4a261', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 6 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  // Foto
  fotoBotao: { borderWidth: 2, borderColor: '#f4a261', borderStyle: 'dashed', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 8 },
  fotoPlaceholder: { alignItems: 'center' },
  fotoIcon: { fontSize: 36, marginBottom: 6 },
  fotoBotaoText: { color: '#f4a261', fontWeight: 'bold', fontSize: 14 },
  fotoPreview: { width: 120, height: 120, borderRadius: 60 },
  removerFoto: { color: '#e63946', textAlign: 'center', marginBottom: 12, fontSize: 13 },

  // Colaborador item
  colaboradorItem: { backgroundColor: '#f8f9fa', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  colaboradorRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 6 },
  colaboradorFoto: { width: 60, height: 60, borderRadius: 30 },
  colaboradorFotoPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' },
  colaboradorNome: { fontWeight: 'bold', color: '#1a1a2e', fontSize: 15 },
  colaboradorProfissao: { color: '#888', fontSize: 13, marginBottom: 2 },
  idBox: { marginTop: 8, backgroundColor: '#eee', borderRadius: 4, padding: 6 },
  idText: { fontSize: 11, color: '#555' },

  // Acionamento
  acionamentoItem: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  statusBadge: { borderRadius: 4, paddingVertical: 3, paddingHorizontal: 10, alignSelf: 'flex-start', marginBottom: 8 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  acionamentoCpf: { fontWeight: 'bold', color: '#1a1a2e', fontSize: 14 },
  acionamentoTel: { color: '#555', marginTop: 4 },
  acionamentoData: { color: '#aaa', fontSize: 12, marginTop: 4 },

  // Tokens preview
  tokenPreviewBox: { backgroundColor: '#f0fff8', borderRadius: 8, padding: 12, marginBottom: 12, alignItems: 'center' },
  tokenPreview: { color: '#2a9d8f', fontWeight: 'bold', fontSize: 15 },

  // Dica
  dica: { backgroundColor: '#fff8f0', borderRadius: 8, padding: 12, marginBottom: 14 },
  dicaText: { color: '#c77b3a', fontSize: 13, lineHeight: 19 },

  vazio: { color: '#aaa', textAlign: 'center', padding: 20, fontSize: 14 },
});