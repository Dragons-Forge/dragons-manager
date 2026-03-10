import { motion } from 'framer-motion';
import { Github, Heart, Shield, Zap, Users, Gamepad2, UserCircle } from 'lucide-react';

const funcionalidades = [
  {
    Icone: Zap,
    titulo: 'Múltiplas Instâncias',
    descricao: 'Lance quantas instâncias do Roblox quiser simultaneamente usando a técnica do mutex do Windows.',
    cor: 'from-[var(--color-primaria)] to-[var(--color-acento)]',
  },
  {
    Icone: Users,
    titulo: 'Monitoramento em Tempo Real',
    descricao: 'Veja todas as instâncias ativas, seus PIDs e tempo de execução atualizados a cada 3 segundos.',
    cor: 'from-cyan-500 to-emerald-500',
  },
  {
    Icone: Gamepad2,
    titulo: 'Biblioteca de Jogos',
    descricao: 'Explore o catálogo do Roblox, pesquise jogos e inicie instâncias diretamente nas suas contas salvas.',
    cor: 'from-blue-500 to-indigo-500',
  },
  {
    Icone: UserCircle,
    titulo: 'Múltiplas Contas',
    descricao: 'Salve suas contas e alterne entre elas com um clique para jogar em qualquer instância ou cliente.',
    cor: 'from-fuchsia-500 to-pink-500',
  },
  {
    Icone: Shield,
    titulo: 'Busca de Perfil',
    descricao: 'Consulte avatares e informações de qualquer jogador Roblox usando a API pública oficial.',
    cor: 'from-amber-500 to-orange-500',
  },
];

export function SecaoSobre() {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Hero */}
      <div className="text-center py-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5"
          style={{ background: 'linear-gradient(135deg, var(--cor-primaria), var(--cor-acento))' }}
        >
          <span className="text-4xl">🎮</span>
        </motion.div>

        <motion.h2
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold gradient-text mb-2"
          style={{ fontFamily: 'var(--fonte-heading)' }}
        >
          MultiRoblox Manager
        </motion.h2>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm max-w-sm mx-auto"
          style={{ color: 'var(--cor-texto-suave)' }}
        >
          Uma versão moderna e elegante do utilitário MultiRoblox, construída com Tauri + React.
        </motion.p>
      </div>

      {/* Funcionalidades */}
      <div className="space-y-3 mb-6">
        {funcionalidades.map(({ Icone, titulo, descricao, cor }, i) => (
          <motion.div
            key={titulo}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="glass rounded-xl p-4 flex gap-4"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cor} flex items-center justify-center flex-shrink-0`}>
              <Icone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-0.5" style={{ fontFamily: 'var(--font-heading)' }}>
                {titulo}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-texto-suave)' }}>
                {descricao}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Como funciona */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-xl p-4 mb-4"
        style={{ borderColor: 'rgba(99,102,241,0.3)' }}
      >
        <h3 className="text-sm font-semibold text-slate-200 mb-2" style={{ fontFamily: 'var(--fonte-heading)' }}>
          Como funciona?
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--cor-texto-suave)' }}>
          O Roblox usa um <strong className="text-slate-300">mutex do Windows</strong> chamado{' '}
          <code
            className="px-1 py-0.5 rounded text-xs"
            style={{ background: 'rgba(99,102,241,0.2)', color: 'var(--cor-primaria)' }}
          >
            ROBLOX_singletonEvent
          </code>{' '}
          para impedir que mais de uma instância seja aberta. Este app cria e segura esse mutex antes de abrir
          cada instância, "enganando" o Roblox e permitindo múltiplas sessões simultâneas.
        </p>
      </motion.div>

      {/* Créditos */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl p-4 text-center"
        style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
          <div className="flex items-center gap-1.5">
            <span>Base original:</span>
            <a
              href="https://github.com/Dashbloxx/MultiRoblox"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[var(--color-primaria)] transition-colors duration-200"
              style={{ color: 'var(--cor-primaria)' }}
            >
              <Github className="w-3 h-3" />
              MultiRoblox
            </a>
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span>Inspiração e Base:</span>
            <a
              href="https://github.com/Babyhamsta/RAM_Source"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[var(--color-primaria)] transition-colors duration-200 font-medium"
              style={{ color: 'var(--cor-primaria)' }}
            >
              <Github className="w-3 h-3" />
              RAM_Source
            </a>
          </div>
        </div>
        <p className="text-xs mt-1 flex items-center justify-center gap-1" style={{ color: 'var(--cor-texto-apagado)' }}>
          Recriado com
          <Heart className="w-3 h-3 text-rose-400" />
          usando Tauri + React
        </p>
      </motion.div>
    </div>
  );
}
