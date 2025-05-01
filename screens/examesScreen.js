import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Button, Text } from "react-native-paper";
import { useAuth } from "../context/AuthProvider";
import Header from "../componentes/header";
import Slider from "@react-native-community/slider";
import LoadingScreen from "../screens/LoadingScreen";

export default function exameScreen({ route, navigation }) {
  const { supabase, user, loading } = useAuth();

  // Se vier disciplina do param, podes usá-la diretamente
  const { disciplinaPreSelecionada } = route.params || {};

  // Estados básicos de ano/semestre/disciplina
  const [anoSelecionado, setAnoSelecionado] = useState(
    disciplinaPreSelecionada?.ano || null
  );
  const [semestreSelecionado, setSemestreSelecionado] = useState(
    disciplinaPreSelecionada?.semestre || null
  );
  const [disciplinas, setDisciplinas] = useState([]);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(
    disciplinaPreSelecionada || null
  );

  // Matérias
  const [materias, setMaterias] = useState([]);
  const [materiasSelecionadas, setMateriasSelecionadas] = useState([]);

  // Controle de loading/erros
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Slider de perguntas
  const [numPerguntas, setNumPerguntas] = useState(5);
  const [maxPerguntasDisponiveis, setMaxPerguntasDisponiveis] = useState(50);

  // UserInfo => { idcurso, nome, etc. }
  const [userInfo, setUserInfo] = useState(null);

  // ----------------------------------------------------------------------------
  // A) Validar user e buscar userInfo (idcurso) ao montar
  // ----------------------------------------------------------------------------
  useEffect(() => {
    if (!user && !loading) {
      Alert.alert("Sessão Expirada", "Por favor, faça login novamente.", [
        { text: "OK", onPress: () => navigation.replace("Login") },
      ]);
      return;
    }
    if (user) {
      buscarUserInfo(user.id);
    } else {
      setLoadingData(false);
    }
  }, [user]);

  const buscarUserInfo = async (userId) => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase
        .from("utilizadores")
        .select("idcurso")
        .eq("id", userId)
        .single();

      if (error || !data) {
        console.log("Erro ao buscar userInfo:", error);
        setErrorMessage("Não foi possível carregar o seu curso.");
      } else {
        setUserInfo(data); // ex.: { idcurso: 11 }
      }
    } catch (err) {
      console.log("Exception ao buscar userInfo:", err);
      setErrorMessage("Erro ao buscar dados do utilizador.");
    } finally {
      setLoadingData(false);
    }
  };

  // ----------------------------------------------------------------------------
  // B) Se disciplinaPreSelecionada existe, buscar matérias dela
  // ----------------------------------------------------------------------------
  useEffect(() => {
    if (disciplinaPreSelecionada) {
      fetchMaterias(disciplinaPreSelecionada.iddisciplina);
    }
  }, [disciplinaPreSelecionada]);

  // ----------------------------------------------------------------------------
  // C) Carregar Disciplinas via `curso_disciplina` (join c/ disciplinas)
  // ----------------------------------------------------------------------------
  const carregarDisciplinas = async (ano, semestre) => {
    if (!userInfo?.idcurso) {
      Alert.alert("Não foi possível identificar o curso do utilizador.");
      return;
    }
    try {
      setLoadingData(true);
      setDisciplinaSelecionada(null);
      setMaterias([]);
      setMateriasSelecionadas([]);
      setErrorMessage("");

      // Join: iddisciplina, disciplinas(iddisciplina, nome)
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
        // data => ex. [{ iddisciplina: 29, disciplinas: { iddisciplina: 29, nome: 'Matemática' }} ...]
        const arr = data.map((item) => ({
          iddisciplina: item?.disciplinas?.iddisciplina || 0,
          nome: item?.disciplinas?.nome || "Sem Nome",
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
  // D) Buscar matérias
  // ----------------------------------------------------------------------------
  const fetchMaterias = async (iddisciplina) => {
    try {
      setLoadingData(true);
      setErrorMessage("");
      setMaterias([]);
      setMateriasSelecionadas([]);

      const { data, error } = await supabase
        .from("materia")
        .select("*")
        .eq("iddisciplina", iddisciplina);

      if (error) {
        console.error("Erro ao buscar matérias:", error);
        setErrorMessage("Erro ao carregar matérias.");
      } else if (!data || data.length === 0) {
        setErrorMessage("Não há matérias disponíveis para esta disciplina.");
      } else {
        setMaterias(data);
      }
    } catch (err) {
      console.error("Erro ao carregar matérias:", err);
      setErrorMessage("Erro inesperado ao carregar matérias.");
    } finally {
      setLoadingData(false);
    }
  };

  // ----------------------------------------------------------------------------
  // E) Selecionar Ano / Semestre / Disciplina
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

  // ----------------------------------------------------------------------------
  // F) Toggle Materia
  // ----------------------------------------------------------------------------
  const toggleMateriaSelecionada = (idmateria) => {
    const jaSelecionada = materiasSelecionadas.includes(idmateria);
    if (jaSelecionada) {
      setMateriasSelecionadas((prev) => prev.filter((id) => id !== idmateria));
    } else {
      setMateriasSelecionadas((prev) => [...prev, idmateria]);
    }
  };

  // ----------------------------------------------------------------------------
  // G) Recalcular Perguntas disponíveis ao mudar materiasSelecionadas
  // ----------------------------------------------------------------------------
  useEffect(() => {
    const fetchPerguntasDisponiveis = async () => {
      try {
        if (materiasSelecionadas.length === 0) {
          setMaxPerguntasDisponiveis(0);
          if (numPerguntas > 0) setNumPerguntas(0);
          return;
        }
        const { data, error } = await supabase
          .from("perguntas")
          .select("idpergunta")
          .in("idmateria", materiasSelecionadas);

        if (error) {
          console.error("Erro ao verificar perguntas disponíveis:", error);
          return;
        }
        const totalPerguntas = data?.length || 0;
        setMaxPerguntasDisponiveis(totalPerguntas > 0 ? totalPerguntas : 1);
        if (numPerguntas > totalPerguntas) {
          setNumPerguntas(totalPerguntas);
        }
      } catch (e) {
        console.error("Erro inesperado ao buscar perguntas disponíveis:", e);
      }
    };
    fetchPerguntasDisponiveis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materiasSelecionadas]);

  // ----------------------------------------------------------------------------
  // H) Iniciar Teste
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

    // Passamos iddisciplina e numPerguntas para a próxima tela
    navigation.navigate("ExamesPerguntasScreen", {
      selectedMaterias: materiasSelecionadas,
      numPerguntas: parseInt(numPerguntas, 10),
      iddisciplina: disciplinaSelecionada.iddisciplina,
    });
  };

  // ----------------------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------------------
  if (loadingData) {
    return <LoadingScreen onFinish={null} />;
  }

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          Seleciona o ano, semestre, disciplina e matéria para o teste
        </Text>

        {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}

        {/* Se não veio disciplina preSelecionada => escolha manual de ano, sem, disc */}
        {!disciplinaPreSelecionada && (
          <>
            <Text style={styles.subtitle}>1) Escolha o Ano</Text>
            <View style={styles.anoContainer}>
              {[1, 2, 3].map((ano) => (
                <TouchableOpacity
                  key={ano}
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

            {anoSelecionado && (
              <>
                <Text style={styles.subtitle}>2) Escolha o Semestre</Text>
                <View style={styles.semestreContainer}>
                  {[1, 2].map((sem) => (
                    <TouchableOpacity
                      key={sem}
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

            {semestreSelecionado && (
              <>
                <Text style={styles.subtitle}>3) Escolha a Disciplina</Text>
                <View style={styles.disciplinasContainer}>
                  {disciplinas.map((disc) => {
                    const sel =
                      disciplinaSelecionada?.iddisciplina === disc.iddisciplina;
                    return (
                      <TouchableOpacity
                        key={disc.iddisciplina}
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

        {/* Disciplina selecionada (por param ou manual) */}
        {disciplinaSelecionada && (
          <View style={styles.selectedDiscContainer}>
            <Text style={styles.selectedDiscText}>
              Disciplina Selecionada: {disciplinaSelecionada.nome}
            </Text>
          </View>
        )}

        {/* Matérias */}
        {disciplinaSelecionada && (
          <>
            <Text style={styles.subtitle}>4) Escolha a(s) matéria(s)</Text>
            {materias.map((mat) => {
              const sel = materiasSelecionadas.includes(mat.idmateria);
              return (
                <TouchableOpacity
                  key={mat.idmateria}
                  style={[styles.materiaButton, sel && styles.materiaSelecionada]}
                  onPress={() => toggleMateriaSelecionada(mat.idmateria)}
                >
                  <Text style={[styles.materiaText, sel && styles.materiaTextSelecionada]}>
                    {mat.nome}
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

      {/* Footer com botão iniciar */}
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
const backgroundColor = "#f4f6fa";
const whiteColor = "#fff";

const styles = StyleSheet.create({
  containerLoading: {
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
    backgroundColor: primaryColor,
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
    backgroundColor: primaryColor,
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
    backgroundColor: whiteColor,
    borderColor: primaryColor,
    borderWidth: 2,
    borderRadius: 8,
    padding: 10,
    margin: 5,
  },
  disciplinaSelecionada: {
    borderColor: accentColor,
  },
  disciplinaButtonText: {
    color: primaryColor,
    fontWeight: "bold",
    fontSize: 15,
  },

  selectedDiscContainer: {
    backgroundColor: whiteColor,
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: accentColor,
  },
  selectedDiscText: {
    fontSize: 16,
    color: accentColor,
    fontWeight: "600",
  },

  materiaButton: {
    width: "100%",
    padding: 15,
    borderWidth: 2,
    borderColor: primaryColor,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: "center",
    backgroundColor: primaryColor,
  },
  materiaSelecionada: {
    backgroundColor: primaryColor,
    borderColor: accentColor,
  },
  materiaText: {
    fontSize: 16,
    fontWeight: "bold",
    color: whiteColor,
  },
  materiaTextSelecionada: {
    color: whiteColor,
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
    color: primaryColor,
    marginTop: 20,
    textAlign: "center",
  },
  slider: {
    width: "90%",
    marginVertical: 20,
  },

  footer: {
    padding: 20,
    backgroundColor: whiteColor,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    alignItems: "center",
  },
  iniciarBotao: {
    backgroundColor: primaryColor,
    padding: 10,
    borderRadius: 8,
    width: "90%",
  },
});
