import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStorageData() {
            const storageUser = localStorage.getItem('@FOCA:user');
            const storageToken = localStorage.getItem('@FOCA:token');

            if (storageUser && storageToken) {
                api.defaults.headers.Authorization = `Bearer ${storageToken}`;
                try {
                    const response = await api.get('users/validarToken');
                    setUser(response.data.user);
                } catch (error) {
                    console.log(error);
                    localStorage.removeItem('@FOCA:user');
                    localStorage.removeItem('@FOCA:token');
                }
            }
            setLoading(false);
        }
        loadStorageData();
    }, []);

    const logout = () => {
        localStorage.removeItem('@FOCA:user');
        localStorage.removeItem('@FOCA:token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ signed: !!user, user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
