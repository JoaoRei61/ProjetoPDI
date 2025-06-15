import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,

  Text,
} from "react-native";
import { Button } from "react-native-paper";
import { useAuth } from "../context/AuthProvider";
import { Ionicons } from '@expo/vector-icons';
import Header from "../componentes/header";
import LoadingScreen from "../screens/LoadingScreen";

export default function ExerciciosScreen({ route, navigation }) {
  const { supabase, user, loading: authLoading } = useAuth();
  const { disciplinaPreSelecionada } = route.params || {};
  const [materiaProgress, setMateriaProgress] = useState({});

  const [anoSelecionado, setAnoSelecionado] = useState(
    disciplinaPreSelecionada?.ano || null
  );
  const [mostrarAnos, setMostrarAnos] = useState(false);
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
  const [loading, setLoading] = useState(false); 


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
    setLoading(true); // ativa o loading
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
      setLoading(false); // desativa o loading
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
  
      // Carregar progresso de cada matéria
      const progressObj = {};
      for (const m of data) {
        const { count: total = 0 } = await supabase
          .from("perguntas")
          .select("idpergunta", { head: true, count: "exact" })
          .eq("idmateria", m.idmateria);
  
        const { count: resolved = 0 } = await supabase
          .from("resolucao")
          .select("idpergunta", { head: true, count: "exact" })
          .eq("idutilizador", user.id)
          .eq("idmateria", m.idmateria);
  
        const { count: correct = 0 } = await supabase
          .from("resolucao")
          .select("idpergunta", { head: true, count: "exact" })
          .eq("idutilizador", user.id)
          .eq("correta", true)
          .eq("idmateria", m.idmateria);
  
        progressObj[m.idmateria] = { total, resolved, correct };
      }
      setMateriaProgress(progressObj);
  
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
    navigation.navigate("ExerciciosPerguntas", {
      selectedMaterias: materiasSelecionadas,
      iddisciplina: disciplinaSelecionada.iddisciplina,
    });
  };

  if (loadingData || authLoading || loading) {
    return <LoadingScreen onFinish={null} />;
  }

  return (
    <View style={styles.container}>
      <Header />
      <Text style={styles.welcome}>Bem vindo à página de exercícios!</Text>
      <ScrollView contentContainerStyle={styles.content}>
        
        {errorMessage ? (
          <LoadingScreen onFinish={null} />
        ) : null}
        

        {!disciplinaPreSelecionada && (
          <>
                <View style={styles.anoContainer}>
                <TouchableOpacity
                  style={styles.dropdownBotao}
                  onPress={() => setMostrarAnos(!mostrarAnos)}
                >
                  <Text style={styles.dropdownTexto}>Escolhe o Ano</Text>
                  <Ionicons name="chevron-down" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {mostrarAnos && (
                <View style={styles.anosDropdown}>
                  {[1, 2, 3].map((ano) => (
                    <TouchableOpacity
                      key={ano}
                      style={anoSelecionado === ano ? styles.anoSelecionado : styles.ano}
                      onPress={() => {
                        setAnoSelecionado(ano);
                        setMostrarAnos(false);
                      }}
                    >
                      <Text style={styles.anoTexto}>{ano}º Ano</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

                
            {anoSelecionado && (
            <>
              <View style={styles.anoBadge}>
                <Ionicons name="book-outline" size={20} color="#0d47a1" style={{ marginRight: 6 }} />
                <Text style={styles.anoBadgeTexto}>
                  Estás a ver o {anoSelecionado}º Ano
                </Text>
              </View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Escolhe o Semestre</Text>
                </View>
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
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Escolhe a Disciplina</Text>
                </View>
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
            <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Escolhe a(s) Matéria(s)</Text>
                </View>
            {materias.length === 0 ? (
  <Text style={styles.noMateriasText}>Não há matérias disponíveis.</Text>
) : (
  materias.map((m) => {
    const sel = materiasSelecionadas.includes(m.idmateria);
    const { total = 0, resolved = 0, correct = 0 } =
      materiaProgress[m.idmateria] || {};
    const pctResolved = total ? (resolved / total) * 100 : 0;
    const pctCorrect = total ? (correct / total) * 100 : 0;

    return (
      <TouchableOpacity
        key={m.idmateria}
        style={[styles.materiaBtn, sel && styles.materiaBtnSelected]}
        onPress={() => toggleMateriaSelecionada(m.idmateria)}
      >
        <Text
          style={[styles.materiaText, sel && styles.materiaTextSelected]}
        >
          {m.nome}
        </Text>
        <View style={styles.dualBarBg}>
          <View
            style={[styles.dualBarResolved, { width: `${pctResolved}%` }]}
          />
          <View
            style={[styles.dualBarCorrect, { width: `${pctCorrect}%` }]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {resolved}/{total} resolvidas, {correct}/{total} corretas
        </Text>
      </TouchableOpacity>
    );
  })
)}
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
  noMateriasText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#607d8b',
    marginTop: 20,
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  semestreSelecionado: {
    backgroundColor: "#e3f2fd",
    borderColor: "#0056b3",
    borderWidth: 2,
  },
  semestreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  semestreButton: {
    backgroundColor: "rgb(255, 255, 255)",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginHorizontal: 6,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a237e',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  anoBadge: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#d1c4e9',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#aaa',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  anoBadgeTexto: {
    color: '#1a237e',
    fontSize: 16,
    fontWeight: '600',
  },
  anoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dropdownBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3949ab',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  dropdownTexto: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  anosDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
  },
  ano: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#c5cae9',
    minWidth: 80,
    alignItems: 'center',
  },
  anoSelecionado: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#3f51b5',
    minWidth: 80,
    alignItems: 'center',
  },
  anoTexto: {
    color: '#fff',
    fontWeight: '600',
  },
  semestreTexto: {
    color: "#333",
    fontWeight: "600",
  },
  welcome: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1a237e',
    textAlign: 'center',
    marginVertical: 30,
  },
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
  cardSelected: {
    borderColor: '#3949ab',
    backgroundColor: '#e8eaf6',
  },
  cardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 8,
  },
  cardTextSelected: {
    color: '#3949ab',
  },
  dualBarBg: {
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  dualBarResolved: {
    height: 6,
    backgroundColor: '#64b5f6', // azul claro
  },
  dualBarCorrect: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 6,
    backgroundColor: '#81c784', // verde claro
  },
  progressLabel: {
    fontSize: 13,
    color: '#444',
    marginTop: 6,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  materiaBtn: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  materiaBtnSelected: {
    borderColor: '#3949ab',
    backgroundColor: '#e8eaf6',
  },
  materiaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a237e',
  },
  materiaTextSelected: {
    color: '#fff',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  startBtn: {backgroundColor: "#0056b3",
  paddingVertical: 10,
  borderRadius: 16,
  width: "90%",
  shadowOpacity: 0.2,
  shadowRadius: 5,
  elevation: 5,
  alignItems: "center",},
});
