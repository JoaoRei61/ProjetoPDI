import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../helper/supabaseconfig";

const Redirecionar = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      const { data: user } = await supabase.auth.getUser();
      const userId = user?.user?.id;

      const { data, error } = await supabase
        .from("utilizadores")
        .select("tipo_conta")
        .eq("id", userId)
        .single();

      if (!error) {
        if (data.tipo_conta === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/user");
        }        
      }
      setLoading(false);
    };

    checkRole();
  }, [navigate]);

  return loading ? <p>A carregar...</p> : null;
};

export default Redirecionar;
