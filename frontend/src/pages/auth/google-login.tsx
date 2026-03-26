import React from 'react'

import { Loading } from "../loading";

export const GoogleLogin = () => {
  const authorize = async () => {
    const queryParams = new URLSearchParams(window.location.search)
    const code = queryParams.get('code');
    const state = queryParams.get('state');
    if (code) {
      try {
        const response = await fetch('http://localhost:3000/oauth/google/handle-code', {
          method: "POST",
          credentials: 'include',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            state,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.log(response.status);
          return;
        }

        localStorage.setItem('picture', data.picture);
        localStorage.setItem('accessToken', data.accessToken);

        // change to dashboard later
        window.location.href = `${import.meta.env.VITE_API_URL}/new-chart`;
      } catch (err) {
        console.log(err);
      }
      

    }
  }
  
  React.useEffect(() => { authorize() }, []);
  
  return (
    <Loading message="Logging in"/>
  )
}
