import React from 'react'

import { Loading } from "../loading";

export const GoogleLogin = () => {
  const authorize = () => {
    const queryParams = new URLSearchParams(window.location.search)
    const code = queryParams.get('code');
    const state = queryParams.get('state');
    if (code) {
      fetch('http://localhost:3000/oauth/google/handle-code', {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          state,
        }),
      })
        .then(res => {
          if (!res.ok) throw new Error("OAuth failed");
          window.location.href = import.meta.env.VITE_API_URL;
        })
        .catch(console.error);
    }
  }
  
  React.useEffect(authorize, []);
  
  return (
    <Loading message="Logging in"/>
  )
}
