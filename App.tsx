import { Buffer } from 'buffer';
(global as any).Buffer = Buffer;

import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { ActivityIndicator, View, LogBox } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthProvider';

// Suprimir avisos do React Native
LogBox.ignoreLogs([
  'Warning: Text strings must be rendered within a <Text> component',
  'Warning: ref.measureLayout must be called with a ref to a native component.',
  'Warning: useInsertionEffect must not schedule updates',
  'Warning: Invalid prop `compact` supplied to `React.Fragment`',
  'VirtualizedLists should never be nested inside plain ScrollViews',
]);

// Telas do app
import PaginaInicial from './screens/PaginaInicial';

import GerirConteudos from './screens/GerirConteudos';
import GerirExercicios from './screens/GerirExercicios';
import PaginaInicial1 from './screens/PaginaInicial1';
import PDFViewerScreen from './screens/PDFViewerScreen';
import ExerciciosScreen from './screens/ExerciciosScreen';
import DisciplinasScreen from './screens/DisciplinasScreen';
import MaterialScreen from './screens/MaterialScreen';
import ExamesScreen from './screens/ExamesScreen';
import ExamesPerguntasScreen from './screens/ExamesPerguntasScreen';
import ExerciciosPerguntasScreen from './screens/ExerciciosPerguntasScreen';
import LoginScreen from './screens/LoginScreen';
import CriarContaScreen from './screens/CriarContaScreen';
import ConquistasScreen from './screens/ConquistasScreen';
import ResumosScreen from './screens/ResumosScreen';
import RankingScreen from './screens/RankingScreen';
import SplashScreen from './screens/SplashScreen';
import GerirConta from './screens/GerirConta';


const Stack = createStackNavigator();

function AppNavigator() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200ea" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="PaginaInicial" component={PaginaInicial} />
          <Stack.Screen name="GerirConteudos" component={GerirConteudos} />
          <Stack.Screen name="GerirExercicios" component={GerirExercicios} />
          <Stack.Screen name="GerirConta" component={GerirConta} />
          <Stack.Screen name="PaginaInicial1" component={PaginaInicial1} />
          <Stack.Screen name="PDFViewer" component={PDFViewerScreen} />
          <Stack.Screen name="Disciplinas" component={DisciplinasScreen} />
          <Stack.Screen name="Material" component={MaterialScreen} />
          <Stack.Screen name="Exames" component={ExamesScreen} />
          <Stack.Screen name="ExamesPerguntas" component={ExamesPerguntasScreen} />
          <Stack.Screen name="ExerciciosScreen" component={ExerciciosScreen} />
          <Stack.Screen name="ExerciciosPerguntas" component={ExerciciosPerguntasScreen} />
          <Stack.Screen name="Conquistas" component={ConquistasScreen} />
          <Stack.Screen name="Resumos" component={ResumosScreen} />
          <Stack.Screen name="Ranking" component={RankingScreen} />
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

const App: React.FC = () => (
  <AuthProvider>
    <PaperProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </PaperProvider>
  </AuthProvider>
);

export default App;
