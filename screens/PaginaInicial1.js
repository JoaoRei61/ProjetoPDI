import React from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Dimensions } from 'react-native';
import Header1 from '../componentes/header1';

const { width } = Dimensions.get('window');
const BUTTON_WIDTH = width * 0.8;

function ActionButton({ label, onPress }) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

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
  return (
    <View style={styles.container}>
      <Header1 />
      <Text style={styles.title}>Bem-vindo, Professor!</Text>
      <ActionButton
        label="Gerir Conteúdos"
        onPress={() => navigation.navigate('GerirConteudos')}
      />
      <ActionButton
        label="Ver Submissões de Resumos"
        onPress={() => navigation.navigate('SubmissoesResumos')}
      />
      <ActionButton
        label="Visualizar Ranking"
        onPress={() => navigation.navigate('Ranking')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    alignItems: 'center',
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginVertical: 20,
  },
  button: {
    width: BUTTON_WIDTH,
    backgroundColor: '#E53935',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  buttonPressed: {
    backgroundColor: '#C62828',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
