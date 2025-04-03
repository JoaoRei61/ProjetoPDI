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

  // Parâmetro opcional: se já recebemos uma disciplina (pré-selecionada) do ecrã anterior
  const { disciplinaPreSelecionada } = route.params || {};

  // Estados para ano, semestre e disciplina
  const [anoSelecionado, setAnoSelecionado] = useState(
    disciplinaPreSelecionada?.ano || null
  );
  const [semestreSelecionado, setSemestreSelecionado] = useState(
    disciplinaPreSelecionada?.semestre || null
  );

  // Lista de disciplinas obtidas da tabela `curso_disciplina`
  const [disciplinas, setDisciplinas] = useState([]);

  // Disciplina atualmente selecionada
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(
    disciplinaPreSelecionada || null
  );

  // Lógica de matérias
  const [materias, setMaterias] = useState([]);
  const [materiasSelecionadas, setMateriasSelecionadas] = useState([]);

  // Loading e erro
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // userInfo: dados do utilizador, ex.: { idcurso, nome, etc. }
  const [userInfo, setUserInfo] = useState(null);

  // ----------------------------------------------------------------------------
  // 1) Carregar dados do utilizador (na tabela `utilizadores`) ao montar
  // ----------------------------------------------------------------------------
  useEffect(() => {
    if (!user && !loading) {
      Alert.alert("Sessão Expirada", "Por favor, faça login novamente.", [
        { text: "OK", onPress: () => navigation.replace("Login") },
      ]);
      return;
    }
    // Se user existe, busca idcurso no 'utilizadores'
    buscarUserInfo(user?.id);
  }, [user]);

  const buscarUserInfo = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("utilizadores")
        .select("idcurso")
        .eq("id", userId)
        .single();

      if (error || !data) {
        console.log("Erro ou sem dados em utilizadores:", error);
        setErrorMessage("Não foi possível obter seu curso.");
      } else {
        setUserInfo(data); // data = { idcurso: 11, ... }
      }
    } catch (err) {
      console.log("Exception ao buscar userInfo:", err);
      setErrorMessage("Erro ao buscar dados do utilizador.");
    } finally {
      setLoadingData(false);
    }
  };

  // ----------------------------------------------------------------------------
  // 2) Se veio disciplinaPreSelecionada, buscar matérias dela
  // ----------------------------------------------------------------------------
  useEffect(() => {
    if (disciplinaPreSelecionada) {
      fetchMaterias(disciplinaPreSelecionada.iddisciplina);
    }
  }, [disciplinaPreSelecionada]);

  // ----------------------------------------------------------------------------
  // 3) Buscar disciplinas via `curso_disciplina`, filtrando por ano+sem, eq("idcurso", userInfo.idcurso)
  // ----------------------------------------------------------------------------
  const carregarDisciplinas = async (ano, semestre) => {
    if (!userInfo?.idcurso) {
      Alert.alert("Não foi possível identificar o curso do utilizador.");
      return;
    }
    try {
      setLoadingData(true);
      setErrorMessage("");
      setDisciplinaSelecionada(null);
      setMaterias([]);
      setMateriasSelecionadas([]);

      // Tabela: curso_disciplina (idcurso, iddisciplina, ano, semestre)
      // Fazemos join para obter o nome real da disciplina?
      const { data, error } = await supabase
        .from("curso_disciplina")
        .select(`
          iddisciplina,
          disciplinas (iddisciplina, nome)
        `)
        .eq("idcurso", userInfo.idcurso)
        .eq("ano", ano)
        .eq("semestre", semestre);

      if (error) {
        console.error("Erro ao buscar disciplinas:", error);
        setErrorMessage("Erro ao carregar disciplinas.");
      } else if (!data || data.length === 0) {
        setDisciplinas([]);
        setErrorMessage("Sem disciplinas para este ano e semestre.");
      } else {
        // data => ex.: [{iddisciplina: 29, disciplinas: {iddisciplina: 29, nome: 'Matemática'}}, ...]
        const arr = data.map((item) => ({
          iddisciplina: item.disciplinas?.iddisciplina || 0,
          nome: item.disciplinas?.nome || "Sem Nome",
          ano,
          semestre,
        }));
        setDisciplinas(arr);
      }
    } catch (err) {
      console.error("Erro ao carregar disciplinas:", err);
      setErrorMessage("Erro ao carregar disciplinas.");
    } finally {
      setLoadingData(false);
    }
  };

  // ----------------------------------------------------------------------------
  // 4) Buscar matérias ao selecionar disciplina
  // ----------------------------------------------------------------------------
  const fetchMaterias = async (iddisciplina) => {
    try {
      setLoadingData(true);
      setErrorMessage("");
      setMaterias([]);
      setMateriasSelecionadas([]);

      // Tabela materias: eq("iddisciplina", X)
      const { data, error } = await supabase
        .from("materia")
        .select("*")
        .eq("iddisciplina", iddisciplina);

      if (error) {
        console.error("Erro ao buscar matérias:", error);
        setErrorMessage("Erro ao carregar as matérias.");
      } else if (!data || data.length === 0) {
        setErrorMessage("Não há matérias para esta disciplina.");
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
  // 5) Seletores
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
  // 6) Iniciar Teste
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
  // RENDER
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

      {/* Botão de Iniciar no Footer */}
      <View style={styles.footer}>
        <Button mode="contained" onPress={iniciarTeste} style={styles.iniciarBotao}>
          Iniciar Teste
        </Button>
      </View>
    </View>
  );
}

/* ===================== ESTILOS ===================== */
const primaryColor = "#0056b3";
const accentColor = "#d32f2f";
const backgroundColor = "#f4f6fa";
const whiteColor = "#fff";

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor,
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
