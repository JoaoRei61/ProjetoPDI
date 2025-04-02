import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Text,
} from "react-native";
import { Button } from "react-native-paper";
import { useAuth } from "../context/AuthProvider";
import Header from "../componentes/header";

export default function ExerciciosScreen({ route, navigation }) {
  const { supabase, user, loading } = useAuth();

  // Se vier disciplina do param, podemos usá-la diretamente
  const { disciplinaPreSelecionada } = route.params || {};

  // Se já temos disciplinaPreSelecionada, assumimos "anoSelecionado" e "semestreSelecionado"
  // e a própria "disciplinaSelecionada".
  // Caso não exista, deixamos a lógica manual para o usuário.
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

  // Lógica de matérias
  const [materias, setMaterias] = useState([]);
  const [materiasSelecionadas, setMateriasSelecionadas] = useState([]);

  // Controle de loading/erro
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // ----------------------------------------------------------------------------
  // 1) Validação inicial de user e, se houver disciplinaPreSelecionada, buscar matérias.
  // ----------------------------------------------------------------------------
  useEffect(() => {
    if (!user && !loading) {
      Alert.alert("Sessão Expirada", "Por favor, faça login novamente.", [
        { text: "OK", onPress: () => navigation.replace("Login") },
      ]);
      return;
    }
    setLoadingData(false);
  }, [user]);

  useEffect(() => {
    if (disciplinaPreSelecionada) {
      fetchMaterias(disciplinaPreSelecionada.iddisciplina);
    }
  }, [disciplinaPreSelecionada]);

  // ----------------------------------------------------------------------------
  // 2) Buscar disciplinas (caso não tenhamos preSeleção)
  // ----------------------------------------------------------------------------
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

  // ----------------------------------------------------------------------------
  // 3) Buscar matérias ao selecionar disciplina
  // ----------------------------------------------------------------------------
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
      } else if (!data || data.length === 0) {
        setErrorMessage("Não há matérias disponíveis para esta disciplina.");
      } else {
        setMaterias(data);
      }
    } catch (err) {
      console.error("Erro ao carregar matérias:", err);
      setErrorMessage("Erro ao carregar as matérias.");
    } finally {
      setLoadingData(false);
    }
  };

  // ----------------------------------------------------------------------------
  // 4) Seleções manuais de ano, semestre e disciplina
  // ----------------------------------------------------------------------------
  const selecionarAno = (ano) => {
    setAnoSelecionado(ano);
    setSemestreSelecionado(null);
    setDisciplinas([]);
    setDisciplinaSelecionada(null);
    setMaterias([]);
    setMateriasSelecionadas([]);
  };

  const selecionarSemestre = (sem) => {
    setSemestreSelecionado(sem);
    if (anoSelecionado) {
      carregarDisciplinas(anoSelecionado, sem);
    }
  };

  const selecionarDisciplina = (disc) => {
    setDisciplinaSelecionada(disc);
    fetchMaterias(disc.iddisciplina);
  };

  const toggleMateriaSelecionada = (idmateria) => {
    let novasSelecionadas;
    if (materiasSelecionadas.includes(idmateria)) {
      novasSelecionadas = materiasSelecionadas.filter((id) => id !== idmateria);
    } else {
      novasSelecionadas = [...materiasSelecionadas, idmateria];
    }
    setMateriasSelecionadas(novasSelecionadas);
  };

  // ----------------------------------------------------------------------------
  // 5) Iniciar Teste
  // ----------------------------------------------------------------------------
  const iniciarTeste = () => {
    if (!disciplinaSelecionada) {
      Alert.alert("Selecione uma disciplina primeiro!");
      return;
    }
    if (materiasSelecionadas.length === 0) {
      Alert.alert("Selecione pelo menos uma matéria!");
      return;
    }

    navigation.navigate("ExerciciosPerguntasScreen", {
      selectedMaterias: materiasSelecionadas,
      iddisciplina: disciplinaSelecionada.iddisciplina,
    });
  };

  // ----------------------------------------------------------------------------
  // RENDERIZAÇÃO
  // ----------------------------------------------------------------------------
  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <Header />
        <ActivityIndicator size="large" color="#0056b3" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          Selecione o ano, semestre, disciplina e matéria para iniciar
        </Text>

        {errorMessage ? (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        ) : null}

        {/* Se não temos disciplinaPreSelecionada => mostramos a escolha manual */}
        {!disciplinaPreSelecionada && (
          <>
            <Text style={styles.subtitle}>1) Escolha o Ano</Text>
            <View style={styles.horizontalOptionsContainer}>
              {[1, 2, 3].map((ano) => (
                <TouchableOpacity
                  key={`ano-${ano}`}
                  style={[
                    styles.optionButton,
                    anoSelecionado === ano && styles.optionButtonSelected,
                  ]}
                  onPress={() => selecionarAno(ano)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      anoSelecionado === ano && styles.optionButtonTextSelected,
                    ]}
                  >
                    {ano}º
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {anoSelecionado && (
              <>
                <Text style={styles.subtitle}>2) Escolha o Semestre</Text>
                <View style={styles.horizontalOptionsContainer}>
                  {[1, 2].map((sem) => (
                    <TouchableOpacity
                      key={`sem-${sem}`}
                      style={[
                        styles.optionButton,
                        semestreSelecionado === sem && styles.optionButtonSelected,
                      ]}
                      onPress={() => selecionarSemestre(sem)}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          semestreSelecionado === sem && styles.optionButtonTextSelected,
                        ]}
                      >
                        {sem}º Semestre
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {semestreSelecionado && (
              <>
                <Text style={styles.subtitle}>3) Escolha a Disciplina</Text>
                <View style={styles.disciplinasContainer}>
                  {disciplinas.map((disc) => {
                    const isSelected =
                      disciplinaSelecionada?.iddisciplina === disc.iddisciplina;
                    return (
                      <TouchableOpacity
                        key={`disc-${disc.iddisciplina}`}
                        style={[
                          styles.optionCard,
                          isSelected && styles.optionCardSelected,
                        ]}
                        onPress={() => selecionarDisciplina(disc)}
                      >
                        <Text
                          style={[
                            styles.optionCardText,
                            isSelected && styles.optionCardTextSelected,
                          ]}
                        >
                          {disc.nome}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}

        {/* Se já temos uma disciplina (via param ou escolha), mostramos info */}
        {disciplinaSelecionada && (
          <View style={styles.selectedDiscContainer}>
            <Text style={styles.selectedDiscText}>
              Disciplina Selecionada: {disciplinaSelecionada.nome}
            </Text>
          </View>
        )}

        {/* Escolher Materias */}
        {disciplinaSelecionada && (
          <>
            <Text style={styles.subtitle}>4) Escolha a(s) matéria(s)</Text>
            {materias.map((materia) => {
              const sel = materiasSelecionadas.includes(materia.idmateria);
              return (
                <TouchableOpacity
                  key={`mat-${materia.idmateria}`}
                  style={[styles.materiaButton, sel && styles.materiaButtonSelected]}
                  onPress={() => toggleMateriaSelecionada(materia.idmateria)}
                >
                  <Text
                    style={[
                      styles.materiaButtonText,
                      sel && styles.materiaButtonTextSelected,
                    ]}
                  >
                    {materia.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}
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

const primaryColor = "#0056b3";
const accentColor = "#d32f2f";
const grayColor = "#888";
const whiteColor = "#fff";
const backgroundColor = "#f4f6fa";

// ----------------------------------------------------------------------------
// ESTILOS
// ----------------------------------------------------------------------------
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: backgroundColor,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: "center",
  },
  errorMessage: {
    color: accentColor,
    fontSize: 16,
    textAlign: "center",
    marginVertical: 10,
    fontWeight: "bold",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: accentColor,
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 25,
    marginBottom: 12,
    color: "#333",
    alignSelf: "flex-start",
  },

  // Botões Horizontais (Anos, Semestres)
  horizontalOptionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
    flexWrap: "wrap",
  },
  optionButton: {
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 6,
    marginVertical: 6,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2.5,
  },
  optionButtonSelected: {
    backgroundColor: primaryColor,
  },
  optionButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  optionButtonTextSelected: {
    color: whiteColor,
  },

  // Disciplinas (cards)
  disciplinasContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 15,
  },
  optionCard: {
    width: "45%",
    backgroundColor: whiteColor,
    borderRadius: 8,
    padding: 15,
    margin: 5,
    borderWidth: 2,
    borderColor: primaryColor,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  optionCardSelected: {
    borderColor: accentColor,
  },
  optionCardText: {
    color: primaryColor,
    fontWeight: "bold",
    fontSize: 15,
    textAlign: "center",
  },
  optionCardTextSelected: {
    color: accentColor,
  },

  // Disciplina Selecionada
  selectedDiscContainer: {
    backgroundColor: "#dbe9ff",
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
    width: "100%",
    borderWidth: 1,
    borderColor: "#c8dffc",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  selectedDiscText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    textAlign: "center",
  },

  // Matérias
  materiaButton: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: primaryColor,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: whiteColor,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  materiaButtonSelected: {
    backgroundColor: primaryColor,
    borderColor: accentColor,
  },
  materiaButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: primaryColor,
    textAlign: "center",
  },
  materiaButtonTextSelected: {
    color: whiteColor,
  },

  // Footer
  footer: {
    paddingVertical: 15,
    backgroundColor: whiteColor,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  iniciarBotao: {
    backgroundColor: primaryColor,
    padding: 10,
    borderRadius: 8,
    width: "90%",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
