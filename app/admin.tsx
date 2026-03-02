import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, Image, Modal
} from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { api } from '../convex/_generated/api';
import * as ImagePicker from 'expo-image-picker';

const SENHA_ADMIN = 'mister2025';

type Aba = 'os' | 'acionamentos' | 'colaboradores';
type FiltroOS = 'agendado' | 'em_andamento' | 'finalizado' | 'cancelado';

function Estrelas({ valor }: { valor: number }) {
  return <Text style={{ color: '#f4a261' }}>{'★'.repeat(Math.round(valor))} {valor.toFixed(1)}</Text>;
}

function BadgeStatus({ status }: { status: string }) {
  const cores: Record<string, string> = {
    agendado:     '#3b82f6',
    em_andamento: '#f4a261',
    finalizado:   '#2a9d8f',
    cancelado:    '#e63946',
    pendente:     '#e63946',
    visto:        '#888',
    convertido:   '#2a9d8f',
  };
  const labels: Record<string, string> = {
    agendado: 'Agendado', em_andamento: 'Em andamento',
    finalizado: 'Finalizado', cancelado: 'Cancelado',
    pendente: 'Pendente', visto: 'Visto', convertido: 'Convertido em OS',
  };
  return (
    <View style={[styles.badge, { backgroundColor: cores[status] || '#888' }]}>
      <Text style={styles.badgeText}>{labels[status] || status}</Text>
    </View>
  );
}

