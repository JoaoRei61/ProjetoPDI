import React, { useEffect, useState } from "react";
import supabase from "../helper/supabaseconfig";
import { Navigate } from "react-router-dom";

function Wrapper({ children }) { 
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            // !!null --> false
            // !!object --> true
            setAuthenticated(!!session); 
            setLoading(false);
        };

        getSession(); 
    }, []); 
    if (loading) {
        return <p>A carregar...</p>;
    } else {
        if (!authenticated) {
            return {children};
    }
    return <Navigate to="/login" />;
    }
}
export default Wrapper;