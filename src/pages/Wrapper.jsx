import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import supabase from "../helper/supabaseconfig";

function Wrapper({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthenticated(!!session);
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) return <p>A carregar...</p>;

  if (!authenticated) return <Navigate to="/login" replace />;

  return children;
}

export default Wrapper;
