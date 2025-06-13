import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import Header from "../componentes/header";
import supabase from "../supabaseconfig";
import LoadingScreen from "../screens/LoadingScreen";

export default function RankingScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [ranking, setRanking] = useState([]); // array => { idutilizador, pontos, utilizadores: { nome, apelido } }

  // Animações pódio
  const scaleAnim1 = useRef(new Animated.Value(0)).current; // 1º lugar
  const scaleAnim2 = useRef(new Animated.Value(0)).current; // 2º lugar
  const scaleAnim3 = useRef(new Animated.Value(0)).current; // 3º lugar

  useEffect(() => {
    fetchRankingGlobal();
  }, []);

  useEffect(() => {
    if (ranking.length >= 3) {
      animatePodium();
    }
  }, [ranking]);

  const fetchRankingGlobal = async () => {
    try {
      setLoading(true); // Ativa o loading
  
      const { data, error } = await supabase
        .from("rank")
        .select("idutilizador, pontos, utilizadores!inner(nome, apelido)")
        .order("pontos", { ascending: false });
  
      if (error) {
        console.error("Erro ao buscar rank global:", error);
        setErrorMessage("Erro ao carregar ranking global.");
      } else if (!data || data.length === 0) {
        setErrorMessage("Não há ninguém no ranking global ainda.");
      } else {
        setRanking(data);
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar ranking:", err);
      setErrorMessage("Erro ao carregar ranking global.");
    } finally {
      setLoading(false); // Desativa o loading
    }
  };  

  // Animação do pódio (top 3)
  const animatePodium = () => {
    Animated.sequence([
      // 2º lugar
      Animated.timing(scaleAnim2, {
        toValue: 1,
        duration: 500,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
      // 1º lugar
      Animated.timing(scaleAnim1, {
        toValue: 1,
        duration: 500,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
      // 3º lugar
      Animated.timing(scaleAnim3, {
        toValue: 1,
        duration: 500,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Top 3 para o pódio
  const top3 = ranking.slice(0, 3);

  if (loading) return <LoadingScreen onFinish={null} />;

  // === RENDER ===
  return (
    <View style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ranking Global</Text>

        {errorMessage ? <LoadingScreen onFinish={null} /> : null}
        {loading && <ActivityIndicator size="large" color="#6200ea" style={styles.loader} />}

        {/* Pódio (top 3) */}
        {top3.length === 3 && !loading && (
          <View style={styles.podioContainer}>
            {/* 2º lugar */}
            <Animated.View
              style={[
                styles.podioStand,
                styles.secondPlace,
                { transform: [{ scale: scaleAnim2 }] },
              ]}
            >
              <Text style={styles.podioPos}>2º</Text>
              <Text style={styles.podioNome}>
                {top3[1].utilizadores?.nome || "User"}{" "}
                {top3[1].utilizadores?.apelido || ""}
              </Text>
              <Text style={styles.podioPoints}>{top3[1].pontos.toFixed(2)} pts</Text>
            </Animated.View>

            {/* 1º lugar */}
            <Animated.View
              style={[
                styles.podioStand,
                styles.firstPlace,
                { transform: [{ scale: scaleAnim1 }] },
              ]}
            >
              <Text style={styles.podioPos}>1º</Text>
              <Text style={styles.podioNome}>
                {top3[0].utilizadores?.nome || "User"}{" "}
                {top3[0].utilizadores?.apelido || ""}
              </Text>
              <Text style={styles.podioPoints}>{top3[0].pontos.toFixed(2)} pts</Text>
            </Animated.View>

            {/* 3º lugar */}
            <Animated.View
              style={[
                styles.podioStand,
                styles.thirdPlace,
                { transform: [{ scale: scaleAnim3 }] },
              ]}
            >
              <Text style={styles.podioPos}>3º</Text>
              <Text style={styles.podioNome}>
                {top3[2].utilizadores?.nome || "User"}{" "}
                {top3[2].utilizadores?.apelido || ""}
              </Text>
              <Text style={styles.podioPoints}>{top3[2].pontos.toFixed(2)} pts</Text>
            </Animated.View>
          </View>
        )}
        {top3.length < 3 && !loading && (
          <Text style={[styles.infoText, { marginBottom: 10 }]}>
            Ainda não há 3 participantes no pódio...
          </Text>
        )}

        {/* Lista de TODOS (Classificação Geral) */}
        {ranking.length > 0 && (
          <>
            <Text style={styles.subtitle}>Classificação Geral</Text>
            {ranking.map((item, index) => (
              <View style={styles.rankingItem} key={index}>
                <Text style={styles.rankPosition}>{index + 1}º</Text>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.rankName}>
                    {item.utilizadores?.nome || "User"}{" "}
                    {item.utilizadores?.apelido || ""}
                  </Text>
                  <Text style={styles.rankPoints}>{item.pontos.toFixed(2)} pontos</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f4f6fa' 
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1a237e",
    marginBottom: 20,
    textAlign: "center",
    textShadowColor: "#ccc",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    padding: 16,
    alignItems: "center",
  },
  loader: {
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
  fontSize: 20,
  fontWeight: "700",
  color: "#3949ab",
  marginVertical: 20,
  alignSelf: "flex-start",
},

  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },

  // Pódio
  podioContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: 30,
  },
  podioStand: {
    width: 100,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    padding: 14,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  firstPlace: {
    height: 150,
    backgroundColor: "#fff9c4", // dourado suave
  },
  secondPlace: {
    height: 120,
    backgroundColor: "#e0e0e0",
  },
  thirdPlace: {
    height: 100,
    backgroundColor: "#d7ccc8",
  },
  podioPos: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3949ab",
  },
  podioNome: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  podioPoints: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },


  // Classificação geral
  rankingItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankPosition: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0056b3",
    minWidth: 40,
    textAlign: "right",
  },
  rankName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a237e",
  },
  rankPoints: {
    fontSize: 14,
    color: "#555",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
});
