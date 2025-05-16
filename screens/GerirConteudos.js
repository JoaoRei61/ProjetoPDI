import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, Checkbox, Button, ActivityIndicator, Caption } from 'react-native-paper';
import { useAuth } from '../context/AuthProvider';
import { useNavigation } from '@react-navigation/native';

export default function GerirConteudos() {
  const { user, supabase } = useAuth();
  const navigation = useNavigation();
  const [resumos, setResumos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formata data ISO para 'DD/MM/YYYY HH:mm'
  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString().slice(0,5);
  };

  // Busca resumos e nome de disciplina via join
  const fetchResumos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('resumos')
      .select('*, disciplina:disciplinas(nome)')
      .eq('idutilizador', user.id)
      .order('data_envio', { ascending: false });
    if (error) {
      Alert.alert('Erro', 'Não foi possível carregar os resumos.');
    } else {
      setResumos(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchResumos(); }, []);

  // Alterna estado entre 'aprovado' e null
  const toggleAprovacao = async (item) => {
    const novoEstado = item.estado === 'aprovado' ? null : 'aprovado';
    const { error } = await supabase
      .from('resumos')
      .update({ estado: novoEstado })
      .eq('idresumo', item.idresumo);
    if (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o estado.');
    } else {
      setResumos(prev => prev.map(r => r.idresumo === item.idresumo ? { ...r, estado: novoEstado } : r));
    }
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
        <Caption style={styles.estado}>Estado: <Text style={[styles.estadoText, item.estado === 'aprovado' ? styles.aprovado : styles.pendente]}>{item.estado || 'pendente'}</Text></Caption>
      </Card.Content>
      <Card.Actions style={styles.actions}>
        <View style={styles.checkboxContainer}>
          <Checkbox
            status={item.estado === 'aprovado' ? 'checked' : 'unchecked'}
            onPress={() => toggleAprovacao(item)}
            color="#4caf50"
            uncheckedColor="#d32f2f"
          />
          <Text style={styles.checkboxLabel}>Aprovar</Text>
        </View>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('PDFViewer', { pdfUrl: item.ficheiro })}
          style={styles.pdfButton}
          contentStyle={styles.pdfButtonContent}
          labelStyle={styles.pdfButtonLabel}
        >Ver PDF</Button>
      </Card.Actions>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator animating size="large" color="#6200ea" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={resumos}
        keyExtractor={item => item.idresumo.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum resumo encontrado.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  list: { padding: 16 },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    backgroundColor: '#fff'
  },
  cardTitle: { fontWeight: 'bold', fontSize: 18, color: '#333' },
  cardSubtitle: { fontSize: 14, color: '#666' },
  disciplina: { marginTop: 4, fontSize: 13, color: '#555' },
  estado: { marginTop: 2 },
  estadoText: { fontWeight: 'bold' },
  aprovado: { color: '#4caf50' },
  pendente: { color: '#d32f2f' },
  actions: { justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center' },
  checkboxLabel: { marginLeft: 4, fontSize: 14, color: '#333' },
  pdfButton: { backgroundColor: '#6200ea', borderRadius: 6 },
  pdfButtonContent: { paddingHorizontal: 12, paddingVertical: 6 },
  pdfButtonLabel: { color: '#fff', fontWeight: 'bold' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888' }
});