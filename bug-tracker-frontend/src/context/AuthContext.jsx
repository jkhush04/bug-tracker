import {createContext, useState, useEffect } from 'react';

import {authApi} from '../api/authApi';

export const AuthContext = createContext(null);

export function AuthProvider({ children }){

      const [user , setUser ] = useState(null);
      const [ token , setToken ] = useState(()=> localStorage.getItem('token'));
      const [loading ,setLoading] = useState(true);



      useEffect(()=>{
      const restoreUser = async()=>{
          const savedToken = localStorage.getItem('token');
      if(!savedToken){
           setLoading(false);
           return;
           }

           try{

             const userData = await authApi.getCurrentUser();
             setUser(userData);

           }
           catch(err){
           localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            }
            finally{
            setLoading(false);
            }

           }
           restoreUser();
           },[]);


const login = async (email, password)=>{
         const data = await authApi.login({email, password});
         localStorage.setItem('token', data.token);
         setToken(data.token);
         const userData = await authApi.getCurrentUser();
         setUser(userData);
         return userData;
};

const register = async (name ,email, password, role)=>{
  return await authApi.register({name , email, password, role});
};

const logout = () => {
localStorage.removeItem('token');
setToken(null);
setUser(null);
};

return (
<AuthContext.Provider value={{
user, token , loading , login , register, logout}}>
  {children}
  </AuthContext.Provider>
);

}
