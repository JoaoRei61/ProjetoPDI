import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Provider as PaperProvider } from "react-native-paper";
import { ActivityIndicator, View, Platform, Alert } from "react-native";
import * as MediaLibrary from "expo-media-library";
import { AuthProvider, useAuth } from "./context/AuthProvider";

// Screens
import PaginaInicial from "./screens/PaginaInicial";
import PDFViewerScreen from "./screens/PDFViewerScreen";
import ExerciciosScreen from "./screens/ExerciciosScreen";
import DisciplinasScreen from "./screens/DisciplinasScreen";
import MaterialScreen from "./screens/MaterialScreen";
import examesScreen from "./screens/examesScreen";
import ExamesPerguntasScreen from "./screens/ExamesPerguntasScreen";
import ExerciciosPerguntasScreen from "./screens/ExerciciosPerguntasScreen";
import CriarQuizScreen from "./screens/CriarQuizScreen";
import LoginScreen from "./screens/LoginScreen";
import CriarContaScreen from "./screens/CriarContaScreen";
import ConquistasScreen from "./screens/ConquistasScreen";
import ResumosScreen from "./screens/ResumosScreen";
import RankingScreen from "./screens/RankingScreen";
import GerirContaScreen from "./screens/GerirConta";
import SplashScreen from "./screens/SplashScreen";

import { LogBox } from "react-native";
LogBox.ignoreLogs([
  "Warning: Text strings must be rendered within a <Text> component",
  "Warning: ref.measureLayout must be called with a ref to a native component.",
]);

const Stack = createStackNavigator();

async function pedirPermissoesFicheiros() {
  if (Platform.OS === "android") {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão necessária",
        "A aplicação precisa de permissão para aceder aos seus ficheiros e permitir uploads."
      );
    }
  }
}

function AppNavigator() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true); // controla quando esconder splash

  // Enquanto a splash estiver visível, mostramos ela
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Enquanto estamos a carregar o estado do utilizador, mostramos loading
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6200ea" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="PaginaInicial" component={PaginaInicial} />
          <Stack.Screen name="PDFViewerScreen" component={PDFViewerScreen} />
          <Stack.Screen name="Disciplinas" component={DisciplinasScreen} />
          <Stack.Screen name="MaterialScreen" component={MaterialScreen} />
          <Stack.Screen name="Exames" component={examesScreen} />
          <Stack.Screen name="ExamesPerguntasScreen" component={ExamesPerguntasScreen} />
          <Stack.Screen name="ExerciciosPerguntasScreen" component={ExerciciosPerguntasScreen} />
          <Stack.Screen name="CriarQuiz" component={CriarQuizScreen} />
          <Stack.Screen name="ExerciciosScreen" component={ExerciciosScreen} />
          <Stack.Screen name="Conquistas" component={ConquistasScreen} />
          <Stack.Screen name="Resumos" component={ResumosScreen} />
          <Stack.Screen name="Ranking" component={RankingScreen} />
          <Stack.Screen name="GerirConta" component={GerirContaScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="CriarConta" component={CriarContaScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const App = () => {
  useEffect(() => {
    pedirPermissoesFicheiros();
  }, []);

  return (
    <AuthProvider>
      <PaperProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </PaperProvider>
    </AuthProvider>
  );
};

export default App;
