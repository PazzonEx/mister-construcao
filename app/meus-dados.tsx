import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Image, Alert, ActivityIndicator
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import { api } from '../convex/_generated/api';
import * as ImagePicker from 'expo-image-picker';

type Tela = 'busca' | 'primeiroAcesso' | 'login' | 'dados';

export default function MeusDados() {
  const router = useRouter();
  const [tela, setTela]         = useState<Tela>('busca');
  const [cpf, setCpf]           = useState('');
  const [cpfBusca, setCpfBusca] = useState('');
  const [senha, setSenha]       = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [editando, setEditando] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [fotoUri, setFotoUri]   = useState('');

  const assinante   = useQuery(api.assinantes.buscarPorCpf, cpfBusca ? { cpf: cpfBusca } : 'skip');
  const trabalhos   = useQuery(api.trabalhos.trabalhosPorCliente, cpfBusca ? { cpf: cpfBusca } : 'skip') || [];
  const indicacoes  = useQuery(api.assinantes.indicacoesPorCpf, cpfBusca ? { cpf: cpfBusca } : 'skip') || [];

  const definirSenha       = useMutation(api.assinantes.definirSenha);
  const editarAssinante    = useMutation(api.assinantes.editar);
  const gerarUploadUrl     = useMutation(api.assinantes.gerarUploadUrlAssinante);
  const salvarFotoMutation = useMutation(api.assinantes.salvarFotoAssinante);

  const [form, setForm] = useState({ nome: '', email: '', telefone: '', endereco: '' });

  // ── Buscar CPF ────────────────────────────────────────
  const handleBuscar = () => {
    if (!cpf.trim()) { window.alert('Informe seu CPF'); return; }
    setCpfBusca(cpf.trim());
  };

  // Após dados carregarem, decide a tela
  React.useEffect(() => {
    if (!cpfBusca || assinante === undefined) return;
    if (assinante === null) {
      Alert.alert('CPF não encontrado', 'Realize sua assinatura primeiro.');
      setCpfBusca('');
      return;
    }
    if (!assinante.senha) {
      setTela('primeiroAcesso');
    } else {
      setTela('login');
    }
  }, [assinante, cpfBusca]);

  // ── Primeiro acesso: define senha ─────────────────────
  const handleDefinirSenha = async () => {
    if (senha.length < 4) { window.alert('Senha deve ter pelo menos 4 caracteres'); return; }
    setLoading(true);
    try {
      await definirSenha({ cpf: cpfBusca, senha });
      setTela('dados');
      setForm({
        nome:     assinante?.nome || '',
        email:    assinante?.email || '',
        telefone: assinante?.telefone || '',
        endereco: assinante?.endereco || '',
      });
    } catch (e: any) { window.alert('Erro: ' + e.message); }
    finally { setLoading(false); }
  };

  const handleLogin = async () => {
    if (!senha) { window.alert('Informe sua senha'); return; }
    setLoading(true);
    try {
      if (assinante?.senha !== senha) {
        window.alert('Senha incorreta'); return;
      }
      setTela('dados');
      setForm({
        nome:     assinante?.nome || '',
        email:    assinante?.email || '',
        telefone: assinante?.telefone || '',
        endereco: assinante?.endereco || '',
      });
    } finally { setLoading(false); }
  };

  const handleSalvar = async () => {
    if (!form.nome.trim()) { window.alert('Nome não pode ficar vazio'); return; }
    setLoading(true);
    try {
      await editarAssinante({
        cpf: cpfBusca, senha,
        nome:      form.nome,
        email:     form.email,
        telefone:  form.telefone,
        endereco:  form.endereco,
        novaSenha: novaSenha || undefined,
      });
      if (fotoUri) {
        const uploadUrl = await gerarUploadUrl();
        const res = await fetch(fotoUri);
        const blob = await res.blob();
        const up = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob });
        const { storageId } = await up.json();
        await salvarFotoMutation({ cpf: cpfBusca, storageId });
        setFotoUri('');
      }
      window.alert('✅ Dados atualizados com sucesso!');
      setEditando(false);
      setNovaSenha('');
    } catch (e: any) { window.alert('Erro: ' + e.message); }
    finally { setLoading(false); }
  };

  // ── Escolher foto ─────────────────────────────────────
  const handleEscolherFoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled) setFotoUri(result.assets[0].uri);
  };

  const fotoExibir = fotoUri || assinante?.foto;
  const tokens = assinante?.tokens || 0;
  const totalGanhoTrabalhos = trabalhos.reduce((s, t) => s + t.valor, 0);
  const totalGanhoIndicacoes = indicacoes.reduce((s, i) => s + i.tokensGanhos, 0);

  // ════════════════════════════════════════════
  // TELA: BUSCA
  // ════════════════════════════════════════════
  if (tela === 'busca') return (
    <ScrollView style={styles.container} contentContainerStyle={styles.center}>
      <TouchableOpacity onPress={() => router.push('/')} style={styles.back}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>
      <Text style={styles.titulo}>👤 Área do Assinante</Text>
      <Text style={styles.sub}>Digite seu CPF para acessar seus dados</Text>
      <TextInput style={styles.input} placeholder="CPF" keyboardType="numeric" value={cpf} onChangeText={setCpf} />
      {cpfBusca && assinante === undefined
        ? <ActivityIndicator color="#f4a261" />
        : <TouchableOpacity style={styles.btnPrimary} onPress={handleBuscar}>
            <Text style={styles.btnText}>Buscar</Text>
          </TouchableOpacity>
      }
    </ScrollView>
  );

  // ════════════════════════════════════════════
  // TELA: PRIMEIRO ACESSO
  // ════════════════════════════════════════════
  if (tela === 'primeiroAcesso') return (
    <ScrollView style={styles.container} contentContainerStyle={styles.center}>
      <Text style={styles.titulo}>🔐 Primeiro Acesso</Text>
      <Text style={styles.sub}>Olá, {assinante?.nome}! Crie sua senha para acessar seus dados.</Text>
      <TextInput style={styles.input} placeholder="Crie uma senha (mín. 4 caracteres)" secureTextEntry value={senha} onChangeText={setSenha} />
      <TouchableOpacity style={[styles.btnPrimary, loading && { opacity: 0.6 }]} onPress={handleDefinirSenha} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Salvando...' : 'Criar Senha e Entrar'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ════════════════════════════════════════════
  // TELA: LOGIN
  // ════════════════════════════════════════════
  if (tela === 'login') return (
    <ScrollView style={styles.container} contentContainerStyle={styles.center}>
      <Text style={styles.titulo}>🔐 Entrar</Text>
      <Text style={styles.sub}>CPF: {cpfBusca}</Text>
      <TextInput style={styles.input} placeholder="Sua senha" secureTextEntry value={senha} onChangeText={setSenha} />
      <TouchableOpacity style={[styles.btnPrimary, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { setCpfBusca(''); setCpf(''); setSenha(''); setTela('busca'); }}>
        <Text style={styles.linkText}>← Usar outro CPF</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ════════════════════════════════════════════
  // TELA: DADOS
  // ════════════════════════════════════════════
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { setTela('busca'); setCpfBusca(''); setCpf(''); setSenha(''); }}>
          <Text style={styles.backText}>← Sair</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Meus Dados</Text>
        <TouchableOpacity onPress={() => setEditando(!editando)}>
          <Text style={styles.editarBtn}>{editando ? 'Cancelar' : '✏️ Editar'}</Text>
        </TouchableOpacity>
      </View>

      {/* Foto e nome */}
      <View style={styles.perfilBox}>
        <TouchableOpacity onPress={editando ? handleEscolherFoto : undefined}>
          {fotoExibir
            ? <Image source={{ uri: fotoExibir }} style={styles.fotoGrande} />
            : <View style={styles.fotoPlaceholder}><Text style={{ fontSize: 40 }}>👤</Text></View>
          }
          {editando && <Text style={styles.trocarFoto}>Trocar foto</Text>}
        </TouchableOpacity>
        <Text style={styles.perfilNome}>{assinante?.nome}</Text>
        <View style={[styles.statusBadge, { backgroundColor: assinante?.ativo ? '#2a9d8f' : '#e63946' }]}>
          <Text style={styles.statusText}>{assinante?.ativo ? '✅ Assinatura Ativa' : '❌ Inativa'}</Text>
        </View>
      </View>

      {/* Tokens */}
      <View style={styles.tokenCard}>
        <Text style={styles.tokenLabel}>🎁 Tokens de Reforma</Text>
        <Text style={styles.tokenValor}>R$ {tokens.toFixed(2)}</Text>
        <Text style={styles.tokenSub}>Ganhos por indicações • Use em próximos serviços</Text>
      </View>

      {/* Resumo rápido */}
      <View style={styles.resumoRow}>
        <View style={styles.resumoItem}>
          <Text style={styles.resumoNum}>{trabalhos.length}</Text>
          <Text style={styles.resumoLabel}>Serviços</Text>
        </View>
        <View style={styles.resumoItem}>
          <Text style={styles.resumoNum}>{indicacoes.length}</Text>
          <Text style={styles.resumoLabel}>Indicações</Text>
        </View>
        <View style={styles.resumoItem}>
          <Text style={styles.resumoNum}>{assinante?.pagamentos?.length || 0}</Text>
          <Text style={styles.resumoLabel}>Pagamentos</Text>
        </View>
      </View>

      {/* Dados cadastrais / edição */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>📋 Dados Cadastrais</Text>
        {editando ? (
          <>
            {[
              { label: 'Nome', key: 'nome', kb: 'default' },
              { label: 'E-mail', key: 'email', kb: 'email-address' },
              { label: 'Telefone', key: 'telefone', kb: 'phone-pad' },
              { label: 'Endereço', key: 'endereco', kb: 'default' },
            ].map(f => (
              <View key={f.key}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  value={(form as any)[f.key]}
                  keyboardType={f.kb as any}
                  onChangeText={v => setForm({ ...form, [f.key]: v })}
                />
              </View>
            ))}
            <Text style={styles.label}>Nova senha (deixe vazio para manter)</Text>
            <TextInput style={styles.input} secureTextEntry value={novaSenha} onChangeText={setNovaSenha} placeholder="Nova senha" />
            <TouchableOpacity style={[styles.btnPrimary, loading && { opacity: 0.6 }]} onPress={handleSalvar} disabled={loading}>
              <Text style={styles.btnText}>{loading ? 'Salvando...' : '✅ Salvar Alterações'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {[
              ['CPF', assinante?.cpf],
              ['Nome', assinante?.nome],
              ['E-mail', assinante?.email || '—'],
              ['Telefone', assinante?.telefone || '—'],
              ['Endereço', assinante?.endereco],
              ['Plano', `${assinante?.plano} — R$ ${assinante?.valor}/mês`],
            ].map(([l, v]) => (
              <View key={l as string}>
                <Text style={styles.label}>{l}</Text>
                <Text style={styles.valor}>{v}</Text>
              </View>
            ))}
            {assinante?.cpfIndicador && (
              <>
                <Text style={styles.label}>Indicado por (CPF)</Text>
                <Text style={styles.valor}>{assinante.cpfIndicador}</Text>
              </>
            )}
          </>
        )}
      </View>

      {/* Indicar amigo */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>🤝 Indique e Ganhe</Text>
        <Text style={styles.indicaDesc}>
          Compartilhe seu CPF com amigos. Quando eles se cadastrarem informando seu CPF e
          realizarem serviços, você ganha{' '}
          <Text style={{ color: '#f4a261', fontWeight: 'bold' }}>10% do valor</Text>{' '}
          em Tokens de Reforma automaticamente!
        </Text>
        <View style={styles.cpfIndicadorBox}>
          <Text style={styles.cpfIndicadorLabel}>📤 Seu CPF para indicar amigos:</Text>
          <Text style={styles.cpfIndicadorValor}>{assinante?.cpf}</Text>
          <Text style={{ color: '#888', fontSize: 11, marginTop: 6, textAlign: 'center' }}>
            O amigo informa este CPF no campo "quem te indicou" ao assinar
          </Text>
        </View>
        {indicacoes.length > 0 && (
          <>
            <Text style={[styles.label, { marginTop: 14 }]}>Suas indicações:</Text>
            {indicacoes.map((ind, i) => (
              <View key={i} style={styles.linhaItem}>
                <Text style={styles.linhaDesc}>CPF: {ind.cpfIndicado}</Text>
                <Text style={styles.linhaValor}>+R$ {ind.tokensGanhos.toFixed(2)}</Text>
              </View>
            ))}
            <Text style={styles.totalLabel}>
              Total ganho em indicações: <Text style={{ color: '#f4a261', fontWeight: 'bold' }}>R$ {totalGanhoIndicacoes.toFixed(2)}</Text>
            </Text>
          </>
        )}
      </View>

      {/* Trabalhos realizados */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>🔧 Serviços Realizados ({trabalhos.length})</Text>
        {trabalhos.length === 0
          ? <Text style={styles.vazio}>Nenhum serviço registrado ainda.</Text>
          : trabalhos.map((t, i) => (
            <View key={i} style={styles.linhaItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.linhaDesc}>{t.descricao}</Text>
                <Text style={styles.linhaData}>{new Date(t.data).toLocaleDateString('pt-BR')}</Text>
              </View>
              <Text style={styles.linhaValor}>R$ {t.valor.toFixed(2)}</Text>
            </View>
          ))
        }
        {trabalhos.length > 0 && (
          <Text style={styles.totalLabel}>
            Total: <Text style={{ fontWeight: 'bold' }}>R$ {totalGanhoTrabalhos.toFixed(2)}</Text>
          </Text>
        )}
      </View>

      {/* Pagamentos */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>💳 Histórico de Pagamentos ({assinante?.pagamentos?.length || 0})</Text>
        {(assinante?.pagamentos || []).map((p, i) => (
          <View key={i} style={styles.linhaItem}>
            <Text style={styles.linhaDesc}>{new Date(p.data).toLocaleDateString('pt-BR')} — {p.metodo}</Text>
            <Text style={styles.linhaValor}>R$ {p.valor.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f0f0f0' },
  center:       { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  back:         { alignSelf: 'flex-start', marginBottom: 16 },
  backText:     { color: '#f4a261', fontSize: 14 },
  titulo:       { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 8, textAlign: 'center' },
  sub:          { color: '#888', fontSize: 14, marginBottom: 20, textAlign: 'center' },
  input:        { width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14, backgroundColor: '#fff' },
  btnPrimary:   { backgroundColor: '#f4a261', padding: 14, borderRadius: 8, alignItems: 'center', width: '100%', marginBottom: 12 },
  btnText:      { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  linkText:     { color: '#f4a261', marginTop: 8, fontSize: 14 },

  // Header dados
  header:       { backgroundColor: '#1a1a2e', padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitulo: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  editarBtn:    { color: '#f4a261', fontWeight: 'bold', fontSize: 14 },

  // Perfil
  perfilBox:    { backgroundColor: '#fff', alignItems: 'center', padding: 24 },
  fotoGrande:   { width: 100, height: 100, borderRadius: 50, marginBottom: 4 },
  fotoPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  trocarFoto:   { color: '#f4a261', fontSize: 12, textAlign: 'center', marginBottom: 8 },
  perfilNome:   { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginTop: 8 },
  statusBadge:  { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 14, marginTop: 8 },
  statusText:   { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  // Token
  tokenCard:    { backgroundColor: '#1a1a2e', margin: 14, borderRadius: 12, padding: 20, alignItems: 'center' },
  tokenLabel:   { color: '#f4a261', fontWeight: 'bold', fontSize: 15 },
  tokenValor:   { color: '#fff', fontSize: 38, fontWeight: 'bold', marginVertical: 4 },
  tokenSub:     { color: '#888', fontSize: 12, textAlign: 'center' },

  // Resumo
  resumoRow:    { flexDirection: 'row', marginHorizontal: 14, marginBottom: 14, gap: 10 },
  resumoItem:   { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14, alignItems: 'center', elevation: 1 },
  resumoNum:    { fontSize: 26, fontWeight: 'bold', color: '#f4a261' },
  resumoLabel:  { color: '#888', fontSize: 12, marginTop: 2 },

  // Card
  card:         { backgroundColor: '#fff', borderRadius: 12, margin: 14, marginTop: 0, padding: 18, elevation: 1 },
  cardTitulo:   { fontSize: 15, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 14 },
  label:        { fontSize: 12, color: '#888', marginTop: 8 },
  valor:        { fontSize: 15, color: '#1a1a2e', fontWeight: '600', marginBottom: 4 },

  // Indicar
  indicaDesc:      { color: '#555', fontSize: 13, lineHeight: 20, marginBottom: 12 },
  cpfIndicadorBox: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 14, alignItems: 'center' },
  cpfIndicadorLabel: { color: '#888', fontSize: 12 },
  cpfIndicadorValor: { color: '#1a1a2e', fontSize: 20, fontWeight: 'bold', letterSpacing: 2, marginTop: 4 },

  // Linhas
  linhaItem:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  linhaDesc:    { color: '#444', fontSize: 14, flex: 1 },
  linhaData:    { color: '#aaa', fontSize: 12 },
  linhaValor:   { color: '#1a1a2e', fontWeight: 'bold', marginLeft: 8 },
  totalLabel:   { color: '#555', fontSize: 13, marginTop: 10, textAlign: 'right' },
  vazio:        { color: '#aaa', textAlign: 'center', padding: 16, fontSize: 14 },
});