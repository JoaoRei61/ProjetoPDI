// componentes/GerirConteudos.js

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Caption } from 'react-native-paper';
import Header1 from '../componentes/header1';
import { useAuth } from '../context/AuthProvider';
import { useNavigation } from '@react-navigation/native';
import supabase from '../supabaseconfig';

export default function GerirConteudos() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [resumos, setResumos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mostrar pendentes e filtros
  const [showPendentes, setShowPendentes] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [filtroDisciplina, setFiltroDisciplina] = useState('Todas');
  const [filtroData, setFiltroData] = useState('Todas');
  const [disciplinasDocente, setDisciplinasDocente] = useState([]);

  // Formatar data
  const formatDate = iso => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-PT') + ' ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  };

  // Carregar disciplinas do docente
  const fetchDisciplinasDocente = async () => {
    const { data, error } = await supabase
      .from('docente_disciplina')
      .select('iddisciplina')
      .eq('iddocente', user.id);
    if (!error) {
      const ids = data.map(d => d.iddisciplina);
      const { data: disci, error: err2 } = await supabase
        .from('disciplinas')
        .select('nome')
        .in('iddisciplina', ids);
      if (!err2) setDisciplinasDocente(['Todas', ...disci.map(d => d.nome)]);
    }
  };

  // Carregar resumos
  const fetchResumos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('resumos')
      .select('*, disciplina:disciplinas(nome)')
      .eq('idutilizador', user.id)
      .order('data_envio', { ascending: false });
    if (error) Alert.alert('Erro', 'Não foi possível carregar os resumos.');
    else setResumos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDisciplinasDocente();
    fetchResumos();
  }, []);

  // Atualizar estado
  const atualizarEstado = async (item, novoEstado) => {
    const { error } = await supabase
      .from('resumos')
      .update({ estado: novoEstado })
      .eq('idresumo', item.idresumo);
    if (error) Alert.alert('Erro', 'Não foi possível atualizar o estado.');
    else setResumos(prev => prev.map(r => r.idresumo === item.idresumo ? { ...r, estado: novoEstado } : r));
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Title
        title={item.titulo}
        subtitle={formatDate(item.data_envio)}
        titleStyle={styles.cardTitle}
        subtitleStyle={styles.cardSubtitle}
      />
      <Card.Content>
        <Caption style={styles.disciplina}>Disciplina: {item.disciplina?.nome || '—'}</Caption>
      </Card.Content>
      <Card.Actions style={styles.actions}>
        {item.estado === 'pendente' ? (
          <View style={styles.actionsRow}>
            <Button mode="contained" onPress={() => atualizarEstado(item, 'aprovado')}>
              Aprovar
            </Button>
            <Button mode="outlined" onPress={() => atualizarEstado(item, null)} style={styles.rejectButton}>
              Recusar
            </Button>
          </View>
        ) : (
          <>          
            <Button
              mode={item.estado === 'aprovado' ? 'contained' : 'outlined'}
              onPress={() => atualizarEstado(item, item.estado === 'aprovado' ? null : 'aprovado')}
            >
              {item.estado === 'aprovado' ? 'Desaprovar' : 'Aprovar'}
            </Button>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('PDFViewer', { pdfUrl: item.ficheiro })}
              style={styles.pdfButton}
            >
              Ver PDF
            </Button>
          </>
        )}
      </Card.Actions>
    </Card>
  );

  if (loading) return (
    <View style={styles.loader}><ActivityIndicator animating size="large" /></View>
  );

  // Filtrar por estado
  const pendentes = resumos.filter(r => r.estado === 'pendente');
  const aprovados = resumos.filter(r => r.estado === 'aprovado');
  const ocultos = resumos.filter(r => r.estado === null);

  // Função de filtro adicional
  const now = new Date();
  const filtrarLista = lista => lista
    .filter(r => filtroDisciplina === 'Todas' || r.disciplina?.nome === filtroDisciplina)
    .filter(r => {
      if (filtroData === 'Todas') return true;
      const diff = now - new Date(r.data_envio);
      if (filtroData === '24h') return diff <= 24*60*60*1000;
      if (filtroData === 'Semana') return diff <= 7*24*60*60*1000;
      if (filtroData === 'Mês') return diff <= 30*24*60*60*1000;
      return true;
    });

  return (
    <View style={styles.flex}>
      <Header1 title="Gerir Conteúdos" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.welcome}>Pode gerir os seus conteúdos aqui!</Text>

        {/* Botão de filtros */}
        <Button mode="outlined" onPress={() => setShowFilters(f => !f)} style={styles.filterToggle}>
          Filtros
        </Button>

        {/* Painel de Filtros */}
        {showFilters && (
          <View style={styles.filtersPanel}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {disciplinasDocente.map(d => (
                <Button
                  key={d}
                  mode={filtroDisciplina === d ? 'contained' : 'outlined'}
                  onPress={() => setFiltroDisciplina(d)}
                  style={styles.filterButton}
                >{d}</Button>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {['Todas','24h','Semana','Mês'].map(val => (
                <Button
                  key={val}
                  mode={filtroData === val ? 'contained' : 'outlined'}
                  onPress={() => setFiltroData(val)}
                  style={styles.filterButton}
                >
                  {val === '24h' ? 'Últimas 24h' : val === 'Semana' ? 'Última Semana' : val === 'Mês' ? 'Último Mês' : 'Todas as Datas'}
                </Button>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Seção Pendentes */}
        <Button mode="outlined" onPress={() => setShowPendentes(p => !p)} style={styles.toggleButton}>
          Resumos Pendentes ({pendentes.length})
        </Button>
        {showPendentes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumos Pendentes</Text>
            <FlatList
              data={filtrarLista(pendentes)}
              keyExtractor={i => i.idresumo.toString()}
              renderItem={renderItem}
            />
          </View>
        )}

        {/* Seção Aprovados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumos Visíveis</Text>
          {filtrarLista(aprovados).length === 0 ? (
            resumos.length === 0 || (filtrarLista(ocultos).length === 0 && filtrarLista(pendentes).length === 0) ? (
              <Text style={styles.noResumosText}>Esta disciplina não tem resumos.</Text>
            ) : (
              <Text style={styles.noResumosText}>Não há resumos disponíveis de momento.</Text>
            )
          ) : (
            <FlatList
              data={filtrarLista(aprovados)}
              keyExtractor={i => i.idresumo.toString()}
              renderItem={renderItem}
            />
          )}
        </View>


        {/* Seção Ocultos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumos Ocultos</Text>
            {filtrarLista(ocultos).length === 0 ? (
              <Text style={styles.noResumosText}>Não há resumos ocultos.</Text>
            ) : (
              <FlatList
                data={filtrarLista(ocultos)}
                keyExtractor={i => i.idresumo.toString()}
                renderItem={renderItem}
              />
            )}
          </View>


      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  noResumosText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
    color: '#607d8b',
    fontStyle: 'italic',
  },
  welcome: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1a237e',
    textAlign: 'center',
    marginVertical: 30,
  },
  flex: { flex: 1, backgroundColor: '#f0f2f5' },
  container: { padding: 16 },
  introText: { fontSize: 18, fontWeight: '500', marginBottom: 12 },
  filterButton: {
    marginRight: 8,
    borderRadius: 12,
    borderColor: '#0056b3',
  },
  filtersPanel: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 3,
  },

  filterScroll: { marginBottom: 8 },
  filterButton: { marginRight: 8 },
  toggleButton: { marginVertical: 12, alignSelf: 'flex-start' },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0056b3',
    marginBottom: 12,
    marginLeft: 6
  },

  card: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 5,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    paddingBottom: 8
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#0d47a1',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#607d8b',
  },

  disciplina: { marginTop: 4, fontSize: 13, color: '#555' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  pdfButton: {
    backgroundColor: '#0056b3',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginLeft: 10,
  },
  rejectButton: {
    borderColor: '#e53935',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
  },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
