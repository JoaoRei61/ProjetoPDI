import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Modal, View, Text, StyleSheet, Button } from "react-native";
import supabase from "../supabaseconfig";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const mainTimerRef = useRef(null);
  const subTimerRef = useRef(null);
  const [showInactivityModal, setShowInactivityModal] = useState(false);

  const logout = async () => {
    console.log("👋 Sessão terminada ou encerrada pelo utilizador.");
    await supabase.auth.signOut();
    setUser(null);
  };

  const startMainTimer = () => {
    stopMainTimer();
    mainTimerRef.current = setTimeout(() => {
      setShowInactivityModal(true);
      subTimerRef.current = setTimeout(() => {
        console.log("⌛ Pop-up ignorado. Fazendo logout...");
        setShowInactivityModal(false);
        logout();
      }, 60 * 1000);
    }, 30 * 60 * 1000);
  };

  const stopMainTimer = () => {
    if (mainTimerRef.current) {
      clearTimeout(mainTimerRef.current);
      mainTimerRef.current = null;
    }
  };

  const stopSubTimer = () => {
    if (subTimerRef.current) {
      clearTimeout(subTimerRef.current);
      subTimerRef.current = null;
    }
  };

  const continueSession = () => {
    console.log("✅ Sessão continua. Reiniciando timer principal...");
    setShowInactivityModal(false);
    stopSubTimer();
    startMainTimer();
  };

  const handleUserInteraction = () => {
    if (showInactivityModal) {
      continueSession();
    } else {
      startMainTimer();
    }
  };

  useEffect(() => {
    const encerrarSessaoInicial = async () => {
      await supabase.auth.signOut();
      setUser(null);
    };

    const fetchUserSession = async () => {
      setLoading(true);
      try {
        await encerrarSessaoInicial();
        setUser(null); // força user como null
      } catch (err) {
        console.error("❌ Erro ao forçar logout inicial:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    startMainTimer();

    return () => {
      authListener?.subscription?.unsubscribe();
      stopMainTimer();
      stopSubTimer();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        supabase,
        handleUserInteraction,
      }}
    >
      {children}

      {showInactivityModal && (
        <Modal transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Ainda está aí? 👋</Text>
              <Text style={styles.modalText}>
                Sua sessão irá expirar em 1 minuto por inatividade.
              </Text>
              <Button title="Continuar" onPress={continueSession} />
            </View>
          </View>
        </Modal>
      )}
    </AuthContext.Provider>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
});

export const useAuth = () => useContext(AuthContext);

