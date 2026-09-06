import '../styles/globals.css';
import { useEffect } from 'react';
import Head from 'next/head';
import { useAuthStore } from '../store/authStore';

export default function App({ Component, pageProps }) {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <>
      <Head>
        <title>Agentflow_AI – Agentic AI Operations Automation Platform</title>
        <meta
          name="description"
          content="Turn natural language operational prompts into executable visual workflows coordinated by cooperating AI agents."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
