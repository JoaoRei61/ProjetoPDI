import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Text, Image } from "react-native";
import { Appbar, List, Button, ActivityIndicator, Card } from "react-native-paper";
import { useAuth } from "../context/AuthProvider";
import supabase from "../supabaseconfig"; // Certifica-te de que o caminho está correto

const CursosScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [cursoNome, setCursoNome] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCursos, setShowCursos] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCursos(user);
    }
  }, [user]);

  const fetchCursos = async (user) => {
    setLoading(true);

    try {
      // Buscar todos os cursos para professores
      const { data: cursosData, error: cursosError } = await supabase.from("cursos").select("*");
      if (cursosError) {
        console.error("Erro ao buscar cursos:", cursosError);
      } else {
        setCursos(cursosData);
      }

      // Buscar nome do curso do aluno
      if (user?.user_metadata?.curso_id) {
        const { data: cursoData, error: cursoError } = await supabase
          .from("cursos")
          .select("nome")
          .eq("idcurso", user.user_metadata.curso_id)
          .single();

        if (cursoError) {
          console.error("Erro ao buscar nome do curso:", cursoError);
        } else {
          setCursoNome(cursoData?.nome || "Curso Desconhecido");
        }
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    console.log("Usuário deslogado");
    navigation.replace("Login"); // Redireciona para LoginScreen após logout
  };

  if (!user) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator animating={true} size="large" color="#6200ea" />
      </View>
    );
  }

  const renderAlunoView = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.welcomeText}>Bem-vindo, {user.user_metadata?.nome || "Aluno"}!</Text>
      <Card style={styles.infoCard}>
        <Card.Title title={cursoNome} left={(props) => <List.Icon {...props} icon="book" />} />
        <Card.Content>
          <Text>Explora as disciplinas disponíveis em {cursoNome}.</Text>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => navigation.navigate("Disciplinas", { cursoId: user.user_metadata?.curso_id })}>
            Ver Disciplinas
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );

  const renderProfessorView = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.welcomeText}>Bem-vindo Professor {user.user_metadata?.nome || "Professor"}!</Text>
      <Button mode="contained" onPress={() => setShowCursos(!showCursos)} style={styles.button}>
        {showCursos ? "Esconder Cursos" : "Ver Cursos"}
      </Button>

      <Button mode="contained" onPress={() => navigation.navigate("CriarQuiz", { userId: user.id })} style={[styles.button, styles.createQuizButton]}>
        Criar Quiz
      </Button>

      {showCursos && (
        <ScrollView style={styles.scrollView}>
          <List.Section title="Cursos Disponíveis">
            {cursos.map((curso) => (
              <List.Item
                key={curso.idcurso}
                title={curso.nome}
                left={(props) => <List.Icon {...props} icon="school" />}
                onPress={() => navigation.navigate("Disciplinas", { cursoId: curso.idcurso })}
              />
            ))}
          </List.Section>
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content title="Plataforma Educativa" />
        <Appbar.Action icon="logout" onPress={handleLogout} />
      </Appbar.Header>

      <ScrollView>
        <View style={styles.imageContainer}>
          <Image source={require("../assets/ipc.png")} style={styles.logo} />
          <Image source={require("../assets/iscac.png")} style={styles.logo} />
        </View>

        {loading ? (
          <ActivityIndicator animating={true} size="large" color="#6200ea" style={styles.loader} />
        ) : user.user_metadata?.tipo_conta === "professor" ? (
          renderProfessorView()
        ) : (
          renderAlunoView()
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  appbar: {
    backgroundColor: "#6200ea",
  },
  imageContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  contentContainer: {
    padding: 16,
  },
  welcomeText: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 10,
  },
  button: {
    marginVertical: 8,
    backgroundColor: "#6200ea",
  },
  createQuizButton: {
    backgroundColor: "#03dac6",
  },
  scrollView: {
    marginBottom: 20,
  },
  infoCard: {
    marginVertical: 10,
  },
  loader: {
    marginTop: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CursosScreen;
