import React from 'react'
import { ScaleLoader } from 'react-spinners';

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
    <div className='flex min-h-screen items-center justify-center'>
      <ScaleLoader height={20} width={4} margin={1} />
      <span className="text-xl ml-2 font-semibold">
        Logging in
      </span>
    </div>
  )
}
