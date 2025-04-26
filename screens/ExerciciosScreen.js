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
  const { supabase, user, loading: authLoading } = useAuth();
  const { disciplinaPreSelecionada } = route.params || {};

  const [anoSelecionado, setAnoSelecionado] = useState(
    disciplinaPreSelecionada?.ano || null
  );
  const [semestreSelecionado, setSemestreSelecionado] = useState(
    disciplinaPreSelecionada?.semestre || null
  );
  const [disciplinas, setDisciplinas] = useState([]);
  const [discProgress, setDiscProgress] = useState({});
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(
    disciplinaPreSelecionada || null
  );
  const [materias, setMaterias] = useState([]);
  const [materiasSelecionadas, setMateriasSelecionadas] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user && !authLoading) {
      Alert.alert("Sessão Expirada", "Por favor, faça login novamente.", [
        { text: "OK", onPress: () => navigation.replace("Login") },
      ]);
      return;
    }
    fetchUserInfo();
  }, [user]);

  const fetchUserInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("utilizadores")
        .select("idcurso")
        .eq("id", user.id)
        .single();
      if (error || !data) {
        setErrorMessage("Não foi possível obter seu curso.");
      } else {
        setUserInfo(data);
      }
    } catch {
      setErrorMessage("Erro ao buscar dados do utilizador.");
    }
  };

  useEffect(() => {
    if (anoSelecionado && semestreSelecionado && userInfo) {
      carregarDisciplinas(anoSelecionado, semestreSelecionado);
    }
  }, [anoSelecionado, semestreSelecionado, userInfo]);

  const carregarDisciplinas = async (ano, semestre) => {
    setLoadingData(true);
    setErrorMessage("");
    setDisciplinaSelecionada(null);
    setMaterias([]);
    setMateriasSelecionadas([]);
    try {
      const { data, error } = await supabase
        .from("curso_disciplina")
        .select("disciplinas (iddisciplina, nome)")
        .eq("idcurso", userInfo.idcurso)
        .eq("ano", ano)
        .eq("semestre", semestre);
      if (error) throw error;
      const arr = data.map((r) => ({
        iddisciplina: r.disciplinas.iddisciplina,
        nome: r.disciplinas.nome,
      }));
      setDisciplinas(arr);
      await loadDiscProgress(arr);
    } catch {
      setErrorMessage("Erro ao carregar disciplinas.");
    } finally {
      setLoadingData(false);
    }
  };

  const loadDiscProgress = async (arr) => {
    const obj = {};
    for (const d of arr) {
      // obter IDs de matéria
      const { data: matData = [], error: matErr } = await supabase
        .from("materia")
        .select("idmateria")
        .eq("iddisciplina", d.iddisciplina);
      const materiaIds = matData.map((m) => m.idmateria);

      // total de perguntas
      const { count: total = 0 } = await supabase
        .from("perguntas")
        .select("idpergunta", { head: true, count: "exact" })
        .in("idmateria", materiaIds);
      // resolvidas (se um registro em resolucao existir, certo ou errado)
      const { count: resolved = 0 } = await supabase
        .from("resolucao")
        .select("idpergunta", { head: true, count: "exact" })
        .eq("idutilizador", user.id)
        .in("idmateria", materiaIds);
      // corretas
      const { count: correct = 0 } = await supabase
        .from("resolucao")
        .select("idpergunta", { head: true, count: "exact" })
        .eq("idutilizador", user.id)
        .eq("correta", true)
        .in("idmateria", materiaIds);

      obj[d.iddisciplina] = { total, resolved, correct };
    }
    setDiscProgress(obj);
  };

  useEffect(() => {
    if (disciplinaSelecionada) {
      fetchMaterias(disciplinaSelecionada.iddisciplina);
    }
  }, [disciplinaSelecionada]);

  const fetchMaterias = async (iddisciplina) => {
    setLoadingData(true);
    setErrorMessage("");
    try {
      const { data, error } = await supabase
        .from("materia")
        .select("*")
        .eq("iddisciplina", iddisciplina);
      if (error) throw error;
      setMaterias(data);
    } catch {
      setErrorMessage("Erro ao carregar matérias.");
    } finally {
      setLoadingData(false);
    }
  };

  const selecionarAno = (ano) => {
    setAnoSelecionado(ano);
    setSemestreSelecionado(null);
  };
  const selecionarSemestre = (sem) => setSemestreSelecionado(sem);
  const selecionarDisciplina = (disc) => setDisciplinaSelecionada(disc);
  const toggleMateriaSelecionada = (id) =>
    setMateriasSelecionadas((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );

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

  if (loadingData || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Header />
        <ActivityIndicator size="large" color="#0056b3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          Selecione ano, semestre, disciplina e matéria
        </Text>
        {errorMessage ? (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        ) : null}

        {!disciplinaPreSelecionada && (
          <>
            <Text style={styles.subtitle}>1) Ano</Text>
            <View style={styles.row}>
              {[1, 2, 3].map((ano) => (
                <TouchableOpacity
                  key={ano}
                  style={[
                    styles.btn,
                    anoSelecionado === ano && styles.btnSelected,
                  ]}
                  onPress={() => selecionarAno(ano)}
                >
                  <Text
                    style={[
                      styles.btnText,
                      anoSelecionado === ano && styles.btnTextSelected,
                    ]}
                  >
                    {ano}º
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {anoSelecionado && (
              <>
                <Text style={styles.subtitle}>2) Semestre</Text>
                <View style={styles.row}>
                  {[1, 2].map((sem) => (
                    <TouchableOpacity
                      key={sem}
                      style={[
                        styles.btn,
                        semestreSelecionado === sem && styles.btnSelected,
                      ]}
                      onPress={() => selecionarSemestre(sem)}
                    >
                      <Text
                        style={[
                          styles.btnText,
                          semestreSelecionado === sem && styles.btnTextSelected,
                        ]}
                      >
                        {sem}º Sem
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {semestreSelecionado && (
              <>
                <Text style={styles.subtitle}>3) Disciplina</Text>
                {disciplinas.map((d) => {
                  const isSel =
                    disciplinaSelecionada?.iddisciplina === d.iddisciplina;
                  const { total = 0, resolved = 0, correct = 0 } =
                    discProgress[d.iddisciplina] || {};
                  const pctResolved = total ? (resolved / total) * 100 : 0;
                  const pctCorrect = total ? (correct / total) * 100 : 0;
                  return (
                    <TouchableOpacity
                      key={d.iddisciplina}
                      style={[
                        styles.card,
                        isSel && styles.cardSelected,
                      ]}
                      onPress={() => selecionarDisciplina(d)}
                    >
                      <Text
                        style={[
                          styles.cardText,
                          isSel && styles.cardTextSelected,
                        ]}
                      >
                        {d.nome}
                      </Text>
                      <View style={styles.dualBarBg}>
                        <View
                          style={[
                            styles.dualBarResolved,
                            { width: `${pctResolved}%` },
                          ]}
                        />
                        <View
                          style={[
                            styles.dualBarCorrect,
                            { width: `${pctCorrect}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressLabel}>
                        {resolved}/{total} resolvidas, {correct}/{total} corretas
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </>
        )}

        {disciplinaSelecionada && (
          <>
            <Text style={styles.subtitle}>4) Matéria(s)</Text>
            {materias.map((m) => {
              const sel = materiasSelecionadas.includes(m.idmateria);
              return (
                <TouchableOpacity
                  key={m.idmateria}
                  style={[styles.materiaBtn, sel && styles.materiaBtnSelected]}
                  onPress={() => toggleMateriaSelecionada(m.idmateria)}
                >
                  <Text
                    style={[
                      styles.materiaText,
                      sel && styles.materiaTextSelected,
                    ]}
                  >
                    {m.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button mode="contained" onPress={iniciarTeste} style={styles.startBtn}>
          Iniciar Teste
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f4f6fa",
    justifyContent: "center",
    alignItems: "center",
  },
  container: { flex: 1, backgroundColor: "#f4f6fa" },
  content: { padding: 16 },
  errorMessage: {
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "bold",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  btn: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 6,
    margin: 6,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSelected: { backgroundColor: "#0056b3" },
  btnText: { color: "#333" },
  btnTextSelected: { color: "#fff" },
  cardWrapper: { marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#0056b3",
  },
  cardSelected: { borderColor: "#d32f2f" },
  cardText: { color: "#0056b3", fontWeight: "bold" },
  cardTextSelected: { color: "#d32f2f" },
  dualBarBg: {
    height: 6,
    backgroundColor: "#ddd",
    borderRadius: 3,
    marginTop: 4,
    overflow: "hidden",
    position: "relative",
  },
  dualBarResolved: {
    height: 12,
    backgroundColor: "#0056b3",  // azul para resolvidas
  },
  dualBarCorrect: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 12,
    backgroundColor: "#4CAF50",  // verde para corretas
  },
  progressLabel: {
    fontSize: 12,
    color: "#555",
    marginTop: 4,
    textAlign: "right",
  },
  materiaBtn: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#0056b3",
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  materiaBtnSelected: { backgroundColor: "#0056b3" },
  materiaText: { color: "#0056b3" },
  materiaTextSelected: { color: "#fff" },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  startBtn: { backgroundColor: "#0056b3" },
});
