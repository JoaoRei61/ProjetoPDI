import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { useAuth } from "../context/AuthProvider";

export default function LoginScreen({ navigation }) {
  const { supabase, setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha todos os campos!");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert("Erro ao entrar", error.message);
      setLoading(false);
      return;
    }

    const user = data.user;
    if (!user) {
      Alert.alert("Erro", "Não foi possível obter os dados do usuário.");
      setLoading(false);
      return;
    }

    const { data: userData, error: userError } = await supabase
      .from("utilizadores")
      .select("idcurso, tipo_conta, nome, telefone")
      .eq("id", user.id)
      .single();

    if (userError) {
      Alert.alert("Erro", "Não foi possível carregar os dados do usuário.");
      setLoading(false);
      return;
    }

    const userWithDetails = { ...user, ...userData };
    setUser(userWithDetails);

    setLoading(false);

    setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: "PaginaInicial" }] });
    }, 100);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Image source={require("../assets/logo.jpeg")} style={styles.logo} />
        <Text style={styles.title}>Login</Text>

        <TextInput
          style={styles.input}
          placeholder="email@domain.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Palavra passe"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#0056b3" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.orText}>ou</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("CriarConta")}
        >
          <Text style={styles.buttonText}>Criar Conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logo: {
    width: 270,
    height: 270,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  button: {
    width: "100%",
    backgroundColor: "#0056b3",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  orText: {
    color: "#666",
    marginVertical: 10,
    fontSize: 16,
  },
});
