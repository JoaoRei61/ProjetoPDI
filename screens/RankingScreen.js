import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import supabase from "../supabaseconfig";
import Header from "../componentes/header";

export default function RankingScreen({ route, navigation }) {
  const { iddisciplina } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [quizzes, setQuizzes] = useState([]); // guardará os quizzes filtrados

  useEffect(() => {
    if (!iddisciplina) {
      setErrorMessage("Erro: iddisciplina não foi fornecido.");
      setLoading(false);
      return;
    }
    fetchRanking(iddisciplina);
  }, [iddisciplina]);

  const fetchRanking = async (idd) => {
    try {
      setLoading(true);
      setErrorMessage("");
      setQuizzes([]);

      // Busca todos os quizzes com a iddisciplina especificada, ordenando por pontuacao decrescente
      const { data, error } = await supabase
        .from("quizzes")
        .select("idquiz, nome, pontuacao, tipo_conta, email") // selecione os campos que precisar
        .eq("iddisciplina", idd)
        .order("pontuacao", { ascending: false }); // maior pontuação primeiro

      if (error) {
        console.error("Erro ao buscar ranking:", error);
        setErrorMessage("Não foi possível carregar o ranking.");
      } else {
        if (!data || data.length === 0) {
          setErrorMessage("Nenhum quiz encontrado para esta disciplina.");
        } else {
          setQuizzes(data);
        }
      }
    } catch (err) {
      console.error("Erro inesperado ao carregar ranking:", err);
      setErrorMessage("Erro ao carregar o ranking.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ranking da Disciplina</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#6200ea" style={styles.loader} />
        ) : errorMessage ? (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        ) : (
          quizzes.map((quiz, index) => (
            <View key={`quiz-${quiz.idquiz}`} style={styles.quizCard}>
              <Text style={styles.posicaoText}>{index + 1}º</Text>
              <Text style={styles.nomeText}>{quiz.nome}</Text>
              <Text style={styles.pontuacaoText}>Pontuação: {quiz.pontuacao}</Text>
              {/* Caso queira exibir email ou tipo_conta: */}
              {/* <Text style={styles.tipoContaText}>{quiz.tipo_conta}</Text> */}
            </View>
          ))
        )}

        {/* Botão para voltar, se desejar */}
        <TouchableOpacity style={styles.voltarButton} onPress={() => navigation.goBack()}>
          <Text style={styles.voltarButtonText}>Voltar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ================== ESTILOS ==================
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
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 20,
    textAlign: "center",
  },
  errorMessage: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  quizCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
  },
  posicaoText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 5,
  },
  nomeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 3,
  },
  pontuacaoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  // Caso queira exibir tipo_conta ou email, basta criar estilo
  // tipoContaText: {...}
  
  voltarButton: {
    backgroundColor: "#0056b3",
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 20,
  },
  voltarButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
