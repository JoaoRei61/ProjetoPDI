import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Button, Text } from "react-native-paper";
import { useAuth } from "../context/AuthProvider";
import Header from "../componentes/header";
import Slider from "@react-native-community/slider";

export default function TestesScreen({ route, navigation }) {
  const { supabase, user, loading } = useAuth();

  // Se vier disciplina do param, podes usá-la diretamente
  const { disciplinaPreSelecionada } = route.params || {};

  // Se disciplinaPreSelecionada existe, assumimos "anoSelecionado" e "semestreSelecionado"
  // e "disciplinaSelecionada"
  // Caso não exista, fallback para lógica manual
  const [anoSelecionado, setAnoSelecionado] = useState(
    disciplinaPreSelecionada ? disciplinaPreSelecionada.ano : null
  );
  const [semestreSelecionado, setSemestreSelecionado] = useState(
    disciplinaPreSelecionada ? disciplinaPreSelecionada.semestre : null
  );

  const [disciplinas, setDisciplinas] = useState([]);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(
    disciplinaPreSelecionada || null
  );

  // Matérias
  const [materias, setMaterias] = useState([]);
  const [materiasSelecionadas, setMateriasSelecionadas] = useState([]);

  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [numPerguntas, setNumPerguntas] = useState(5);
  const [maxPerguntasDisponiveis, setMaxPerguntasDisponiveis] = useState(50);

  // Validar user
  useEffect(() => {
    if (!user && !loading) {
      Alert.alert("Sessão Expirada", "Por favor, faça login novamente.", [
        { text: "OK", onPress: () => navigation.replace("Login") },
      ]);
      return;
    }
    setLoadingData(false);
  }, [user]);

  // Se disciplinaPreSelecionada existe, buscar matérias de cara
  useEffect(() => {
    if (disciplinaPreSelecionada) {
      fetchMaterias(disciplinaPreSelecionada.iddisciplina);
    }
  }, [disciplinaPreSelecionada]);

  // Função para buscar Disciplinas se não tiver preSelecionada
  const carregarDisciplinas = async (ano, semestre) => {
    try {
      setLoadingData(true);
      setDisciplinaSelecionada(null);
      setMaterias([]);
      setMateriasSelecionadas([]);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("disciplinas")
        .select("*")
        .eq("idcurso", user?.user_metadata?.idcurso)
        .eq("ano", ano)
        .eq("semestre", semestre);

      if (error) {
        console.error("Erro ao buscar disciplinas:", error);
        setErrorMessage("Erro ao carregar disciplinas.");
      } else {
        if (!data || data.length === 0) {
          setErrorMessage("Sem disciplinas para este ano e semestre.");
          setDisciplinas([]);
        } else {
          setDisciplinas(data);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar disciplinas:", err);
      setErrorMessage("Erro ao carregar disciplinas.");
    } finally {
      setLoadingData(false);
    }
  };

  // Buscar matérias
  const fetchMaterias = async (iddisciplina) => {
    try {
      setLoadingData(true);
      setErrorMessage("");
      setMaterias([]);
      setMateriasSelecionadas([]);
      const { data, error } = await supabase
        .from("materias")
        .select("*")
        .eq("iddisciplina", iddisciplina);

      if (error) {
        console.error("Erro ao buscar matérias:", error);
        setErrorMessage("Erro ao carregar as matérias.");
      } else {
        if (!data || data.length === 0) {
          setErrorMessage("Não há matérias disponíveis para esta disciplina.");
        } else {
          setMaterias(data);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar matérias:", err);
      setErrorMessage("Erro ao carregar as matérias.");
    } finally {
      setLoadingData(false);
    }
  };

  // Selecionar Ano
  const selecionarAno = (ano) => {
    setAnoSelecionado(ano);
    setSemestreSelecionado(null);
    setDisciplinas([]);
    setDisciplinaSelecionada(null);
    setMaterias([]);
    setMateriasSelecionadas([]);
  };

  // Selecionar Semestre
  const selecionarSemestre = (sem) => {
    setSemestreSelecionado(sem);
    if (anoSelecionado) {
      carregarDisciplinas(anoSelecionado, sem);
    }
  };

  // Selecionar Disciplina
  const selecionarDisciplina = (disc) => {
    setDisciplinaSelecionada(disc);
    fetchMaterias(disc.iddisciplina);
  };

  // Toggle matérias
  const toggleMateriaSelecionada = (idmateria) => {
    let novasSelecionadas;
    if (materiasSelecionadas.includes(idmateria)) {
      novasSelecionadas = materiasSelecionadas.filter((id) => id !== idmateria);
    } else {
      novasSelecionadas = [...materiasSelecionadas, idmateria];
    }
    setMateriasSelecionadas(novasSelecionadas);
  };

  // Recalcular perguntas disponíveis sempre que matériasSelecionadas mudar
  useEffect(() => {
    const fetchPerguntasDisponiveis = async () => {
      try {
        if (materiasSelecionadas.length === 0) {
          setMaxPerguntasDisponiveis(0);
          if (numPerguntas > 0) setNumPerguntas(0);
          return;
        }
        const { data: perguntasData, error: perguntasError } = await supabase
          .from("perguntas")
          .select("idpergunta")
          .in("idmateria", materiasSelecionadas);

        if (perguntasError) {
          console.error("Erro ao verificar perguntas disponíveis:", perguntasError);
          return;
        }
        const totalPerguntas = perguntasData?.length || 0;
        setMaxPerguntasDisponiveis(totalPerguntas > 0 ? totalPerguntas : 1);
        if (numPerguntas > totalPerguntas) {
          setNumPerguntas(totalPerguntas);
        }
      } catch (e) {
        console.error("Erro inesperado ao buscar perguntas disponíveis:", e);
      }
    };
    fetchPerguntasDisponiveis();
  }, [materiasSelecionadas]);

  // Iniciar Teste
  const iniciarTeste = () => {
    if (!disciplinaSelecionada) {
      Alert.alert("Selecione uma disciplina primeiro!");
      return;
    }
    if (materiasSelecionadas.length === 0) {
      Alert.alert("Selecione pelo menos uma matéria!");
      return;
    }

    // Aqui passamos o iddisciplina da disciplinaSelecionada
    navigation.navigate("QuizPerguntasScreen", {
      selectedMaterias: materiasSelecionadas,
      numPerguntas: parseInt(numPerguntas, 10),
      // Passamos iddisciplina caso seja armazenado no quiz
      iddisciplina: disciplinaSelecionada.iddisciplina,
    });
  };

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          Seleciona o ano, semestre, disciplina e matéria para o teste
        </Text>

        {loadingData && (
          <ActivityIndicator size="large" color="#0056b3" style={styles.loader} />
        )}
        {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}

        {/* Se nao veio disciplinaPreSelecionada, mostramos a escolha manual */}
        {!disciplinaPreSelecionada && (
          <>
            {/* PASSO 1: Escolher Ano */}
            <Text style={styles.subtitle}>1) Escolha o Ano</Text>
            <View style={styles.anoContainer}>
              {[1, 2, 3].map((ano) => (
                <TouchableOpacity
                  key={`ano-${ano}`}
                  style={[
                    styles.anoButton,
                    anoSelecionado === ano && styles.anoSelecionado,
                  ]}
                  onPress={() => selecionarAno(ano)}
                >
                  <Text style={styles.anoTexto}>{ano}º</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* PASSO 2: Escolher Semestre */}
            {anoSelecionado && (
              <>
                <Text style={styles.subtitle}>2) Escolha o Semestre</Text>
                <View style={styles.semestreContainer}>
                  {[1, 2].map((sem) => (
                    <TouchableOpacity
                      key={`sem-${sem}`}
                      style={[
                        styles.semestreButton,
                        semestreSelecionado === sem && styles.semestreSelecionado,
                      ]}
                      onPress={() => selecionarSemestre(sem)}
                    >
                      <Text style={styles.semestreTexto}>{sem}º Semestre</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* PASSO 3: Escolher Disciplina */}
            {semestreSelecionado && (
              <>
                <Text style={styles.subtitle}>3) Escolha a Disciplina</Text>
                <View style={styles.disciplinasContainer}>
                  {disciplinas.map((disc) => {
                    const sel = disciplinaSelecionada?.iddisciplina === disc.iddisciplina;
                    return (
                      <TouchableOpacity
                        key={`disc-${disc.iddisciplina}`}
                        style={[
                          styles.disciplinaButton,
                          sel && styles.disciplinaSelecionada,
                        ]}
                        onPress={() => selecionarDisciplina(disc)}
                      >
                        <Text style={styles.disciplinaButtonText}>{disc.nome}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}

        {/* Se temos disciplina selecionada, seja via preSelecao ou manual */}
        {disciplinaSelecionada && (
          <View style={styles.selectedDiscContainer}>
            <Text style={styles.selectedDiscText}>
              Disciplina Selecionada: {disciplinaSelecionada.nome}
            </Text>
          </View>
        )}

        {/* LISTA DE MATÉRIAS */}
        {disciplinaSelecionada && (
          <>
            <Text style={styles.subtitle}>4) Escolha a(s) matéria(s)</Text>
            {materias.map((materia) => {
              const sel = materiasSelecionadas.includes(materia.idmateria);
              return (
                <TouchableOpacity
                  key={`mat-${materia.idmateria}`}
                  style={[styles.materiaButton, sel && styles.materiaSelecionada]}
                  onPress={() => toggleMateriaSelecionada(materia.idmateria)}
                >
                  <Text style={[styles.materiaText, sel && styles.materiaTextSelecionada]}>
                    {materia.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {materiasSelecionadas.length > 0 && (
              <Text style={styles.disponiveisText}>
                Perguntas disponíveis: {maxPerguntasDisponiveis}
              </Text>
            )}

            <Text style={styles.sliderLabel}>Número de Perguntas: {numPerguntas}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={maxPerguntasDisponiveis}
              step={1}
              value={numPerguntas}
              onValueChange={(value) => setNumPerguntas(value)}
              minimumTrackTintColor="#0056b3"
              maximumTrackTintColor="#ccc"
              thumbTintColor="#0056b3"
            />
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button mode="contained" onPress={iniciarTeste} style={styles.iniciarBotao}>
          Iniciar Teste
        </Button>
      </View>
    </View>
  );
}

// ==================== Estilos ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  content: {
    padding: 16,
    alignItems: "center",
  },
  loader: {
    marginTop: 20,
  },
  errorMessage: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 25,
    marginBottom: 10,
    color: "#333",
    alignSelf: "flex-start",
    marginLeft: 15,
  },
  anoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  anoButton: {
    backgroundColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 10,
  },
  anoSelecionado: {
    backgroundColor: "#0056b3",
  },
  anoTexto: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  semestreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  semestreButton: {
    backgroundColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 10,
  },
  semestreSelecionado: {
    backgroundColor: "#0056b3",
  },
  semestreTexto: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  disciplinasContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 15,
  },
  disciplinaButton: {
    backgroundColor: "#fff",
    borderColor: "#0056b3",
    borderWidth: 2,
    borderRadius: 8,
    padding: 10,
    margin: 5,
  },
  disciplinaSelecionada: {
    borderColor: "#d32f2f",
  },
  disciplinaButtonText: {
    color: "#0056b3",
    fontWeight: "bold",
    fontSize: 15,
  },
  selectedDiscContainer: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#d32f2f",
  },
  selectedDiscText: {
    fontSize: 16,
    color: "#d32f2f",
    fontWeight: "600",
  },
  materiaButton: {
    width: "90%",
    padding: 15,
    borderWidth: 2,
    borderColor: "#0056b3",
    borderRadius: 8,
    marginBottom: 15,
    alignItems: "center",
    backgroundColor: "#0056b3",
  },
  materiaSelecionada: {
    backgroundColor: "#0056b3",
    borderColor: "#d32f2f",
  },
  materiaText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
  },
  materiaTextSelecionada: {
    color: "#fff",
  },
  disponiveisText: {
    fontSize: 14,
    color: "#333",
    marginVertical: 10,
    textAlign: "center",
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0056b3",
    marginTop: 20,
    textAlign: "center",
  },
  slider: {
    width: "90%",
    marginVertical: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    alignItems: "center",
  },
  iniciarBotao: {
    backgroundColor: "#0056b3",
    padding: 10,
    borderRadius: 8,
    width: "90%",
  },
});
