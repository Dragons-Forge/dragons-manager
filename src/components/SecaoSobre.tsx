import { motion } from 'framer-motion';
import { Heart, Shield, Zap, Users, Gamepad2, UserCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const funcionalidades = [
  {
    Icone: Zap,
    chave: 'multiplasInstancias',
    cor: 'from-[var(--color-primaria)] to-[var(--color-acento)]',
  },
  {
    Icone: Users,
    chave: 'monitoramento',
    cor: 'from-cyan-500 to-emerald-500',
  },
  {
    Icone: Gamepad2,
    chave: 'biblioteca',
    cor: 'from-blue-500 to-indigo-500',
  },
  {
    Icone: UserCircle,
    chave: 'contas',
    cor: 'from-fuchsia-500 to-pink-500',
  },
  {
    Icone: Shield,
    chave: 'busca',
    cor: 'from-amber-500 to-orange-500',
  },
];

export function SecaoSobre() {
  const { t } = useTranslation();

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
        {funcionalidades.map(({ Icone, chave, cor }, i) => (
          <motion.div
            key={chave}
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
                {t(`sobre.funcionalidades.${chave}`)}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-texto-suave)' }}>
                {t(`sobre.funcionalidades.${chave}Desc`)}
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
          {t('sobre.comoFunciona')}
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--cor-texto-suave)' }}>
          {t('sobre.textoComoFunciona')}
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
          <div className="flex flex-col gap-1 text-sm text-[var(--color-texto-suave)]">
            <span>{t('sobre.baseadoEm')}</span>
            <span className="text-xs text-[var(--color-texto-apagado)]">Projeto autoral desenvolvido pela Dragons Forge.</span>
          </div>
        </div>
        <p className="text-xs mt-1 flex items-center justify-center gap-1" style={{ color: 'var(--cor-texto-apagado)' }}>
          {t('sobre.recriadoCom')}
          <Heart className="w-3 h-3 text-rose-400" />
          {t('sobre.usandoTauri')}
        </p>
      </motion.div>
    </div>
  );
}
