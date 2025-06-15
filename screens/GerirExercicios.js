// GerirExercicios.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { Checkbox, Card, Button } from 'react-native-paper';
import supabase from '../supabaseconfig';
import Header1 from '../componentes/header1';
import LoadingScreen from './LoadingScreen';
import { useNavigation } from '@react-navigation/native';

export default function GerirExercicios() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [materias, setMaterias] = useState({});
  const [perguntas, setPerguntas] = useState({});
  const [user, setUser] = useState(null);
  const [selectedDisciplina, setSelectedDisciplina] = useState(null);
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

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
        setSelectedDisciplina(clean[0].iddisciplina);
      } else {
        setLoading(false);
      }
    };

    fetchDisciplinas();
  }, [user]);

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

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.flex}>
      <Header1 title="Gerir Exercícios" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.welcome}>Pode gerir os seus exercícios aqui!</Text>
        </View>

        <View style={styles.selectionContainer}>
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

        {materias[selectedDisciplina]?.length > 0 ? (
          <View style={styles.selectionContainer}>
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
        ) : (
          <Text style={styles.alertText}>
           Sem matérias para esta disciplina, Aceda à versão web para adicionar matérias.
          </Text>
        )}

        {selectedMateria && (
          perguntas[selectedMateria]?.length > 0 ? (
            perguntas[selectedMateria].map(p => (
              <Card key={p.idpergunta} style={styles.card}>
                <Card.Content>
                  <View style={styles.checkboxContainer}>
                    <View style={styles.checkboxWrapper}>
                      <Checkbox
                        status={p.visivel ? 'checked' : 'unchecked'}
                        onPress={() => toggleVisibilidade(p.idpergunta, !p.visivel)}
                        color="#0056b3"
                        uncheckedColor="#607d8b"
                      />
                    </View>
                    <Text style={styles.checkboxLabel}>Exercício Visível</Text>
                  </View>

                 <Text style={styles.perguntaType}>
                    Tipo de pergunta: <Text style={{ color: "rgb(28, 19, 156)" }}>
                      {p.tipo_pergunta === 'EM' ? 'Escolha Múltipla' : 'Desenvolvimento'}
                    </Text>
                  </Text>



                  {p.texto ? (
                    <Text style={styles.perguntaText}>
                      <Text style={styles.bold}>Enunciado: </Text>
                      {p.texto}
                    </Text>
                  ) : p.enunciado && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={styles.bold}>Enunciado:</Text>
                      {p.enunciado.endsWith('.pdf') ? (
                        <Button
                          mode="contained"
                          onPress={() => navigation.navigate('PDFViewer', { pdfUrl: p.enunciado })}
                          style={{ marginTop: 6, width: 160 }}
                        >
                          Ver PDF
                        </Button>
                      ) : (
                        <View style={{ marginTop: 6, alignItems: 'center' }}>
                          <Image
                            source={{ uri: p.enunciado }}
                            style={{width: 250, height: 250, resizeMode: 'contain', borderRadius: 12, borderWidth: 1, borderColor: '#ddd',}}
                          />
                        </View>
                      )}
                    </View>
                  )}

                  {p.explicacao && (
                    <Text style={styles.perguntaText}>
                      <Text style={styles.bold}>Explicação: </Text>
                      {p.explicacao}
                    </Text>
                  )}

                  {p.resolucao && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={styles.bold}>Resolução:</Text>
                      {p.resolucao.endsWith('.pdf') ? (
                        <Button
                          mode="contained"
                          onPress={() => navigation.navigate('PDFViewer', { pdfUrl: p.resolucao })}
                          style={{ marginTop: 6, width: 160 }}
                        >
                          Ver PDF
                        </Button>
                      ) : (
                        <View style={{ marginTop: 6, alignItems: 'center' }}>
                          <Image
                            source={{ uri: p.resolucao }}
                            style={{ width: 250, height: 250, resizeMode: 'contain', borderRadius: 8 }}
                          />
                        </View>
                      )}
                    </View>
                  )}

                  <Text style={styles.date}>
                    <Text style={styles.bold}>Criado em: </Text>
                    {new Date(p.data_criacao).toLocaleDateString()}
                  </Text>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Text style={styles.alertText}>
              Sem exercícios para esta matéria, aceda à versão web para adicionar exercícios.
            </Text>
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#f4f9ff',
  },
  container: {
    padding: 20,
  },
  headerContainer: {
    marginBottom: 20,
  },
  welcome: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1a237e',
    textAlign: 'center',
    marginVertical: 30,
  },
  selectionContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#0056b3',
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#0056b3',
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  button: {
    margin: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0056b3',
  },
    card: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccdff5',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  perguntaType: {
    fontSize: 16,
    fontWeight: '600',
    color:"rgb(0,0,0)",
    marginBottom: 6,
  },
  perguntaText: {
    marginTop: 6,
    fontSize: 14,
    color: '#333',
  },
  bold: {
    fontWeight: 'bold',
    color: '#000',
  },
  date: {
    marginTop: 8,
    fontSize: 12,
    color: '#777',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#0056b3',
    marginLeft: 8,
  },
 checkboxWrapper: {
  width: 40,                 // menor largura
  height: 40,                // menor altura
  borderWidth: 2,
  borderColor: '#0056b3',    // azul
  borderRadius: 6,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 8,
},

  alertText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#607d8b',
    paddingVertical: 24,
    textAlign: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 20,
  },
});
