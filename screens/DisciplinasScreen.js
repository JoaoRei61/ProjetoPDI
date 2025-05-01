import React, { useEffect, useState } from "react";
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


export default function DisciplinasScreen({ route, navigation }) {
  const { iddisciplina } = route.params || {};
  const { user } = useAuth();

  const [disciplina, setDisciplina] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!iddisciplina) {
      setErrorMessage("Erro: iddisciplina não fornecido.");
      setLoading(false);
      return;
    }
    fetchDisciplina(iddisciplina);
  }, [iddisciplina]);

  // Busca a disciplina pelo iddisciplina e guarda no state 'disciplina'
  const fetchDisciplina = async (iddisc) => {
    try {
      const { data, error } = await supabase
        .from("disciplinas")
        .select("*")
        .eq("iddisciplina", iddisc)
        .single();

      if (error) {
        console.error("Erro ao buscar disciplina:", error);
        setErrorMessage("Não foi possível carregar a disciplina.");
      } else {
        setDisciplina(data);
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      setErrorMessage("Erro ao carregar disciplina.");
    } finally {
      setLoading(false);
    }
  };

  // === Funções de clique nos botões coloridos ===
  const irParaExercicios = () => {
    navigation.navigate("ExerciciosScreen", { disciplinaPreSelecionada: disciplina });
  };

  // Agora, ao clicar em "Modo Exame", vai para a rota "Exames"
  const irParaExame = () => {
    // Em vez de mandar só "iddisciplina"
    navigation.navigate("Exames", {
      disciplinaPreSelecionada: disciplina, 
    });
  };
  

  const irParaResumos = () => {
    navigation.navigate("Resumos", { iddisciplina });
  };

  // Agora, ao clicar em Ranking, navegamos para "Ranking" em vez de exibir alerta
  const irParaRanking = () => {
    navigation.navigate("Ranking", { iddisciplina });
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />

      {loading ? (
        <LoadingScreen onFinish={null} />
      ) : errorMessage ? (
        <View style={{ marginTop: 50, alignItems: "center", padding: 20 }}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Título com nome da disciplina */}
          <View style={styles.disciplinaHeader}>
            <Text style={styles.emoji}>📚</Text>
            <Text style={styles.disciplinaNome}>
              {disciplina ? disciplina.nome : "Disciplina não encontrada."}
            </Text>
          </View>

          {/* Container Exercícios */}
          <View style={styles.cardExercicios}>
            <Text style={styles.cardTitle}>Exercícios ✏️</Text>
            <Text style={styles.cardSubtitle}>
              Pratique os conteúdos desta disciplina com exercícios interativos.
            </Text>
            <TouchableOpacity style={styles.cardButton} onPress={irParaExercicios}>
              <Text style={styles.cardButtonText}>Aceder</Text>
            </TouchableOpacity>
          </View>

          {/* Container Modo Exame */}
          <View style={styles.cardExame}>
            <Text style={styles.cardTitle}>Modo Exame 📝</Text>
            <Text style={styles.cardSubtitle}>
              Teste os seus conhecimentos em um formato de exame real.
            </Text>
            <TouchableOpacity style={styles.cardButton} onPress={irParaExame}>
              <Text style={styles.cardButtonText}>Aceder</Text>
            </TouchableOpacity>
          </View>

          {/* Container Resumos */}
          <View style={styles.cardResumos}>
            <Text style={styles.cardTitle}>Resumos 📖</Text>
            <Text style={styles.cardSubtitle}>
              Consulte resumos e materiais de apoio para reforçar o estudo.
            </Text>
            <TouchableOpacity style={styles.cardButton} onPress={irParaResumos}>
              <Text style={styles.cardButtonText}>Aceder</Text>
            </TouchableOpacity>
          </View>

          {/* Container Ranking */}
          <View style={styles.cardRanking}>
            <Text style={styles.cardTitle}>Ranking 🏆</Text>
            <Text style={styles.cardSubtitle}>
              Descubra quem se destaca nesta disciplina! (em breve)
            </Text>
            <TouchableOpacity style={styles.cardButton} onPress={irParaRanking}>
              <Text style={styles.cardButtonText}>Ver Ranking</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e8f0fe" },
  loader: { marginTop: 20 },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
  scrollContainer: { padding: 16, alignItems: "center" },
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
  },
  disciplinaNome: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a237e",
    marginLeft: 10,
  },
  emoji: {
    fontSize: 30,
  },
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
  cardExame: {
    backgroundColor: "#e8f5e9",
    borderLeftWidth: 6,
    borderLeftColor: "#43a047",
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
  cardResumos: {
    backgroundColor: "#e3f2fd",
    borderLeftWidth: 6,
    borderLeftColor: "#1e88e5",
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
  cardRanking: {
    backgroundColor: "#ffebee",
    borderLeftWidth: 6,
    borderLeftColor: "#e53935",
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
  },
  cardButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
});
