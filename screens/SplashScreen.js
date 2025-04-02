import React, { useRef, useEffect, useState } from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export default function SplashScreen({ onFinish }) {
  const scaleAnim = useRef(new Animated.Value(0.05)).current;
  const [animacaoTerminada, setAnimacaoTerminada] = useState(false);

  useEffect(() => {
    // Faz o zoom até 1 (tamanho normal) em 3 segundos
    Animated.timing(scaleAnim, {
      toValue: 1.3,
      duration: 4000,
      useNativeDriver: true,
    }).start(() => {
      // Quando a animação termina, marca como “estável”
      setAnimacaoTerminada(true);
    });
  }, []);

  useEffect(() => {
    if (animacaoTerminada) {
      // Espera mais 2 segundos com o logo parado
      const timer = setTimeout(() => {
        if (onFinish) onFinish(); // chama a função para sair da splash
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [animacaoTerminada]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("../assets/logo.jpeg")}
        style={[
          styles.logo,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: width * 0.6,
    height: height * 0.3,
  },
});
