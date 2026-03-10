import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './App.css';
import { BarraLateral } from './components/BarraLateral';
import { SecaoInstancias } from './components/SecaoInstancias';
import { SecaoBuscarUsuario } from './components/SecaoBuscarUsuario';
import { SecaoContas } from './components/SecaoContas';
import { SecaoSobre } from './components/SecaoSobre';
import { SecaoJogos } from './components/SecaoJogos';
import { SecaoAtiva } from './tipos';
import { useInstancias } from './hooks/useInstancias';

const variantesConteudo = {
  oculto: { opacity: 0, x: 16, filter: 'blur(4px)' },
  visivel: { opacity: 1, x: 0, filter: 'blur(0px)' },
  saindo: { opacity: 0, x: -16, filter: 'blur(4px)' },
};

function App() {
  const [secaoAtiva, definirSecaoAtiva] = useState<SecaoAtiva>('instancias');
  const { instancias } = useInstancias();

  return (
    <div
      className="flex h-screen w-screen overflow-hidden select-none fundo-grade"
      style={{ background: 'var(--color-fundo)' }}
    >
      {/* Barra lateral de navegação */}
      <BarraLateral
        secaoAtiva={secaoAtiva}
        aoSelecionarSecao={definirSecaoAtiva}
        quantidadeInstancias={instancias.length}
      />

      {/* Área de conteúdo principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Conteúdo com transição animada */}
        <AnimatePresence mode="wait">
          <motion.div
            key={secaoAtiva}
            variants={variantesConteudo}
            initial="oculto"
            animate="visivel"
            exit="saindo"
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 overflow-y-auto custom-scrollbar p-8 pr-10"
          >
            {secaoAtiva === 'instancias' && <SecaoInstancias />}
            {secaoAtiva === 'buscar' && <SecaoBuscarUsuario />}
            {secaoAtiva === 'contas' && <SecaoContas />}
            {secaoAtiva === 'jogos' && <SecaoJogos />}
            {secaoAtiva === 'sobre' && <SecaoSobre />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
