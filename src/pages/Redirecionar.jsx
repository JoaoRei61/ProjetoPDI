import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../helper/supabaseconfig";

const Redirecionar = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      const userId = session.user.id;

      const { data, error } = await supabase
        .from("utilizadores")
        .select("tipo_conta")
        .eq("id", userId)
        .single();

      if (error || !data) {
        navigate("/login");
        return;
      }

      if (data.tipo_conta === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/user");
      }

      setLoading(false);
    };

    checkRole();
  }, [navigate]);

  return loading ? <p>A carregar...</p> : null;
};

export default Redirecionar;
