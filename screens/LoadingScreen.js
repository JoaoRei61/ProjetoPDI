import React, { useRef, useEffect, useState } from "react";
import { View, Animated, StyleSheet, Dimensions, Easing, Text } from "react-native";

const { width, height } = Dimensions.get("window");

export default function SplashScreen({ onFinish }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [animacaoTerminada, setAnimacaoTerminada] = useState(false);

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 2000, // mais rápido
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      setAnimacaoTerminada(true);
    });
  }, []);

  useEffect(() => {
    if (animacaoTerminada) {
      const timer = setTimeout(() => {
        if (onFinish) onFinish();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [animacaoTerminada]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "1440deg"], // 4 voltas
  });

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("../assets/logo.jpeg")}
        style={[
          styles.logo,
          {
            transform: [{ rotate }],
          },
        ]}
        resizeMode="contain"
      />
      <Text style={styles.texto}>Aguarde um pouco, estamos a pensar!</Text>
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
    width: width * 0.25,
    height: height * 0.15,
  },
  texto: {
    marginTop: 20,
    fontSize: 16,
    color: "#333",
    fontStyle: "italic",
  },
});