export default function Admin() {
  const router = useRouter();
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha]     = useState('');
  const [aba, setAba]         = useState<Aba>('os');
  const [filtroOS, setFiltroOS] = useState<FiltroOS>('em_andamento');

  // ── OS ────────────────────────────────────────────────
  const osLista     = useQuery(api.ordensServico.listarPorStatus, { status: filtroOS }) || [];
  const criarOS     = useMutation(api.ordensServico.criar);
  const iniciarOS   = useMutation(api.ordensServico.iniciar);
  const finalizarOS = useMutation(api.ordensServico.finalizar);
  const cancelarOS  = useMutation(api.ordensServico.cancelar);

  const [modalCriarOS, setModalCriarOS]   = useState(false);
  const [modalVerOS, setModalVerOS]       = useState<any>(null);
  const [modalFinalizar, setModalFinalizar] = useState<any>(null);
  const [modalCancelar, setModalCancelar] = useState<any>(null);
  const [valorFinal, setValorFinal]       = useState('');
  const [motivoCancel, setMotivoCancel]   = useState('');

  // Form nova OS
  const colaboradores = useQuery(api.colaboradores.listarColaboradores) || [];
  const [formOS, setFormOS] = useState({
    titulo: '', descricao: '', cpfCliente: '',
    dataAgendada: '', valorEstimado: '', observacoes: '',
  });
  const [colsSelecionados, setColsSelecionados] = useState<string[]>([]);
  const [loadingOS, setLoadingOS] = useState(false);
  const cpfClienteQuery = formOS.cpfCliente.replace(/\D/g, '');
  const buscarCliente = useQuery(
    api.assinantes.buscarPorCpf,
    cpfClienteQuery.length === 11 ? { cpf: cpfClienteQuery } : 'skip'
  );

  // ── Acionamentos ──────────────────────────────────────
  const acionamentos    = useQuery(api.acionamentos.listarAcionamentos) || [];
  const atualizarStatus = useMutation(api.acionamentos.atualizarStatus);

  // ── Colaboradores ─────────────────────────────────────
  const criarColaborador = useMutation(api.colaboradores.criarColaborador);
  const gerarUploadUrl   = useMutation(api.colaboradores.gerarUploadUrl);
  const salvarFoto       = useMutation(api.colaboradores.salvarFoto);
  const [formCol, setFormCol] = useState({ nome: '', profissao: '', descricao: '' });
  const [fotoUri, setFotoUri] = useState('');
  const [loadingCol, setLoadingCol] = useState(false);

  // ── Login ─────────────────────────────────────────────
  if (!autenticado) return (
    <View style={styles.loginContainer}>
      <Text style={styles.loginTitle}>🔐 Painel Admin</Text>
      <Text style={styles.loginSubtitle}>Mister Construções</Text>
      <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#666"
        secureTextEntry value={senha} onChangeText={setSenha} />
      <TouchableOpacity style={styles.btnPrimary} onPress={() => {
        if (senha === SENHA_ADMIN) setAutenticado(true);
        else Alert.alert('Senha incorreta');
      }}>
        <Text style={styles.btnText}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Criar OS ──────────────────────────────────────────
  const handleCriarOS = async () => {
    // Validações com feedback claro
    if (!formOS.titulo.trim()) {
      window.alert('Preencha o título do serviço.'); return;
    }
    if (!formOS.descricao.trim()) {
      window.alert('Preencha a descrição.'); return;
    }
    if (!formOS.cpfCliente.trim()) {
      window.alert('Informe o CPF do cliente.'); return;
    }
    if (!buscarCliente) {
      window.alert('CPF não cadastrado como assinante. Aguarde a busca ou verifique o CPF.'); return;
    }
    if (colsSelecionados.length === 0) {
      window.alert('Selecione ao menos 1 colaborador.'); return;
    }

    setLoadingOS(true);
    try {
      const cols = colaboradores
        .filter(c => colsSelecionados.includes(c._id))
        .map(c => ({ colaboradorId: c._id as any, nome: c.nome, profissao: c.profissao }));

      let dataAgendadaMs: number | undefined;
      if (formOS.dataAgendada.trim()) {
        // aceita DD/MM/AAAA ou AAAA-MM-DD
        let iso = formOS.dataAgendada.trim();
        if (iso.includes('/')) {
          const [dd, mm, aaaa] = iso.split('/');
          iso = `${aaaa}-${mm}-${dd}`;
        }
        const d = new Date(iso);
        if (isNaN(d.getTime())) {
          window.alert('Data inválida. Use DD/MM/AAAA. Ex: 15/06/2025'); return;
        }
        dataAgendadaMs = d.getTime();
      }

      const payload = {
        titulo:        formOS.titulo.trim(),
        descricao:     formOS.descricao.trim(),
        cpfCliente:    cpfClienteQuery,
        colaboradores: cols,
        dataAgendada:  dataAgendadaMs,
        valorEstimado: formOS.valorEstimado ? parseFloat(formOS.valorEstimado) : undefined,
        observacoes:   formOS.observacoes.trim() || undefined,
      };

      console.log('📋 Criando OS com payload:', JSON.stringify(payload, null, 2));

      const resultado = await criarOS(payload);
      console.log('✅ OS criada com ID:', resultado);

      window.alert('✅ Ordem de Serviço criada com sucesso!');
      setModalCriarOS(false);
      setFormOS({ titulo: '', descricao: '', cpfCliente: '', dataAgendada: '', valorEstimado: '', observacoes: '' });
      setColsSelecionados([]);
    } catch (e: any) {
      console.error('❌ Erro ao criar OS:', e);
      window.alert('Erro ao criar OS: ' + (e?.message || JSON.stringify(e) || 'Erro desconhecido'));
    } finally {
      setLoadingOS(false);
    }
  };

  const toggleCol = (id: string) => {
    setColsSelecionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ── Foto colaborador ──────────────────────────────────
  const handleEscolherFoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!r.canceled) setFotoUri(r.assets[0].uri);
  };

  const handleCriarColaborador = async () => {
    if (!formCol.nome || !formCol.profissao || !formCol.descricao) {
      Alert.alert('Preencha todos os campos'); return;
    }
    setLoadingCol(true);
    try {
      const id = await criarColaborador({ ...formCol, foto: '' });
      if (fotoUri) {
        const url = await gerarUploadUrl();
        const res = await fetch(fotoUri);
        const blob = await res.blob();
        const up = await fetch(url, { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob });
        const { storageId } = await up.json();
        await salvarFoto({ colaboradorId: id, storageId });
        setFotoUri('');
      }
      Alert.alert('✅ Colaborador cadastrado!');
      setFormCol({ nome: '', profissao: '', descricao: '' });
    } catch (e: any) { Alert.alert('Erro', e.message); }
    finally { setLoadingCol(false); }
  };

  // ── Tempo decorrido ───────────────────────────────────
  const tempoDecorrido = (data?: number) => {
    if (!data) return '—';
    const diff = Date.now() - data;
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h`;
    return `${Math.floor(diff / 60000)}min`;
  };

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
        {([['os','📋 OS'], ['acionamentos','🔔 Chamados'], ['colaboradores','👷 Equipe']] as const).map(([a, label]) => (
          <TouchableOpacity key={a} style={[styles.aba, aba === a && styles.abaAtiva]} onPress={() => setAba(a)}>
            <Text style={[styles.abaText, aba === a && styles.abaTextAtiva]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ══════════════ ABA OS ══════════════ */}
      {aba === 'os' && (
        <View style={{ padding: 14 }}>
          {/* Botão criar OS */}
          <TouchableOpacity style={styles.btnPrimary} onPress={() => setModalCriarOS(true)}>
            <Text style={styles.btnText}>+ Nova Ordem de Serviço</Text>
          </TouchableOpacity>

          {/* Filtros */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
            {(['agendado','em_andamento','finalizado','cancelado'] as FiltroOS[]).map(f => (
              <TouchableOpacity key={f} style={[styles.filtro, filtroOS === f && styles.filtroAtivo]} onPress={() => setFiltroOS(f)}>
                <Text style={[styles.filtroText, filtroOS === f && { color: '#fff' }]}>
                  {f === 'agendado' ? '📅 Agendados' : f === 'em_andamento' ? '🔧 Em Andamento' : f === 'finalizado' ? '✅ Finalizados' : '❌ Cancelados'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {osLista.length === 0 && <Text style={styles.vazio}>Nenhuma OS nesta categoria.</Text>}

          {osLista.map(os => (
            <View key={os._id} style={styles.osCard}>
              <View style={styles.osHeader}>
                <Text style={styles.osNumero}>{os.numero}</Text>
                <BadgeStatus status={os.status} />
              </View>
              <Text style={styles.osTitulo}>{os.titulo}</Text>
              <Text style={styles.osCliente}>👤 {os.nomeCliente} · 📱 {os.telefoneCliente || '—'}</Text>
              <Text style={styles.osColabs}>
                👷 {os.colaboradores.map(c => c.nome).join(', ')}
              </Text>
              {os.dataAgendada && (
                <Text style={styles.osInfo}>📅 Agendado: {new Date(os.dataAgendada).toLocaleDateString('pt-BR')}</Text>
              )}
              {os.dataInicio && (
                <Text style={styles.osInfo}>⏱ Em andamento há: {tempoDecorrido(os.dataInicio)}</Text>
              )}
              {os.valorEstimado && (
                <Text style={styles.osInfo}>💰 Estimado: R$ {os.valorEstimado.toFixed(2)}</Text>
              )}
              {os.valorFinal && (
                <Text style={styles.osInfo}>💰 Final: R$ {os.valorFinal.toFixed(2)}</Text>
              )}

              {/* Ações */}
              <View style={styles.osAcoes}>
                <TouchableOpacity style={styles.btnVer} onPress={() => setModalVerOS(os)}>
                  <Text style={styles.btnVerText}>Ver detalhes</Text>
                </TouchableOpacity>
                {os.status === 'agendado' && (
                  <TouchableOpacity style={styles.btnIniciar} onPress={() => iniciarOS({ id: os._id })}>
                    <Text style={styles.btnAcaoText}>▶ Iniciar</Text>
                  </TouchableOpacity>
                )}
                {os.status === 'em_andamento' && (
                  <TouchableOpacity style={styles.btnFinalizar} onPress={() => setModalFinalizar(os)}>
                    <Text style={styles.btnAcaoText}>✅ Finalizar</Text>
                  </TouchableOpacity>
                )}
                {(os.status === 'agendado' || os.status === 'em_andamento') && (
                  <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalCancelar(os)}>
                    <Text style={styles.btnAcaoText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ══════════════ ABA ACIONAMENTOS ══════════════ */}
      {aba === 'acionamentos' && (
        <View style={{ padding: 14 }}>
          <Text style={styles.sectionTitle}>Chamados ({acionamentos.length})</Text>
          {acionamentos.length === 0 && <Text style={styles.vazio}>Nenhum chamado ainda.</Text>}
          {acionamentos.map((a, i) => (
            <View key={i} style={styles.acionCard}>
              <View style={styles.osHeader}>
                <View>
                  <Text style={styles.osCliente}>CPF: {a.cpf}</Text>
                  <Text style={styles.osCliente}>📱 {a.telefone}</Text>
                </View>
                <BadgeStatus status={a.status} />
              </View>
              {!a.cadastrado && (
                <View style={styles.avisoCad}>
                  <Text style={styles.avisoCadText}>⚠️ CPF não cadastrado como assinante</Text>
                </View>
              )}
              <Text style={styles.osInfo}>{new Date(a.data).toLocaleString('pt-BR')}</Text>
              {a.status === 'convertido' && (
                <Text style={{ color: '#2a9d8f', fontSize: 12, marginTop: 4 }}>✅ OS criada</Text>
              )}
              {/* Botões de status */}
              {a.status === 'pendente' && (
                <View style={styles.osAcoes}>
                  <TouchableOpacity style={styles.btnIniciar}
                    onPress={() => atualizarStatus({ id: a._id, status: 'visto' })}>
                    <Text style={styles.btnAcaoText}>👁 Marcar Visto</Text>
                  </TouchableOpacity>
                  {a.cadastrado && (
                    <TouchableOpacity style={styles.btnFinalizar}
                      onPress={() => {
                        setFormOS({ ...formOS, cpfCliente: a.cpf });
                        setAba('os');
                        setModalCriarOS(true);
                      }}>
                      <Text style={styles.btnAcaoText}>📋 Criar OS</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              {a.status === 'visto' && a.cadastrado && (
                <TouchableOpacity style={[styles.btnFinalizar, { marginTop: 8 }]}
                  onPress={() => {
                    setFormOS({ ...formOS, cpfCliente: a.cpf });
                    setAba('os');
                    setModalCriarOS(true);
                  }}>
                  <Text style={styles.btnAcaoText}>📋 Criar OS</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* ══════════════ ABA COLABORADORES ══════════════ */}
      {aba === 'colaboradores' && (
        <View style={{ padding: 14 }}>
          <Text style={styles.sectionTitle}>Cadastrar Colaborador</Text>
          <TouchableOpacity style={styles.fotoBotao} onPress={handleEscolherFoto}>
            {fotoUri
              ? <Image source={{ uri: fotoUri }} style={styles.fotoPreview} />
              : <View style={styles.fotoPlaceholder}>
                  <Text style={styles.fotoIcon}>📷</Text>
                  <Text style={styles.fotoBotaoText}>Escolher Foto</Text>
                </View>
            }
          </TouchableOpacity>
          {fotoUri && <TouchableOpacity onPress={() => setFotoUri('')}><Text style={styles.removerFoto}>✕ Remover foto</Text></TouchableOpacity>}
          {[
            { ph: 'Nome completo', key: 'nome' },
            { ph: 'Profissão', key: 'profissao' },
          ].map(f => (
            <TextInput key={f.key} style={styles.input} placeholder={f.ph}
              value={(formCol as any)[f.key]} onChangeText={v => setFormCol({ ...formCol, [f.key]: v })} />
          ))}
          <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Descrição das habilidades..." multiline
            value={formCol.descricao} onChangeText={v => setFormCol({ ...formCol, descricao: v })} />
          <TouchableOpacity style={[styles.btnPrimary, loadingCol && { opacity: 0.6 }]}
            onPress={handleCriarColaborador} disabled={loadingCol}>
            <Text style={styles.btnText}>{loadingCol ? 'Cadastrando...' : '+ Cadastrar'}</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Colaboradores ({colaboradores.length})</Text>
          {colaboradores.map(c => (
            <TouchableOpacity key={c._id} style={styles.colCard}
              onPress={() => router.push(`/colaborador?id=${c._id}`)}>
              <View style={styles.colRow}>
                {c.foto
                  ? <Image source={{ uri: c.foto }} style={styles.colFoto} />
                  : <View style={[styles.colFoto, { backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' }]}><Text>👷</Text></View>
                }
                <View style={{ flex: 1 }}>
                  <Text style={styles.colNome}>{c.nome}</Text>
                  <Text style={styles.colProf}>{c.profissao}</Text>
                  <Estrelas valor={c.estrelas} />
                  <Text style={{ color: '#888', fontSize: 12 }}>{c.totalTrabalhos} trabalhos</Text>
                </View>
              </View>
              <View style={styles.idBox}>
                <Text style={styles.idText}>ID: {c._id}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ══════════ MODAL CRIAR OS ══════════ */}
      <Modal visible={modalCriarOS} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalBox}>
              <Text style={styles.modalTitulo}>📋 Nova Ordem de Serviço</Text>
              <TextInput style={styles.input} placeholder="Título do serviço *"
                value={formOS.titulo} onChangeText={v => setFormOS({ ...formOS, titulo: v })} />
              <TextInput style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Descrição detalhada *" multiline
                value={formOS.descricao} onChangeText={v => setFormOS({ ...formOS, descricao: v })} />
              <TextInput style={styles.input} placeholder="CPF do cliente *" keyboardType="numeric"
                value={formOS.cpfCliente} onChangeText={v => setFormOS({ ...formOS, cpfCliente: v })} />
              {cpfClienteQuery.length === 11 && (
                buscarCliente
                  ? <Text style={styles.clienteOk}>✅ {buscarCliente.nome} – {buscarCliente.endereco}</Text>
                  : buscarCliente === null
                    ? <Text style={styles.clienteErr}>❌ CPF não cadastrado como assinante</Text>
                    : <Text style={{ color: '#888', marginBottom: 8 }}>🔍 Buscando...</Text>
              )}
              <Text style={styles.label}>Data agendada (opcional) — DD/MM/AAAA</Text>
              <TextInput style={styles.input} placeholder="Ex: 15/06/2025"
                value={formOS.dataAgendada} onChangeText={v => setFormOS({ ...formOS, dataAgendada: v })} />
              <TextInput style={styles.input} placeholder="Valor estimado (R$)" keyboardType="numeric"
                value={formOS.valorEstimado} onChangeText={v => setFormOS({ ...formOS, valorEstimado: v })} />
              <TextInput style={styles.input} placeholder="Observações internas"
                value={formOS.observacoes} onChangeText={v => setFormOS({ ...formOS, observacoes: v })} />

              <Text style={styles.label}>Selecionar colaboradores *</Text>
              {colaboradores.map(c => (
                <TouchableOpacity key={c._id} style={[styles.colOpcao, colsSelecionados.includes(c._id) && styles.colOpcaoSel]}
                  onPress={() => toggleCol(c._id)}>
                  <Text style={{ color: colsSelecionados.includes(c._id) ? '#fff' : '#333' }}>
                    {colsSelecionados.includes(c._id) ? '✅ ' : '○ '}{c.nome} – {c.profissao}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={[styles.btnPrimary, { marginTop: 16 }, loadingOS && { opacity: 0.6 }]}
                onPress={handleCriarOS} disabled={loadingOS}>
                <Text style={styles.btnText}>{loadingOS ? 'Criando...' : '✅ Criar OS'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalCriarOS(false)}>
                <Text style={styles.cancelar}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ══════════ MODAL VER OS ══════════ */}
      <Modal visible={!!modalVerOS} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalBox}>
              {modalVerOS && <>
                <Text style={styles.modalTitulo}>{modalVerOS.numero}</Text>
                <BadgeStatus status={modalVerOS.status} />
                <Text style={[styles.label, { marginTop: 12 }]}>Título</Text>
                <Text style={styles.valor}>{modalVerOS.titulo}</Text>
                <Text style={styles.label}>Descrição</Text>
                <Text style={styles.valor}>{modalVerOS.descricao}</Text>
                <Text style={styles.label}>Cliente</Text>
                <Text style={styles.valor}>{modalVerOS.nomeCliente} – {modalVerOS.cpfCliente}</Text>
                <Text style={styles.label}>Telefone</Text>
                <Text style={styles.valor}>{modalVerOS.telefoneCliente || '—'}</Text>
                <Text style={styles.label}>Endereço</Text>
                <Text style={styles.valor}>{modalVerOS.enderecoCliente || '—'}</Text>
                <Text style={styles.label}>Colaboradores</Text>
                <Text style={styles.valor}>{modalVerOS.colaboradores?.map((c: any) => `${c.nome} (${c.profissao})`).join('\n')}</Text>
                {modalVerOS.dataAgendada && <><Text style={styles.label}>Agendado para</Text><Text style={styles.valor}>{new Date(modalVerOS.dataAgendada).toLocaleDateString('pt-BR')}</Text></>}
                {modalVerOS.dataInicio && <><Text style={styles.label}>Iniciado em</Text><Text style={styles.valor}>{new Date(modalVerOS.dataInicio).toLocaleString('pt-BR')}</Text></>}
                {modalVerOS.dataFinalizacao && <><Text style={styles.label}>Finalizado em</Text><Text style={styles.valor}>{new Date(modalVerOS.dataFinalizacao).toLocaleString('pt-BR')}</Text></>}
                {modalVerOS.valorEstimado && <><Text style={styles.label}>Valor estimado</Text><Text style={styles.valor}>R$ {modalVerOS.valorEstimado?.toFixed(2)}</Text></>}
                {modalVerOS.valorFinal && <><Text style={styles.label}>Valor final</Text><Text style={styles.valor}>R$ {modalVerOS.valorFinal?.toFixed(2)}</Text></>}
                {modalVerOS.observacoes && <><Text style={styles.label}>Observações</Text><Text style={styles.valor}>{modalVerOS.observacoes}</Text></>}
                {modalVerOS.motivoCancelamento && <><Text style={styles.label}>Motivo cancelamento</Text><Text style={styles.valor}>{modalVerOS.motivoCancelamento}</Text></>}
              </>}
              <TouchableOpacity style={[styles.btnPrimary, { marginTop: 16 }]} onPress={() => setModalVerOS(null)}>
                <Text style={styles.btnText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ══════════ MODAL FINALIZAR ══════════ */}
      <Modal visible={!!modalFinalizar} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitulo}>✅ Finalizar OS</Text>
            <Text style={styles.label}>{modalFinalizar?.numero} – {modalFinalizar?.titulo}</Text>
            <Text style={[styles.label, { marginTop: 12 }]}>Valor final cobrado (R$) *</Text>
            <TextInput style={styles.input} placeholder="Ex: 150.00" keyboardType="numeric"
              value={valorFinal} onChangeText={setValorFinal} />
            {valorFinal && parseFloat(valorFinal) > 0 && (
              <Text style={styles.tokenPreview}>
                🎁 Tokens para indicador: R$ {(parseFloat(valorFinal) * 0.1).toFixed(2)}
              </Text>
            )}
            <TouchableOpacity style={styles.btnPrimary} onPress={async () => {
              if (!valorFinal) { Alert.alert('Informe o valor final'); return; }
              try {
                await finalizarOS({ id: modalFinalizar._id, valorFinal: parseFloat(valorFinal) });
                Alert.alert('✅ OS finalizada e tokens distribuídos!');
                setModalFinalizar(null); setValorFinal('');
              } catch (e: any) { Alert.alert('Erro', e.message); }
            }}>
              <Text style={styles.btnText}>Confirmar Finalização</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setModalFinalizar(null); setValorFinal(''); }}>
              <Text style={styles.cancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══════════ MODAL CANCELAR ══════════ */}
      <Modal visible={!!modalCancelar} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitulo}>❌ Cancelar OS</Text>
            <Text style={styles.label}>{modalCancelar?.numero} – {modalCancelar?.titulo}</Text>
            <TextInput style={[styles.input, { marginTop: 12 }]} placeholder="Motivo do cancelamento (opcional)"
              value={motivoCancel} onChangeText={setMotivoCancel} />
            <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#e63946' }]} onPress={async () => {
              try {
                await cancelarOS({ id: modalCancelar._id, motivo: motivoCancel || undefined });
                Alert.alert('OS cancelada.');
                setModalCancelar(null); setMotivoCancel('');
              } catch (e: any) { Alert.alert('Erro', e.message); }
            }}>
              <Text style={styles.btnText}>Confirmar Cancelamento</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setModalCancelar(null); setMotivoCancel(''); }}>
              <Text style={styles.cancelar}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f0f0f0' },
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#1a1a2e', minHeight: 500 },
  loginTitle:   { fontSize: 28, fontWeight: 'bold', color: '#f4a261', marginBottom: 8 },
  loginSubtitle:{ color: '#aaa', marginBottom: 32, fontSize: 15 },
  header:       { backgroundColor: '#1a1a2e', padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle:  { color: '#f4a261', fontWeight: 'bold', fontSize: 15 },
  sair:         { color: '#e63946', fontSize: 14, fontWeight: 'bold' },
  abas:         { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  aba:          { flex: 1, padding: 14, alignItems: 'center' },
  abaAtiva:     { borderBottomWidth: 3, borderBottomColor: '#f4a261' },
  abaText:      { color: '#aaa', fontSize: 12, fontWeight: '600' },
  abaTextAtiva: { color: '#f4a261' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 14 },
  input:        { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 14, backgroundColor: '#fafafa' },
  label:        { fontSize: 12, color: '#888', marginBottom: 4 },
  valor:        { fontSize: 14, color: '#1a1a2e', fontWeight: '600', marginBottom: 6 },
  btnPrimary:   { backgroundColor: '#f4a261', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  btnText:      { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  cancelar:     { textAlign: 'center', color: '#888', marginTop: 10, fontSize: 14 },
  // OS
  filtro:       { borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, marginRight: 8, backgroundColor: '#fff' },
  filtroAtivo:  { backgroundColor: '#f4a261', borderColor: '#f4a261' },
  filtroText:   { fontSize: 13, color: '#555' },
  osCard:       { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  osHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  osNumero:     { fontSize: 13, fontWeight: 'bold', color: '#888' },
  osTitulo:     { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 },
  osCliente:    { color: '#555', fontSize: 13 },
  osColabs:     { color: '#888', fontSize: 12, marginTop: 4 },
  osInfo:       { color: '#888', fontSize: 12, marginTop: 4 },
  osAcoes:      { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  btnVer:       { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 },
  btnVerText:   { color: '#555', fontSize: 13 },
  btnIniciar:   { backgroundColor: '#3b82f6', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 },
  btnFinalizar: { backgroundColor: '#2a9d8f', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 },
  btnCancelar:  { backgroundColor: '#e63946', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 },
  btnAcaoText:  { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  badge:        { borderRadius: 10, paddingVertical: 3, paddingHorizontal: 10 },
  badgeText:    { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  // Acionamento
  acionCard:    { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, elevation: 1 },
  avisoCad:     { backgroundColor: '#fff3cd', borderRadius: 6, padding: 8, marginVertical: 6 },
  avisoCadText: { color: '#856404', fontSize: 12 },
  // Colaboradores
  fotoBotao:    { borderWidth: 2, borderColor: '#f4a261', borderStyle: 'dashed', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 8 },
  fotoPlaceholder: { alignItems: 'center' },
  fotoIcon:     { fontSize: 36, marginBottom: 6 },
  fotoBotaoText:{ color: '#f4a261', fontWeight: 'bold' },
  fotoPreview:  { width: 100, height: 100, borderRadius: 50 },
  removerFoto:  { color: '#e63946', textAlign: 'center', marginBottom: 10, fontSize: 13 },
  colCard:      { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10 },
  colRow:       { flexDirection: 'row', gap: 12, alignItems: 'center' },
  colFoto:      { width: 52, height: 52, borderRadius: 26 },
  colNome:      { fontWeight: 'bold', color: '#1a1a2e' },
  colProf:      { color: '#888', fontSize: 13 },
  idBox:        { marginTop: 8, backgroundColor: '#eee', borderRadius: 4, padding: 6 },
  idText:       { fontSize: 11, color: '#555' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalScroll:  { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalBox:     { backgroundColor: '#fff', borderRadius: 16, padding: 22, width: '95%', maxWidth: 480 },
  modalTitulo:  { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 14 },
  clienteOk:    { color: '#2a9d8f', fontWeight: 'bold', marginBottom: 8 },
  clienteErr:   { color: '#e63946', marginBottom: 8 },
  colOpcao:     { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 6 },
  colOpcaoSel:  { backgroundColor: '#f4a261', borderColor: '#f4a261' },
  tokenPreview: { color: '#2a9d8f', fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  vazio:        { color: '#aaa', textAlign: 'center', padding: 20 },
});