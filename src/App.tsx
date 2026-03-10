import { useMemo, useState } from 'react';
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
import { useAtualizacao } from './hooks/useAtualizacao';

const variantesConteudo = {
  oculto: { opacity: 0, x: 16, filter: 'blur(4px)' },
  visivel: { opacity: 1, x: 0, filter: 'blur(0px)' },
  saindo: { opacity: 0, x: -16, filter: 'blur(4px)' },
};

function App() {
  const [secaoAtiva, definirSecaoAtiva] = useState<SecaoAtiva>('instancias');
  const { instancias } = useInstancias();
  const {
    versaoAtual,
    versaoDisponivel,
    urlRelease,
    temNovaVersao,
  } = useAtualizacao();

  const urlReleaseFallback = useMemo(() => urlRelease ?? 'https://github.com/Dragons-Forge/dragons-manager/releases/latest', [urlRelease]);

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
        versaoAtual={versaoAtual}
        versaoDisponivel={versaoDisponivel}
        temNovaVersao={temNovaVersao}
        urlRelease={urlReleaseFallback}
      />

      {/* Área de conteúdo principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {temNovaVersao && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-500/10 border-b border-amber-500/30 text-amber-100">
            <div className="text-sm font-semibold">
              Nova versão disponível: {versaoDisponivel}
            </div>
            <a
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500/30 border border-amber-500/50 hover:bg-amber-500/40 transition-colors"
              href={urlReleaseFallback}
              target="_blank"
              rel="noreferrer"
            >
              Ver release
            </a>
          </div>
        )}
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
