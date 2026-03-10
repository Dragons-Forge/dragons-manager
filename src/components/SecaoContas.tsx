import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, CheckCircle2, AlertCircle, Loader2, User, Sparkles, Shield, Plus, UserPlus, Trash2, Key } from 'lucide-react';
import { useContas } from '../hooks/useContas';
import { ContaImportada } from '../tipos';
import { useTranslation, Trans } from 'react-i18next';

export function SecaoContas() {
  const { t } = useTranslation();
  const {
    contas, adicionarConta, removerConta, estaCarregando,
    buscarContasNavegador, adicionarContasImportadas, solicitarElevacaoUAC,
    abrirJanelaLogin, capturarCookieApp
  } = useContas();

  const [novoCookie, definirNovoCookie] = useState('');
  const [metodoAdicao, definirMetodoAdicao] = useState<'cookie' | 'login'>('cookie');
  const [janelaAberta, definirJanelaAberta] = useState(false);

  const [estaAdicionando, definirEstaAdicionando] = useState(false);
  const [estaBuscandoNavegador, definirEstaBuscandoNavegador] = useState(false);
  const [precisaDeAdmin, definirPrecisaDeAdmin] = useState(false);
  const [contasEncontradas, definirContasEncontradas] = useState<ContaImportada[] | null>(null);
  const [feedback, definirFeedback] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null);

  const aoAdicionarPorCookie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoCookie.trim()) return;

    definirEstaAdicionando(true);
    definirFeedback(null);

    const resultado = await adicionarConta(novoCookie.trim());

    if (resultado.sucesso) {
      definirNovoCookie('');
      definirFeedback({ tipo: 'sucesso', mensagem: resultado.mensagem });
      setTimeout(() => definirFeedback(null), 3000);
    } else {
      definirFeedback({ tipo: 'erro', mensagem: resultado.mensagem });
    }
    definirEstaAdicionando(false);
  };

  const aoAbrirLogin = async () => {
    try {
      await abrirJanelaLogin();
      definirJanelaAberta(true);
      definirFeedback({ tipo: 'sucesso', mensagem: t('contas.feedbackSucessoJanela') });
    } catch (e) {
      definirFeedback({ tipo: 'erro', mensagem: t('contas.feedbackErroJanela') });
    }
  };

  const aoFinalizarCaptura = async () => {
    definirEstaAdicionando(true);
    definirFeedback(null);

    const resultado = await capturarCookieApp();

    if (resultado.sucesso) {
      definirJanelaAberta(false);
      definirFeedback({ tipo: 'sucesso', mensagem: resultado.mensagem });
      setTimeout(() => definirFeedback(null), 3500);
    } else {
      definirFeedback({ tipo: 'erro', mensagem: resultado.mensagem });
    }
    definirEstaAdicionando(false);
  };

  const aoImportarDoNavegador = async () => {
    definirEstaBuscandoNavegador(true);
    definirFeedback(null);
    definirContasEncontradas(null);
    definirPrecisaDeAdmin(false);

    const resultado = await buscarContasNavegador();

    if (resultado.sucesso && resultado.contas) {
      definirContasEncontradas(resultado.contas);
    } else {
      if (resultado.mensagem === 'NEED_ADMIN') {
        definirPrecisaDeAdmin(true);
      } else {
        definirFeedback({ tipo: 'erro', mensagem: resultado.mensagem });
      }
    }
    definirEstaBuscandoNavegador(false);
  };

  const confirmarImportacao = async () => {
    if (!contasEncontradas) return;

    await adicionarContasImportadas(contasEncontradas);
    definirFeedback({ tipo: 'sucesso', mensagem: t('contas.feedbackSucessoDesc', { count: contasEncontradas.length }) });
    definirContasEncontradas(null);
    setTimeout(() => definirFeedback(null), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Cabeçalho */}
      <div>
        <h2 className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-heading)' }}>
          {t('contas.titulo')}
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          <Trans i18nKey="contas.descricao" components={{ 1: <span className="text-[var(--color-primaria)] font-mono" /> }} />
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Adição */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-3xl glass border border-white/5 space-y-4">
            <div className="flex items-center gap-3 text-[var(--color-primaria)]">
              <UserPlus className="w-5 h-5" />
              <h3 className="font-bold">{t('contas.adicionarConta')}</h3>
            </div>

            {/* Seletor de Método */}
            <div className="flex p-1 bg-black/20 rounded-xl border border-white/5">
              <button
                onClick={() => definirMetodoAdicao('cookie')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${metodoAdicao === 'cookie' ? 'bg-[var(--color-primaria)] text-white shadow-lg shadow-[var(--color-primaria)]/20' : 'text-gray-500 hover:text-gray-400'
                  }`}
              >
                {t('contas.cookie')}
              </button>
              <button
                onClick={() => definirMetodoAdicao('login')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${metodoAdicao === 'login' ? 'bg-[var(--color-primaria)] text-white shadow-lg shadow-[var(--color-primaria)]/20' : 'text-gray-500 hover:text-gray-400'
                  }`}
              >
                {t('contas.loginDireto')}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {metodoAdicao === 'cookie' ? (
                <motion.div
                  key="form-cookie"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <button
                    onClick={aoImportarDoNavegador}
                    disabled={estaBuscandoNavegador || estaAdicionando}
                    className="w-full py-4 rounded-2xl bg-[var(--color-primaria)]/10 hover:bg-[var(--color-primaria)]/15 border border-[var(--color-primaria)]/20 
                             text-[var(--color-primaria)] opacity-80 font-bold text-sm transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer"
                  >
                    {estaBuscandoNavegador ? (
                      <Loader2 className="w-6 h-6 animar-girar" />
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform text-[var(--color-primaria)]" />
                        <div className="text-center">
                          <span className="block">{t('contas.importarNavegador')}</span>
                          <span className="text-[10px] text-[var(--color-primaria)] opacity-50 font-normal">{t('contas.navegadoresSuportados')}</span>
                        </div>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[10px] font-bold text-gray-600 uppercase">{t('contas.ouManual')}</span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>

                  <form onSubmit={aoAdicionarPorCookie} className="space-y-4">
                    <div className="space-y-2">
                      <div className="relative group">
                        <textarea
                          value={novoCookie}
                          onChange={(e) => definirNovoCookie(e.target.value)}
                          placeholder={t('contas.placeholderCookie')}
                          className="w-full h-24 bg-black/40 border border-white/5 rounded-2xl p-4 text-xs font-mono text-white/70 
                                   focus:border-[var(--color-primaria)]/50 focus:ring-1 focus:ring-[var(--color-primaria)]/20 outline-none transition-all resize-none"
                        />
                        <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-100 transition-opacity">
                          <Key className="w-4 h-4 text-[var(--color-primaria)]" />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={estaAdicionando || !novoCookie.trim()}
                      className="w-full py-3 rounded-2xl bg-[var(--color-primaria)] hover:bg-[var(--color-primaria-hover)] disabled:opacity-50 disabled:cursor-not-allowed
                               text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {estaAdicionando ? <Loader2 className="w-4 h-4 animar-girar" /> : <Plus className="w-4 h-4" />}
                      {t('contas.adicionarCookie')}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="form-login"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-3">
                      <div className="flex items-center gap-2 text-[var(--color-primaria)]">
                        <Info className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{t('contas.comoFunciona')}</span>
                      </div>
                      <ol className="text-[11px] text-gray-400 leading-relaxed list-none space-y-1.5">
                        <li className="flex items-start gap-2"><span className="text-[var(--color-primaria)] font-bold">1.</span> {t('contas.passo1')}</li>
                        <li className="flex items-start gap-2"><span className="text-[var(--color-primaria)] font-bold">2.</span> <Trans i18nKey="contas.passo2" components={{ 1: <strong className="text-white" /> }} /></li>
                        <li className="flex items-start gap-2"><span className="text-[var(--color-primaria)] font-bold">3.</span> {t('contas.passo3')}</li>
                      </ol>
                    </div>

                    {!janelaAberta ? (
                      <button
                        onClick={aoAbrirLogin}
                        className="w-full py-4 rounded-2xl bg-[var(--color-primaria)] hover:bg-[var(--color-primaria-hover)] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[var(--color-primaria)]/20"
                      >
                        <Sparkles className="w-5 h-5" />
                        {t('contas.abrirJanelaLogin')}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <button
                          onClick={aoFinalizarCaptura}
                          disabled={estaAdicionando}
                          className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                        >
                          {estaAdicionando ? (
                            <Loader2 className="w-5 h-5 animar-girar" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5" />
                          )}
                          {t('contas.finalizarCaptura')}
                        </button>

                        <button
                          onClick={aoAbrirLogin}
                          disabled={estaAdicionando}
                          className="w-full py-2 text-[10px] text-gray-500 hover:text-gray-300 font-bold uppercase tracking-widest transition-all cursor-pointer"
                        >
                          {t('contas.reabrirJanela')}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <p className="text-[9px] text-blue-300/60 leading-tight text-center">
                      {t('contas.dicaLoginSeguro')}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-xs
                    ${feedback.tipo === 'sucesso'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}
                >
                  {feedback.tipo === 'sucesso' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  <p>{feedback.mensagem}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Aviso de Administrador */}
            <AnimatePresence>
              {precisaDeAdmin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3"
                >
                  <div className="flex items-center gap-2 text-amber-500">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{t('contas.permissaoNecessaria')}</span>
                  </div>
                  <p className="text-[10px] text-amber-500/80 leading-relaxed">
                    {t('contas.descPermissao')}
                  </p>
                  <button
                    onClick={() => solicitarElevacaoUAC()}
                    className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    {t('contas.reiniciarAdmin')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Preview de Contas Encontradas */}
            <AnimatePresence>
              {contasEncontradas && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-2xl bg-[var(--color-primaria)]/10 border border-[var(--color-primaria)]/20 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--color-primaria)] opacity-80">{t('contas.contasDetectadas')}</span>
                    <span className="text-[10px] bg-[var(--color-primaria)]/20 px-2 py-0.5 rounded-full text-[var(--color-primaria)] opacity-80">
                      {t('contas.total', { count: contasEncontradas.length })}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {contasEncontradas.map((c) => (
                      <div key={c.perfil.id} className="flex items-center gap-3 p-2 rounded-xl bg-black/20 border border-white/5">
                        <img src={c.perfil.avatar_url} className="w-8 h-8 rounded-lg" alt="" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-white truncate">{c.perfil.nome_display}</p>
                          <p className="text-[9px] text-gray-500 truncate">@{c.perfil.nome}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => definirContasEncontradas(null)}
                      className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold transition-all cursor-pointer"
                    >
                      {t('contas.cancelar')}
                    </button>
                    <button
                      onClick={confirmarImportacao}
                      className="flex-[2] py-2 rounded-xl bg-[var(--color-primaria)] hover:bg-[var(--color-primaria-hover)] text-white text-xs font-bold transition-all shadow-lg shadow-[var(--shadow-glow)] cursor-pointer"
                    >
                      {t('contas.adicionarTodas')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-2">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-500/70 leading-relaxed">
                  <Trans i18nKey="contas.dicaCookie" components={{ 1: <strong />, 3: <code /> }} />
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Contas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">
              {t('contas.contasSalvas', { count: contas.length })}
            </h3>
          </div>

          {estaCarregando ? (
            <div className="h-40 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[var(--color-primaria)]/20 animar-girar" />
            </div>
          ) : contas.length === 0 ? (
            <div className="h-60 rounded-3xl border border-dashed border-white/5 flex flex-col items-center justify-center text-center p-8 bg-white/[0.02]">
              <div className="p-4 rounded-full bg-[var(--color-primaria)]/5 mb-4">
                <User className="w-8 h-8 text-[var(--color-primaria)]/20" />
              </div>
              <p className="text-sm font-bold text-white/40">{t('contas.nenhumaConta')}</p>
              <p className="text-xs text-white/20 mt-1">{t('contas.descNenhumaConta')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {contas.map((conta) => (
                  <motion.div
                    key={conta.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group p-4 rounded-3xl glass-sm border border-white/5 hover:border-[var(--color-primaria)]/20 transition-all flex items-center gap-4 relative overflow-hidden"
                  >
                    {/* Background decorativo */}
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                      <User className="w-16 h-16 text-[var(--color-primaria)]" />
                    </div>

                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-[var(--color-primaria)]/10 border border-[var(--color-primaria)]/20 overflow-hidden">
                        <img
                          src={conta.usuario.avatar_url}
                          alt={conta.usuario.nome}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {conta.usuario.e_premium && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center border-2 border-[#0A0D14]">
                          <span className="text-[10px] font-black text-white">P</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-[var(--color-primaria)] opacity-80 transition-colors">
                        {conta.usuario.nome_display}
                      </h4>
                      <p className="text-[10px] text-gray-500 flex items-center gap-1">
                        @{conta.usuario.nome}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] text-white/40 border border-white/5">
                          ID: {conta.usuario.id}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => removerConta(conta.id)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/20 hover:text-rose-400 transition-all cursor-pointer border border-transparent hover:border-rose-500/30"
                      title={t('contas.removerConta')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
