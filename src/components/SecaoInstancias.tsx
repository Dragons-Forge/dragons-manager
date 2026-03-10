import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, RefreshCw, AlertTriangle, Loader2, Inbox, Trash2, X, Search, UserCircle, Settings2, Download
} from 'lucide-react';
import { CartaoInstancia } from './CartaoInstancia';
import { useInstancias } from '../hooks/useInstancias';
import { useContas } from '../hooks/useContas';
import { useTranslation, Trans } from 'react-i18next';

export function SecaoInstancias() {
  const { t } = useTranslation();
  const {
    instancias,
    clientesEncontrados,
    caminhoCustomizado,
    estaCarregando,
    erro,
    lancarNovaInstancia,
    fecharInstancia,
    atualizarInstancias,
    limparCaminhoManual,
    clientesCustomizados,
    adicionarClienteCustomizado,
    removerClienteCustomizado,
    todosOsClientes,
    clientesOcultos,
    ocultarCliente
  } = useInstancias();

  const { contas, obterTicketParaConta } = useContas();

  const [mostrarConfiguracoes, definirMostrarConfiguracoes] = useState(false);
  const [estaLancando, definirEstaLancando] = useState(false);
  const [mostrarSeletorContas, definirMostrarSeletorContas] = useState(false);
  const [pidFechando, definirPidFechando] = useState<number | null>(null);
  const [mensagemFeedback, definirMensagemFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [contaSelecionadaParaLancamento, definirContaSelecionadaParaLancamento] = useState<string | null>(null);
  const [mostrarSeletorCliente, definirMostrarSeletorCliente] = useState(false);

  const [nomeClienteNovo, definirNomeClienteNovo] = useState('');

  const exibirFeedback = useCallback((tipo: 'sucesso' | 'erro', texto: string) => {
    definirMensagemFeedback({ tipo, texto });
    setTimeout(() => definirMensagemFeedback(null), 3500);
  }, []);

  const aoLancarInstancia = useCallback(async (idConta?: string, caminhoExecutavel?: string) => {
    definirEstaLancando(true);
    definirMostrarSeletorContas(false);
    definirMostrarSeletorCliente(false);
    definirContaSelecionadaParaLancamento(null);

    try {
      let ticket: string | undefined = undefined;
      let userId: number | undefined = undefined;

      if (idConta) {
        const conta = contas.find(c => c.id === idConta);
        if (conta) userId = conta.usuario.id;

        const resultadoTicket = await obterTicketParaConta(idConta);
        if (resultadoTicket.sucesso && resultadoTicket.ticket) {
          ticket = resultadoTicket.ticket;
        } else {
          exibirFeedback('erro', resultadoTicket.mensagem || 'Falha ao gerar ticket para a conta.');
          return;
        }
      }

      const resultado = await lancarNovaInstancia({
        ticket,
        contaId: idConta,
        userId,
        caminho: caminhoExecutavel
      });

      exibirFeedback(resultado.sucesso ? 'sucesso' : 'erro', resultado.mensagem);
    } finally {
      definirEstaLancando(false);
    }
  }, [lancarNovaInstancia, exibirFeedback, obterTicketParaConta, contas]);

  const prepararLancamento = useCallback((idConta?: string) => {
    if (todosOsClientes.length > 1) {
      definirContaSelecionadaParaLancamento(idConta || 'guest');
      definirMostrarSeletorCliente(true);
      definirMostrarSeletorContas(false);
    } else if (todosOsClientes.length === 1) {
      aoLancarInstancia(idConta, todosOsClientes[0].caminho);
    } else {
      aoLancarInstancia(idConta);
    }
  }, [todosOsClientes, aoLancarInstancia]);

  const aoFecharInstancia = useCallback(async (pid: number) => {
    definirPidFechando(pid);
    try {
      const resultado = await fecharInstancia(pid);
      if (!resultado.sucesso) exibirFeedback('erro', resultado.mensagem);
    } finally {
      definirPidFechando(null);
    }
  }, [fecharInstancia, exibirFeedback]);

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho da seção */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold gradient-text" style={{ fontFamily: 'var(--font-heading)' }}>
            {t('instancias.titulo')}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-texto-suave)' }}>
            {instancias.length === 0
              ? t('instancias.nenhuma')
              : t('instancias.emExecucao', { count: instancias.length })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            onClick={atualizarInstancias}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl border transition-all duration-200 cursor-pointer"
            style={{
              borderColor: 'var(--color-borda)',
              background: 'var(--color-superficie-2)',
              color: 'var(--color-texto-suave)',
            }}
            aria-label={t('instancias.atualizar')}
            title={t('instancias.atualizar')}
          >
            <RefreshCw className={`w-4 h-4 ${estaCarregando ? 'animar-girar' : ''}`} />
          </motion.button>

          <motion.button
            onClick={() => definirMostrarConfiguracoes(!mostrarConfiguracoes)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer ${mostrarConfiguracoes
              ? 'bg-[var(--color-primaria)]/20 border-[var(--color-primaria)]/50 text-[var(--color-primaria)]'
              : ''
              }`}
            style={{
              borderColor: !mostrarConfiguracoes ? 'var(--color-borda)' : undefined,
              background: !mostrarConfiguracoes ? 'var(--color-superficie-2)' : undefined,
              color: !mostrarConfiguracoes ? 'var(--color-texto-suave)' : undefined,
            }}
            title={t('instancias.configurar')}
          >
            <Settings2 className="w-4 h-4" />
          </motion.button>

          <div className="relative">
            <motion.button
              onClick={() => {
                if (contas.length > 0) {
                  definirMostrarSeletorContas(!mostrarSeletorContas);
                } else {
                  prepararLancamento();
                }
              }}
              disabled={estaLancando}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-white
                         disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, var(--color-primaria), #7C3AED)' }}
            >
              {estaLancando ? (
                <>
                  <Loader2 className="w-4 h-4 animar-girar" />
                  {t('instancias.lancando')}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {t('instancias.nova')}
                </>
              )}
            </motion.button>

            {/* Dropdown de Contas */}
            <AnimatePresence>
              {mostrarSeletorContas && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-64 bg-[#121620] border border-white/5 rounded-2xl p-2 z-50 shadow-2xl"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 p-2 border-b border-white/5 mb-1">
                    {t('instancias.escolhaConta')}
                  </p>
                  <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                    <button
                      onClick={() => prepararLancamento()}
                      className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 text-left transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                        <UserCircle className="w-4 h-4 text-white/40 group-hover:text-white/60" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-white/80">{t('instancias.entrarConvidado')}</p>
                        <p className="text-[9px] text-white/20">{t('instancias.semLoginAutomatico')}</p>
                      </div>
                    </button>

                    {contas.map((conta) => (
                      <button
                        key={conta.id}
                        onClick={() => prepararLancamento(conta.id)}
                        className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-[var(--color-primaria)]/10 text-left transition-all border border-transparent hover:border-[var(--color-primaria)]/20"
                      >
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0">
                          <img src={conta.usuario.avatar_url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 truncate">
                          <p className="text-xs font-bold text-white truncate">{conta.usuario.nome_display}</p>
                          <p className="text-[9px] text-white/40 font-mono truncate">@{conta.usuario.nome}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Modal de Seleção de Cliente */}
            <AnimatePresence>
              {mostrarSeletorCliente && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full max-w-sm bg-[#121620] border border-white/10 rounded-3xl p-6 shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-white">{t('instancias.escolhaCliente')}</h3>
                      <button
                        onClick={() => definirMostrarSeletorCliente(false)}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5 text-white/40" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {todosOsClientes.map((cliente) => (
                        <button
                          key={cliente.id}
                          onClick={() => aoLancarInstancia(
                            contaSelecionadaParaLancamento === 'guest' ? undefined : (contaSelecionadaParaLancamento || undefined),
                            cliente.caminho
                          )}
                          className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[var(--color-primaria)]/30 hover:bg-[var(--color-primaria)]/10 transition-all group cursor-pointer"
                        >
                          <div className="text-left">
                            <p className="text-sm font-bold text-white group-hover:text-[var(--color-primaria)]">{cliente.nome}</p>
                            <p className="text-[10px] text-white/20 truncate max-w-[200px]">{cliente.caminho}</p>
                          </div>
                          {cliente.eAutomatico && (
                            <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                              {t('instancias.auto')}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <p className="mt-6 text-[10px] text-center text-white/20">
                      {t('instancias.dicaCadastroCliente')}
                    </p>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Seletor de Cliente / Configuração */}
      <AnimatePresence>
        {mostrarConfiguracoes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="p-4 rounded-2xl glass border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-primaria)]">
                  {t('instancias.configClientes')}
                </h3>
                {caminhoCustomizado && (
                  <button
                    onClick={limparCaminhoManual}
                    className="text-[10px] text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> {t('instancias.resetarAuto')}
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">
                    {t('instancias.cadastrarNovoExe')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={t('instancias.exemploExe')}
                      value={nomeClienteNovo}
                      onChange={(e) => definirNomeClienteNovo(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[var(--color-primaria)]/50 transition-all"
                    />
                    <button
                      onClick={async () => {
                        if (!nomeClienteNovo.trim()) {
                          exibirFeedback('erro', t('instancias.nomeInvalido'));
                          return;
                        }
                        const sucesso = await adicionarClienteCustomizado(nomeClienteNovo);
                        if (sucesso) {
                          definirNomeClienteNovo('');
                          exibirFeedback('sucesso', t('instancias.exeCadastrado'));
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-[var(--color-primaria)]/20 text-[var(--color-primaria)] border border-[var(--color-primaria)]/30 text-xs font-bold hover:bg-[var(--color-primaria)]/30 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t('instancias.escolherExe')}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">
                    {t('instancias.seusExecutaveis')}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Clientes Automáticos */}
                    {clientesEncontrados.filter(c => !clientesOcultos.includes(c.caminho)).map((cliente) => (
                      <div
                        key={cliente.caminho}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 group animate-in fade-in slide-in-from-left-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {cliente.tipo === 'Oficial' ? t('instancias.robloxPadrao') : cliente.nome}
                          </p>
                          <p className="text-[10px] opacity-40 truncate">{cliente.caminho}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-0.5 rounded-full bg-[var(--color-primaria)]/10 text-[8px] font-black uppercase text-[var(--color-primaria)]/60 border border-[var(--color-primaria)]/20">
                            {t('instancias.auto')}
                          </div>
                          <button
                            onClick={() => ocultarCliente(cliente.caminho)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            title={t('instancias.ocultarVisu')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Clientes Customizados */}
                    {clientesCustomizados.map((cliente) => (
                      <div
                        key={cliente.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-primaria)]/5 border border-[var(--color-primaria)]/20 group animate-in fade-in slide-in-from-left-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{cliente.nome}</p>
                          <p className="text-[10px] opacity-40 truncate">{cliente.caminho}</p>
                        </div>
                        <button
                          onClick={() => removerClienteCustomizado(cliente.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title={t('instancias.remover')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {clientesEncontrados.length === 0 && clientesCustomizados.length === 0 && (
                      <div className="col-span-full p-6 text-center border border-dashed border-white/10 rounded-2xl">
                        <p className="text-xs text-white/20 font-medium">{t('instancias.nenhumExe')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {caminhoCustomizado && (
                <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animar-pulso" />
                  <p className="text-[10px] text-emerald-300">
                    {t('instancias.usandoCaminhoCustom')} <span className="font-mono opacity-60">{caminhoCustomizado}</span>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast de feedback */}
      <AnimatePresence>
        {mensagemFeedback && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
            style={{
              background: mensagemFeedback.tipo === 'sucesso'
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(244, 63, 94, 0.15)',
              border: `1px solid ${mensagemFeedback.tipo === 'sucesso' ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
              color: mensagemFeedback.tipo === 'sucesso' ? '#6EE7B7' : '#FDA4AF',
            }}
          >
            {mensagemFeedback.tipo === 'erro' && <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
            {mensagemFeedback.texto}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Estado de carregamento */}
      {estaCarregando && instancias.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2
              className="w-10 h-10 mx-auto animar-girar"
              style={{ color: 'var(--color-primaria)' }}
            />
            <p className="text-sm" style={{ color: 'var(--color-texto-suave)' }}>
              {t('instancias.verificandoInstancias')}
            </p>
          </div>
        </div>
      )}

      {/* Alerta de Erro / Roblox Não Encontrado - Só mostra se não houver NENHUM cliente disponível */}
      {todosOsClientes.length === 0 && (erro || (clientesEncontrados.length === 0 && !caminhoCustomizado)) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 rounded-2xl border p-5 glass group overflow-hidden relative"
          style={{ background: 'rgba(244, 63, 94, 0.05)', borderColor: 'rgba(244, 63, 94, 0.2)' }}
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12 group-hover:rotate-45 transition-transform duration-700">
            <AlertTriangle className="w-24 h-24 text-rose-500" />
          </div>

          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-base font-bold text-rose-200" style={{ fontFamily: 'var(--font-heading)' }}>
                  {t('instancias.robloxNaoEncontrado')}
                </h3>
                <p className="text-sm text-rose-400/80 leading-relaxed">
                  {t('instancias.robloxNaoEncontradoDesc')}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    definirMostrarConfiguracoes(true);
                    setTimeout(() => {
                      const input = document.querySelector('input[placeholder*="Ex: Roblox Farming"]') as HTMLInputElement;
                      if (input) {
                        input.focus();
                        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }, 100);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  {t('instancias.cadastrarManualmente')}
                </button>
                <a
                  href="https://github.com/pizzaboxer/bloxstrap"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-xs font-bold transition-all"
                >
                  <Download className="w-4 h-4" />
                  {t('instancias.instalarBloxstrap')}
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Lista de instâncias */}
      {!estaCarregando && instancias.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex items-center justify-center"
        >
          <div className="text-center space-y-4 max-w-xs">
            <div
              className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <Inbox className="w-8 h-8" style={{ color: 'var(--color-primaria)' }} />
            </div>
            <div>
              <p className="font-semibold text-slate-200" style={{ fontFamily: 'var(--font-heading)' }}>
                {t('instancias.nenhumaAtiva')}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-texto-suave)' }}>
                <Trans i18nKey="instancias.dicaNovaInstancia" components={{ 1: <strong className="text-[var(--color-primaria)]" /> }} />
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <motion.div
            layout
            className="grid grid-cols-1 gap-4 pb-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
          >
            <AnimatePresence mode="popLayout">
              {instancias.map((instancia, indice) => (
                <CartaoInstancia
                  key={instancia.pid}
                  instancia={instancia}
                  numero={indice + 1}
                  aoFechar={aoFecharInstancia}
                  eFechando={pidFechando === instancia.pid}
                  eEncerrando={estaLancando} // Se estiver lançando um novo Roblox, mostramos feedback
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* Dica na parte inferior */}
      {instancias.length > 0 && (
        <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--color-borda)' }}>
          <p className="text-xs text-center" style={{ color: 'var(--color-texto-apagado)' }}>
            {t('instancias.dicaAtualizacao')}
          </p>
        </div>
      )}
    </div>
  );
}
