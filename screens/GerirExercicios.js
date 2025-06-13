// GerirExercicios.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Checkbox, Card, Button } from 'react-native-paper';
import supabase from '../supabaseconfig';
import Header1 from '../componentes/header1';
import LoadingScreen from './LoadingScreen';

export default function GerirExercicios() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [materias, setMaterias] = useState({});
  const [perguntas, setPerguntas] = useState({});
  const [user, setUser] = useState(null);
  const [selectedDisciplina, setSelectedDisciplina] = useState(null);
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Pega usuário logado
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // 2. Carrega disciplinas do docente e seleciona a primeira automaticamente
  useEffect(() => {
    if (!user) return;

    const fetchDisciplinas = async () => {
      const { data, error } = await supabase
        .from('docente_disciplina')
        .select('iddisciplina')
        .eq('iddocente', user.id);
      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const ids = data.map(d => d.iddisciplina);
      const nomes = await Promise.all(
        ids.map(async id => {
          const { data: d, error: e } = await supabase
            .from('disciplinas')
            .select('nome')
            .eq('iddisciplina', id)
            .single();
          return e ? null : { iddisciplina: id, nome: d.nome };
        })
      );

      const clean = nomes.filter(n => n);
      setDisciplinas(clean);

      if (clean.length > 0) {
        // seleciona a primeira disciplina e dispara fetch de matérias/perguntas
        setSelectedDisciplina(clean[0].iddisciplina);
      } else {
        setLoading(false);
      }
    };

    fetchDisciplinas();
  }, [user]);

  // 3. Carrega matérias e perguntas ao escolher disciplina
  useEffect(() => {
    if (!selectedDisciplina) return;

    setLoading(true);
    setSelectedMateria(null);

    const fetchMateriasPerguntas = async () => {
      try {
        const { data: mat, error: matErr } = await supabase
          .from('materia')
          .select('idmateria, nome')
          .eq('iddisciplina', selectedDisciplina);
        if (matErr) throw matErr;

        const mData = { [selectedDisciplina]: mat || [] };
        const pData = {};

        for (let m of mat || []) {
          const { data: p, error: pErr } = await supabase
            .from('perguntas')
            .select('idpergunta, tipo_pergunta, visivel, texto, enunciado, explicacao, resolucao, data_criacao')
            .eq('idmateria', m.idmateria);
          if (pErr) console.error(pErr);
          else pData[m.idmateria] = p;
        }

        setMaterias(mData);
        setPerguntas(pData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchMateriasPerguntas();
  }, [selectedDisciplina]);

  // 4. Alterna visibilidade da pergunta
  const toggleVisibilidade = async (id, visivel) => {
    const { error } = await supabase
      .from('perguntas')
      .update({ visivel })
      .eq('idpergunta', id);
    if (error) console.error(error);
    else {
      setPerguntas(prev => ({
        ...prev,
        [selectedMateria]: prev[selectedMateria].map(p =>
          p.idpergunta === id ? { ...p, visivel } : p
        )
      }));
    }
  };

  // Mostra tela de loading enquanto carrega
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.flex}>
      <Header1 title="Gerir Exercícios" />

      <ScrollView contentContainerStyle={styles.container}>
        {/* instruções iniciais */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Pode gerir os seus exercícios aqui!</Text>
        </View>

        {/* seleção de disciplina */}
        <View style={[styles.selectionContainer, { backgroundColor: '#a8d8f2' }]}>
          <Text style={styles.selectionTitle}>Disciplina</Text>
          <View style={styles.buttonsContainer}>
            {disciplinas.map(d => (
              <Button
                key={d.iddisciplina}
                mode={d.iddisciplina === selectedDisciplina ? 'contained' : 'outlined'}
                onPress={() => setSelectedDisciplina(d.iddisciplina)}
                style={styles.button}
              >
                {d.nome}
              </Button>
            ))}
          </View>
        </View>

        {/* seleção de matéria */}
        {materias[selectedDisciplina]?.length > 0 && (
          <View style={[styles.selectionContainer, { backgroundColor: '#f2d8a8' }]}>
            <Text style={styles.selectionTitle}>Matéria</Text>
            <View style={styles.buttonsContainer}>
              {materias[selectedDisciplina].map(m => (
                <Button
                  key={m.idmateria}
                  mode={m.idmateria === selectedMateria ? 'contained' : 'outlined'}
                  onPress={() => setSelectedMateria(m.idmateria)}
                  style={styles.button}
                >
                  {m.nome}
                </Button>
              ))}
            </View>
          </View>
        )}

        {/* listagem de perguntas */}
        {selectedMateria && perguntas[selectedMateria]?.map(p => (
          <Card key={p.idpergunta} style={styles.card}>
            <Card.Content>
              <Checkbox
                status={p.visivel ? 'checked' : 'unchecked'}
                onPress={() => toggleVisibilidade(p.idpergunta, !p.visivel)}
              />
              <Text style={styles.perguntaType}>
                {p.tipo_pergunta === 'desenvolvimento' ? 'Desenvolvimento' : 'Múltipla'}
              </Text>
              <Text style={styles.perguntaText}>
                <Text style={styles.bold}>Enunciado: </Text>
                {p.texto || p.enunciado}
              </Text>
              {(p.explicacao || p.resolucao) && (
                <Text style={styles.perguntaText}>
                  <Text style={styles.bold}>Explicação: </Text>
                  {p.explicacao || p.resolucao}
                </Text>
              )}
              <Text style={styles.date}>
                <Text style={styles.bold}>Criado em: </Text>
                {new Date(p.data_criacao).toLocaleDateString()}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  container: {
    padding: 20,
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  selectionContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  button: {
    margin: 4,
  },
  card: {
    marginBottom: 12,
  },
  perguntaType: {
    fontSize: 16,
    fontWeight: '600',
  },
  perguntaText: {
    marginTop: 6,
    fontSize: 14,
  },
  bold: {
    fontWeight: 'bold',
  },
  date: {
    marginTop: 4,
    fontSize: 12,
    color: '#555',
  },
});
