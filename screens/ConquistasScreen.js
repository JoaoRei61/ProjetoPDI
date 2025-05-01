import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../context/AuthProvider";
import supabase from "../supabaseconfig";
import Header from "../componentes/header";
import LoadingScreen from "../screens/LoadingScreen";

/**
 * Tela de "Conquistas" em que:
 *  - Selecionamos Ano e Semestre com "cards" (visual semelhante ao resto do app),
 *  - Ao escolher ambos, carregamos as disciplinas e matérias + barras de progresso
 *    sem precisar de um botão extra de "Carregar Disciplinas".
 */

export default function ConquistasScreen({ navigation }) {
  const { user } = useAuth();

  // Estados básicos
  const [loading, setLoading] = useState(true); // começa como true para mostrar Loading
  const [errorMessage, setErrorMessage] = useState("");

  // Guardamos o idcurso do user e o userId (para resolucao)
  const [userCourseId, setUserCourseId] = useState(null);
  const [userId, setUserId] = useState(null);

  // Seleção de Ano e Semestre
  const [anoSelecionado, setAnoSelecionado] = useState(null);
  const [semestreSelecionado, setSemestreSelecionado] = useState(null);

  // Disciplinas encontradas + matérias por disciplina
  const [disciplinasFiltradas, setDisciplinasFiltradas] = useState([]);
  const [materiasPorDisciplina, setMateriasPorDisciplina] = useState({});

  // Arrays fixos (3 anos, 2 semestres)
  const ANOS = [1, 2, 3];
  const SEMESTRES = [1, 2];

  // 1) Ao montar, buscar user + curso
  useEffect(() => {
    fetchUserAndCourse();
  }, []);

  const fetchUserAndCourse = async () => {
    try {
      setErrorMessage("");

      const {
        data: { user: supabaseUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!supabaseUser) {
        setErrorMessage("Usuário não encontrado / não logado.");
        return;
      }
      setUserId(supabaseUser.id);

      // Buscar idcurso do utilizador
      const { data: userData, error: userDataError } = await supabase
        .from("utilizadores")
        .select("idcurso")
        .eq("id", supabaseUser.id)
        .single();

      if (userDataError) throw userDataError;
      if (!userData || !userData.idcurso) {
        setErrorMessage("O utilizador não tem um curso associado.");
        return;
      }

      setUserCourseId(userData.idcurso);
    } catch (err) {
      console.error("Erro ao buscar curso do user:", err);
      setErrorMessage("Erro ao obter dados do utilizador.");
    } finally {
      // Espera 1s antes de terminar a Loadingscreen
      setTimeout(() => setLoading(false), 1000);
    }
  };

  // 2) Sempre que ano & semestre mudam, se ambos definidos, buscar disciplinas
  useEffect(() => {
    if (anoSelecionado && semestreSelecionado) {
      buscarDisciplinas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anoSelecionado, semestreSelecionado]);

  // 3) Buscar disciplinas + matérias + progresso
  const buscarDisciplinas = async () => {
    if (!userCourseId) {
      setErrorMessage("Não foi possível obter o curso do utilizador.");
      return;
    }
    setLoading(true);
    setErrorMessage("");

    try {
      const { data: cdData, error: cdError } = await supabase
        .from("curso_disciplina")
        .select("iddisciplina, ano, semestre")
        .eq("idcurso", userCourseId)
        .eq("ano", anoSelecionado)
        .eq("semestre", semestreSelecionado);

      if (cdError) throw cdError;
      if (!cdData || cdData.length === 0) {
        setErrorMessage("Não foram encontradas disciplinas para este ano/semestre.");
        setDisciplinasFiltradas([]);
        setMateriasPorDisciplina({});
        setLoading(false);
        return;
      }

      // Obter nome da disciplina
      const listaDisciplinasPromises = cdData.map(async (row) => {
        const { data: discRow, error: discError } = await supabase
          .from("disciplinas")
          .select("iddisciplina, nome")
          .eq("iddisciplina", row.iddisciplina)
          .single();
        if (discError) {
          console.error("Erro ao buscar disciplina:", discError);
          return null;
        }
        if (!discRow) return null;

        return {
          iddisciplina: discRow.iddisciplina,
          nomeDisciplina: discRow.nome,
        };
      });

      const disciplinasEncontradas = await Promise.all(listaDisciplinasPromises);
      const disciplinasValidas = disciplinasEncontradas.filter(Boolean);
      setDisciplinasFiltradas(disciplinasValidas);

      // Para cada disciplina, buscar materias e progresso
      let tempMaterias = {};
      for (let disc of disciplinasValidas) {
        const { data: matData, error: matError } = await supabase
          .from("materia")
          .select("idmateria, nome")
          .eq("iddisciplina", disc.iddisciplina);

        if (matError) {
          console.error("Erro ao buscar materia:", matError);
          tempMaterias[disc.iddisciplina] = [];
          continue;
        }

        if (!matData || matData.length === 0) {
          tempMaterias[disc.iddisciplina] = [];
          continue;
        }

        let arrComProgresso = [];
        for (let mat of matData) {
          const { data: pergData, error: pergError } = await supabase
            .from("perguntas")
            .select("idpergunta")
            .eq("idmateria", mat.idmateria);

          if (pergError) {
            console.error(pergError);
            continue;
          }
          const totalPerg = pergData.length;
          if (totalPerg === 0) {
            arrComProgresso.push({
              ...mat,
              total: 0,
              corretas: 0,
              percentual: 0,
            });
            continue;
          }

          const idsPerg = pergData.map((p) => p.idpergunta);
          const { data: resolData, error: resolError } = await supabase
            .from("resolucao")
            .select("idpergunta")
            .in("idpergunta", idsPerg)
            .eq("idutilizador", userId)
            .eq("correta", true);

          if (resolError) {
            console.error(resolError);
            continue;
          }

          const corretas = resolData ? resolData.length : 0;
          const pct = ((corretas / totalPerg) * 100).toFixed(2);

          arrComProgresso.push({
            ...mat,
            total: totalPerg,
            corretas,
            percentual: pct,
          });
        }

        tempMaterias[disc.iddisciplina] = arrComProgresso;
      }

      setMateriasPorDisciplina(tempMaterias);
    } catch (err) {
      console.error("Erro inesperado:", err);
      setErrorMessage("Erro ao buscar disciplinas/matérias.");
    } finally {
      setLoading(false);
    }
  };

  // Resetar toda a seleção
  const resetSelecao = () => {
    setAnoSelecionado(null);
    setSemestreSelecionado(null);
    setDisciplinasFiltradas([]);
    setMateriasPorDisciplina({});
    setErrorMessage("");
  };

  // ============ RENDER ============ //
  if (loading) {
    return <LoadingScreen onFinish={null} />;
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Cabeçalho no estilo DisciplinasScreen */}
        <View style={styles.disciplinaHeader}>
          <Text style={styles.emoji}>📚</Text>
          <Text style={styles.disciplinaNome}>Conquistas</Text>
        </View>

        {/* Mensagens de erro */}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {/* Se ainda não escolheu ANO, exibir "cards" para cada ano */}
        {!anoSelecionado && (
          <View style={{ width: "100%" }}>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>
              Selecione o Ano
            </Text>
            {ANOS.map((ano) => (
              <View style={styles.cardExercicios} key={`ano-${ano}`}>
                <Text style={styles.cardTitle}>Ano {ano}</Text>
                <Text style={styles.cardSubtitle}>
                  Clique para selecionar o {ano}º ano
                </Text>
                <TouchableOpacity
                  style={styles.cardButton}
                  onPress={() => {
                    setAnoSelecionado(ano);
                    setSemestreSelecionado(null);
                    setDisciplinasFiltradas([]);
                    setMateriasPorDisciplina({});
                  }}
                >
                  <Text style={styles.cardButtonText}>Selecionar Ano {ano}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Se escolheu ANO mas não SEMESTRE, exibir "cards" para cada semestre */}
        {anoSelecionado && !semestreSelecionado && (
          <View style={{ width: "100%" }}>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>
              Selecionou Ano {anoSelecionado}. Agora escolha o semestre:
            </Text>
            {SEMESTRES.map((sem) => (
              <View style={styles.cardExercicios} key={`sem-${sem}`}>
                <Text style={styles.cardTitle}>Semestre {sem}</Text>
                <Text style={styles.cardSubtitle}>
                  Clique para selecionar o {sem}º semestre do ano {anoSelecionado}
                </Text>
                <TouchableOpacity
                  style={styles.cardButton}
                  onPress={() => {
                    setSemestreSelecionado(sem);
                  }}
                >
                  <Text style={styles.cardButtonText}>
                    Selecionar Semestre {sem}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.cardButton, { marginTop: 20 }]}
              onPress={resetSelecao}
            >
              <Text style={styles.cardButtonText}>← Voltar / Mudar Ano</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Se já tem ano e semestre, exibimos as disciplinas e matérias */}
        {anoSelecionado && semestreSelecionado && (
          <View style={{ width: "100%" }}>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>
              Ano {anoSelecionado}, Semestre {semestreSelecionado}
            </Text>

            {disciplinasFiltradas.length > 0 ? (
              disciplinasFiltradas.map((disc) => {
                const listaMat = materiasPorDisciplina[disc.iddisciplina] || [];
                return (
                  <View style={styles.cardExercicios} key={disc.iddisciplina}>
                    <Text style={styles.cardTitle}>{disc.nomeDisciplina}</Text>
                    <Text style={styles.cardSubtitle}>
                      Matérias e progresso:
                    </Text>

                    {listaMat.length === 0 ? (
                      <Text style={styles.infoText}>
                        Nenhuma matéria encontrada para esta disciplina.
                      </Text>
                    ) : (
                      listaMat.map((mat) => (
                        <View key={mat.idmateria} style={styles.progressContainer}>
                          <Text style={styles.materiaText}>{mat.nome}</Text>
                          <View style={styles.progressBar}>
                            <View
                              style={[
                                styles.progressFill,
                                { width: `${mat.percentual}%` },
                              ]}
                            />
                          </View>
                          <Text style={styles.progressLabel}>
                            {mat.corretas}/{mat.total} certas ({mat.percentual}%)
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                );
              })
            ) : (
              <Text style={styles.infoText}>
                Não foram encontradas disciplinas para este ano/semestre.
              </Text>
            )}

            <TouchableOpacity
              style={[styles.cardButton, { marginTop: 20 }]}
              onPress={resetSelecao}
            >
              <Text style={styles.cardButtonText}>← Alterar Ano/Semestre</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.voltarButton} onPress={() => navigation.goBack()}>
          <Text style={styles.voltarButtonText}>Voltar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ================== ESTILOS ================== //
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e8f0fe" },
  scrollContainer: { padding: 16, alignItems: "center" },
  loader: { marginTop: 20 },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 10,
  },

  // Header
  disciplinaHeader: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    width: "100%",
  },
  disciplinaNome: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a237e",
    marginLeft: 10,
  },
  emoji: { fontSize: 30 },

  // Título de cada seção
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a237e",
    marginBottom: 5,
  },

  // Cards
  cardExercicios: {
    backgroundColor: "#fff3e0",
    borderLeftWidth: 6,
    borderLeftColor: "#fb8c00",
    width: "100%",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#263238",
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 15,
    color: "#424242",
    marginBottom: 12,
  },
  cardButton: {
    alignSelf: "flex-start",
    backgroundColor: "#1a237e",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 5,
  },
  cardButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  infoText: {
    textAlign: "center",
    fontSize: 14,
    marginTop: 10,
    color: "#888",
  },

  // Barra de progresso
  progressContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  materiaText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  progressBar: {
    width: "100%",
    height: 12,
    backgroundColor: "#eee",
    borderRadius: 6,
    overflow: "hidden",
    marginVertical: 5,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
  },
  progressLabel: {
    fontSize: 14,
    color: "#333",
    marginTop: 2,
  },

  // Botão final
  voltarButton: {
    backgroundColor: "#0056b3",
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 30,
    marginBottom: 40,
  },
  voltarButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
