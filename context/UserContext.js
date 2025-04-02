import React, { createContext, useState, useContext } from "react";

// Criar o contexto
const UserContext = createContext(null);

// Hook para facilitar o uso do contexto
export const useUser = () => useContext(UserContext);

// Provedor do contexto global
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children} {/* Garante que o children é renderizado corretamente */}
    </UserContext.Provider>
  );
};
