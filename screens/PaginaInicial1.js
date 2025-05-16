import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Animated, Pressable, Dimensions } from 'react-native';
import Header1 from '../componentes/header1';
import { useAuth } from '../context/AuthProvider';
import PolitecnicoLogo from '../assets/politecnico.png';
import IscacLogo from '../assets/iscaclogo.png';

const { width } = Dimensions.get('window');
const BUTTON_WIDTH = width * 0.8;

function ActionButton({ label, onPress }) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.buttonText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function PaginaInicial1({ navigation }) {
  const { user, supabase } = useAuth();
  const [nome, setNome] = useState('Professor');

  useEffect(() => {
    const fetchNome = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('utilizadores')
        .select('nome')
        .eq('id', user.id)
        .maybeSingle();
      if (!error && data) setNome(data.nome);
    };
    fetchNome();
  }, [user, supabase]);

  return (
    <View style={styles.container}>
      <Header1 />
      <View style={styles.contentWrapper}>

        {/* Logo wrapper: imagens lado a lado */}
        <View style={styles.logoWrapper}>
          <Image source={PolitecnicoLogo} style={styles.logo} />
          <Image source={IscacLogo}      style={styles.logo} />
        </View>

        <Text style={styles.title}>Bem-vindo, Professor(a) {nome}!</Text>
        <ActionButton
          label="Gerir Conteúdos Disponibilizados"
          onPress={() => navigation.navigate('GerirConteudos')}
        />
        <ActionButton
          label="Gerir exercicios"
          onPress={() => navigation.navigate('GerirExercicos')}
        />
        <ActionButton
          label="Visualizar Ranking"
          onPress={() => navigation.navigate('Ranking')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  logoWrapper: {
    flexDirection: 'row',       // lado a lado
    justifyContent: 'center',   // centraliza horizontalmente
    alignItems: 'center',       // centraliza verticalmente
    marginBottom: 60,  
    marginTop: -60,          // espaço abaixo
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginHorizontal: 40,      // espaço entre elas
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'rgb(70, 88, 148)',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    width: BUTTON_WIDTH,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: 'rgba(46, 96, 233, 0.67)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  buttonPressed: {
    backgroundColor: 'rgb(129, 235, 235)',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
