import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { Text } from "react-native-paper";
import { useAuth } from "../context/AuthProvider";
import supabase from "../supabaseconfig";
import Header from "../componentes/header";

export default function ConquistasScreen({ navigation }) {
  const { user, loading } = useAuth();

  const [quizzesTodos, setQuizzesTodos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroCurso, setFiltroCurso] = useState("");
  const [ordem, setOrdem] = useState("pontuacao_desc");
  const [modalVisible, setModalVisible] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  // ------------------ Estados novos para sub-botões  ------------------
  const [mostrarOpcoesPontuacao, setMostrarOpcoesPontuacao] = useState(false);
  const [mostrarOpcoesData, setMostrarOpcoesData] = useState(false);
  const [mostrarOpcoesCursos, setMostrarOpcoesCursos] = useState(false);
  // --------------------------------------------------------------------

  useEffect(() => {
    if (!user && !loading) {
      Alert.alert("Sessão Expirada", "Por favor, faça login novamente.", [
        { text: "OK", onPress: () => navigation.replace("Login") },
      ]);
      return;
    }
    fetchConquistas();
  }, [user]);

  async function fetchConquistas() {
    try {
      setCarregando(true);
      setErro("");

      const { data: quizzes, error: quizzesError } = await supabase
        .from("quizzes")
        .select("idquiz, data_criacao, pontuacao, idutilizador");

      if (quizzesError) throw quizzesError;

      const { data: utilizadores, error: utilizadoresError } = await supabase
        .from("utilizadores")
        .select("id, nome, idcurso");

      if (utilizadoresError) throw utilizadoresError;

      const { data: cursosData, error: cursosError } = await supabase
        .from("cursos")
        .select("idcurso, nome");

      if (cursosError) throw cursosError;

      const utilizadoresMap = {};
      utilizadores.forEach((u) => {
        utilizadoresMap[u.id] = u;
      });

      const cursosMap = {};
      cursosData.forEach((c) => {
        cursosMap[c.idcurso] = c.nome;
      });

      const quizzesComInfo = quizzes.map((q) => {
        const userInfo = utilizadoresMap[q.idutilizador] || {};
        return {
          ...q,
          nome: userInfo.nome || "Desconhecido",
          curso: cursosMap[userInfo.idcurso] || "-",
        };
      });

      setCursos(cursosData);
      setQuizzesTodos(quizzesComInfo);
    } catch (err) {
      console.error("Erro ao buscar conquistas:", err);
      setErro("Ocorreu um erro ao carregar os dados.");
    } finally {
      setCarregando(false);
    }
  }

  const quizzesFiltrados = quizzesTodos
    .filter((q) => q.nome.toLowerCase().includes(filtroTexto.toLowerCase()))
    .filter((q) => (filtroCurso ? q.curso === filtroCurso : true))
    .sort((a, b) => {
      switch (ordem) {
        case "pontuacao_asc":
          return a.pontuacao - b.pontuacao;
        case "pontuacao_desc":
          return b.pontuacao - a.pontuacao;
        case "data_asc":
          return new Date(a.data_criacao) - new Date(b.data_criacao);
        case "data_desc":
          return new Date(b.data_criacao) - new Date(a.data_criacao);
        default:
          return 0;
      }
    });

  if (carregando) {
    return (
      <View style={styles.containerLoading}>
        <Header />
        <ActivityIndicator size="large" color="#0056b3" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>📊 Todos os Quizzes</Text>

        <TextInput
          style={styles.input}
          placeholder="Pesquisar por nome..."
          value={filtroTexto}
          onChangeText={setFiltroTexto}
        />

        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.filtroBotao}>
          <Text style={styles.filtroBotaoTexto}>Filtros avançados</Text>
        </TouchableOpacity>

        {erro ? (
          <Text style={styles.errorMessage}>{erro}</Text>
        ) : (
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.cell, styles.headerCell]}>#</Text>
              <Text style={[styles.cell, styles.headerCell]}>Nome</Text>
              <Text style={[styles.cell, styles.headerCell]}>Curso</Text>
              <Text style={[styles.cell, styles.headerCell]}>Pontuação</Text>
              <Text style={[styles.cell, styles.headerCell]}>Data</Text>
            </View>
            {quizzesFiltrados.map((quiz, idx) => (
              <View
                key={quiz.idquiz}
                style={[styles.tableRow, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}
              >
                <Text style={styles.cell}>{idx + 1}</Text>
                <Text style={styles.cell}>{quiz.nome}</Text>
                <Text style={styles.cell}>{quiz.curso}</Text>
                <Text style={styles.cell}>{quiz.pontuacao}%</Text>
                <Text style={styles.cell}>{new Date(quiz.data_criacao).toLocaleDateString()}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📋 Filtros Avançados</Text>

            {/* ANTIGAS OPÇÕES PRESSABLE (FICAM ESCONDIDAS) */}
            <Text style={[styles.modalOption, styles.hiddenPressable]}>Ordenar por:</Text>
            {[
              { label: "Pontuação ⬇", value: "pontuacao_desc" },
              { label: "Pontuação ⬆", value: "pontuacao_asc" },
              { label: "Data ⬇", value: "data_desc" },
              { label: "Data ⬆", value: "data_asc" },
            ].map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setOrdem(opt.value)}
                style={styles.hiddenPressable}
              >
                <Text style={[styles.modalOption, ordem === opt.value && styles.selectedOption]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}

            <Text style={[styles.filtroLabel, styles.hiddenPressable]}>Filtrar por curso:</Text>
            <Pressable onPress={() => setFiltroCurso("")} style={styles.hiddenPressable}>
              <Text style={[styles.modalOption, filtroCurso === "" && styles.selectedOption]}>
                Todos
              </Text>
            </Pressable>
            {cursos.map((c) => (
              <Pressable
                key={c.idcurso}
                onPress={() => setFiltroCurso(c.nome)}
                style={styles.hiddenPressable}
              >
                <Text style={[styles.modalOption, filtroCurso === c.nome && styles.selectedOption]}>
                  {c.nome}
                </Text>
              </Pressable>
            ))}

            {/* --------------------------- NOVOS BOTÕES --------------------------- */}
            <TouchableOpacity
              style={styles.botaoFiltroCategoria}
              onPress={() => {
                setMostrarOpcoesPontuacao(!mostrarOpcoesPontuacao);
                setMostrarOpcoesData(false);
                setMostrarOpcoesCursos(false);
              }}
            >
              <Text style={styles.botaoFiltroCategoriaTexto}>Pontuação</Text>
            </TouchableOpacity>
            {mostrarOpcoesPontuacao && (
              <View style={styles.subMenu}>
                <Pressable
                  onPress={() => {
                    setOrdem("pontuacao_asc");
                    setMostrarOpcoesPontuacao(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOption,
                      ordem === "pontuacao_asc" && styles.selectedOption,
                    ]}
                  >
                    Ascendente
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setOrdem("pontuacao_desc");
                    setMostrarOpcoesPontuacao(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOption,
                      ordem === "pontuacao_desc" && styles.selectedOption,
                    ]}
                  >
                    Descendente
                  </Text>
                </Pressable>
              </View>
            )}

            <TouchableOpacity
              style={styles.botaoFiltroCategoria}
              onPress={() => {
                setMostrarOpcoesData(!mostrarOpcoesData);
                setMostrarOpcoesPontuacao(false);
                setMostrarOpcoesCursos(false);
              }}
            >
              <Text style={styles.botaoFiltroCategoriaTexto}>Data</Text>
            </TouchableOpacity>
            {mostrarOpcoesData && (
              <View style={styles.subMenu}>
                <Pressable
                  onPress={() => {
                    setOrdem("data_asc");
                    setMostrarOpcoesData(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOption,
                      ordem === "data_asc" && styles.selectedOption,
                    ]}
                  >
                    Mais antiga
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setOrdem("data_desc");
                    setMostrarOpcoesData(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOption,
                      ordem === "data_desc" && styles.selectedOption,
                    ]}
                  >
                    Mais recente
                  </Text>
                </Pressable>
              </View>
            )}

            <TouchableOpacity
              style={styles.botaoFiltroCategoria}
              onPress={() => {
                setMostrarOpcoesCursos(!mostrarOpcoesCursos);
                setMostrarOpcoesPontuacao(false);
                setMostrarOpcoesData(false);
              }}
            >
              <Text style={styles.botaoFiltroCategoriaTexto}>Cursos</Text>
            </TouchableOpacity>
            {mostrarOpcoesCursos && (
              <View style={styles.subMenu}>
                <Pressable
                  onPress={() => {
                    setFiltroCurso("");
                    setMostrarOpcoesCursos(false);
                  }}
                >
                  <Text style={[styles.modalOption, filtroCurso === "" && styles.selectedOption]}>
                    Todos
                  </Text>
                </Pressable>
                {cursos.map((c) => (
                  <Pressable
                    key={c.idcurso}
                    onPress={() => {
                      setFiltroCurso(c.nome);
                      setMostrarOpcoesCursos(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOption,
                        filtroCurso === c.nome && styles.selectedOption,
                      ]}
                    >
                      {c.nome}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            {/* ------------------------------------------------------------------- */}

            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.fecharModal}>
              <Text style={styles.fecharModalTexto}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  containerLoading: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#003366",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 6,
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  filtroBotao: {
    backgroundColor: "#0056b3",
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  filtroBotaoTexto: {
    color: "#fff",
    fontWeight: "bold",
  },
  errorMessage: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  tableCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    padding: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#003366",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  cell: {
    flex: 1,
    color: "#333",
    fontSize: 14,
    textAlign: "center",
  },
  headerCell: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    paddingVertical: 10,
  },
  rowEven: {
    backgroundColor: "#f0f4f8",
  },
  rowOdd: {
    backgroundColor: "#e8ecf1",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalOption: {
    paddingVertical: 8,
    fontSize: 16,
    color: "#333",
  },
  selectedOption: {
    fontWeight: "bold",
    color: "#0056b3",
  },
  fecharModal: {
    backgroundColor: "#0056b3",
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  fecharModalTexto: {
    color: "white",
    fontWeight: "bold",
  },

  // ---- ESTILOS NOVOS PARA ESCONDER O ORIGINAL E EXIBIR OS BOTÕES ----
  hiddenPressable: {
    height: 0,
    overflow: "hidden",
    opacity: 0,
  },
  filtroLabel: {
    marginTop: 10,
    fontWeight: "600",
    color: "#333",
    opacity: 0, // esconde a label anterior
    height: 0, // sem remover a linha
  },
  botaoFiltroCategoria: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 6,
    marginVertical: 6,
  },
  botaoFiltroCategoriaTexto: {
    color: "#333",
    fontWeight: "bold",
    textAlign: "center",
  },
  subMenu: {
    backgroundColor: "#fafafa",
    marginBottom: 10,
    paddingLeft: 16,
    borderLeftColor: "#ccc",
    borderLeftWidth: 2,
  },
});
