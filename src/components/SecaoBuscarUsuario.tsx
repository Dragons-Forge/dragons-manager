import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { Search, User, ExternalLink, AlertCircle, Loader2, Users, Hash, ArrowRight } from 'lucide-react';
import { InfoUsuarioRoblox } from '../tipos';
import { useTranslation } from 'react-i18next';

export function SecaoBuscarUsuario() {
  const { t } = useTranslation();
  const [termoBusca, definirTermoBusca] = useState('');
  const [estaCarregando, definirEstaCarregando] = useState(false);
  const [resultadoUsuario, definirResultadoUsuario] = useState<InfoUsuarioRoblox | null>(null);
  const [erroMensagem, definirErroMensagem] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const buscarUsuario = useCallback(async (nome: string) => {
    if (!nome.trim()) return;

    definirEstaCarregando(true);
    definirErroMensagem(null);
    definirResultadoUsuario(null);

    try {
      const usuario = await invoke<InfoUsuarioRoblox>('buscar_usuario_roblox', {
        nomeUsuario: nome.trim(),
      });
      definirResultadoUsuario(usuario);
    } catch (erroCapturado) {
      definirErroMensagem(String(erroCapturado));
    } finally {
      definirEstaCarregando(false);
    }
  }, []);

  const aoSubmeter = (e: React.FormEvent) => {
    e.preventDefault();
    buscarUsuario(termoBusca);
  };

  const aoBuscarNovamente = () => {
    definirResultadoUsuario(null);
    definirErroMensagem(null);
    definirTermoBusca('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h2 className="text-xl font-bold gradient-text" style={{ fontFamily: 'var(--fonte-heading)' }}>
          {t('buscarUsuario.titulo')}
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--cor-texto-suave)' }}>
          {t('buscarUsuario.descricao')}
        </p>
      </div>

      {/* Campo de busca integrado */}
      <form onSubmit={aoSubmeter} className="mb-6">
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-3 transition-all duration-200"
          style={{
            background: 'var(--cor-superficie-2)',
            border: '1px solid var(--cor-borda)',
          }}
          onFocusCapture={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--cor-primaria)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.12)';
          }}
          onBlurCapture={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--cor-borda)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
          }}
        >
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--cor-texto-apagado)' }} />
          <input
            ref={inputRef}
            type="text"
            value={termoBusca}
            onChange={(e) => definirTermoBusca(e.target.value)}
            placeholder={t('buscarUsuario.placeholderInput')}
            autoFocus
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--cor-texto)', fontFamily: 'var(--fonte-body)' }}
          />
          <motion.button
            type="submit"
            disabled={estaCarregando || !termoBusca.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--cor-primaria), #7C3AED)' }}
          >
            {estaCarregando ? (
              <Loader2 className="w-3.5 h-3.5 animar-girar" />
            ) : (
              <>
                {t('buscarUsuario.buscar')}
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </motion.button>
        </div>
      </form>

      {/* Conteúdo dinâmico */}
      <AnimatePresence mode="wait">

        {/* Estado: Vazio (nenhuma busca ainda) */}
        {!estaCarregando && !resultadoUsuario && !erroMensagem && (
          <motion.div
            key="vazio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center flex-1 gap-4 py-8"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
            >
              <Users className="w-8 h-8" style={{ color: 'var(--cor-primaria)' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--cor-texto-suave)' }}>
                {t('buscarUsuario.vazioTitulo')}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-apagado)' }}>
                {t('buscarUsuario.vazioDescricao')}
              </p>
            </div>
          </motion.div>
        )}

        {/* Estado: Erro */}
        {erroMensagem && (
          <motion.div
            key="erro"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div
              className="flex items-start gap-3 rounded-2xl p-4 border"
              style={{ background: 'rgba(244, 63, 94, 0.08)', borderColor: 'rgba(244, 63, 94, 0.25)' }}
            >
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-300">{t('buscarUsuario.erroNaoEncontrado')}</p>
                <p className="text-xs mt-0.5 text-rose-400/60">{erroMensagem}</p>
              </div>
            </div>
            <button
              onClick={aoBuscarNovamente}
              className="w-full py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer"
              style={{
                background: 'var(--cor-superficie-2)',
                border: '1px solid var(--cor-borda)',
                color: 'var(--cor-texto-suave)',
              }}
            >
              {t('buscarUsuario.tentarNovamente')}
            </button>
          </motion.div>
        )}

        {/* Estado: Resultado */}
        {resultadoUsuario && (
          <motion.div
            key="resultado"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="glass rounded-2xl overflow-hidden"
          >
            {/* Banner */}
            <div
              className="h-20 w-full relative"
              style={{ background: 'linear-gradient(135deg, var(--cor-primaria), var(--cor-acento))' }}
            >
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}
              />
            </div>

            {/* Perfil */}
            <div className="px-5 pb-5">
              <div className="flex items-end justify-between gap-4 -mt-10 mb-5">
                <div
                  className="w-[72px] h-[72px] rounded-2xl overflow-hidden flex-shrink-0"
                  style={{ background: 'var(--cor-superficie)', outline: '4px solid var(--cor-fundo)' }}
                >
                  <img
                    src={resultadoUsuario.avatar_url}
                    alt={`Avatar de ${resultadoUsuario.nome_display}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${resultadoUsuario.nome}`;
                    }}
                  />
                </div>
                <motion.a
                  href={`https://www.roblox.com/users/${resultadoUsuario.id}/profile`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all mb-1 cursor-pointer"
                  style={{
                    borderColor: 'var(--cor-borda-hover)',
                    color: 'var(--cor-acento)',
                    background: 'rgba(34, 211, 238, 0.08)',
                  }}
                >
                  <ExternalLink className="w-3 h-3" />
                  {t('buscarUsuario.verPerfil')}
                </motion.a>
              </div>

              {/* Nome e username */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white leading-tight" style={{ fontFamily: 'var(--fonte-heading)' }}>
                  {resultadoUsuario.nome_display}
                </h3>
                <p className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
                  @{resultadoUsuario.nome}
                </p>
              </div>

              {/* Badges de info */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border"
                  style={{
                    background: 'rgba(99, 102, 241, 0.12)',
                    borderColor: 'rgba(99, 102, 241, 0.25)',
                    color: 'var(--cor-primaria)',
                  }}
                >
                  <Hash className="w-3 h-3" />
                  {resultadoUsuario.id}
                </span>
                <span
                  className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border"
                  style={{
                    background: 'rgba(34, 211, 238, 0.08)',
                    borderColor: 'rgba(34, 211, 238, 0.2)',
                    color: 'var(--cor-acento)',
                  }}
                >
                  <User className="w-3 h-3" />
                  {t('buscarUsuario.badgeJogador')}
                </span>
              </div>

              {/* Descrição */}
              {resultadoUsuario.descricao ? (
                <div
                  className="rounded-xl p-3 mb-4"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--cor-borda)' }}
                >
                  <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--cor-texto-suave)' }}>
                    {resultadoUsuario.descricao}
                  </p>
                </div>
              ) : null}

              {/* Botão buscar outro */}
              <button
                onClick={aoBuscarNovamente}
                className="w-full py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer"
                style={{
                  background: 'var(--cor-superficie-2)',
                  border: '1px solid var(--cor-borda)',
                  color: 'var(--cor-texto-suave)',
                }}
              >
                {t('buscarUsuario.buscarOutro')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
