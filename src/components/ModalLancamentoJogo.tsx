import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { Loader2, X, Play, Monitor, User, AlertCircle, CheckCircle2, ChevronDown, Server } from 'lucide-react';
import { InfoJogoRoblox } from '../tipos';
import { useContas } from '../hooks/useContas';
import { useInstancias } from '../hooks/useInstancias';

interface PropsModal {
  jogo: InfoJogoRoblox;
  aoFechar: () => void;
}

export function ModalLancamentoJogo({ jogo, aoFechar }: PropsModal) {
  const { contas, obterTicketParaConta } = useContas();
  const { todosOsClientes } = useInstancias();
  
  const [clienteSelecionado, definirClienteSelecionado] = useState<string>('');
  const [dropdownClienteAberto, definirDropdownClienteAberto] = useState(false);
  const [contaSelecionada, definirContaSelecionada] = useState<string>('');
  const [jobIdInput, definirJobIdInput] = useState('');
  
  const [estaLancando, definirEstaLancando] = useState(false);
  const [erroMensagem, definirErroMensagem] = useState<string | null>(null);
  const [sucessoMensagem, definirSucessoMensagem] = useState<string | null>(null);

  useEffect(() => {
    // Seleciona o primeiro cliente da lista consolidada (incluindo salvos do localStorage)
    if (todosOsClientes.length > 0 && !clienteSelecionado) {
      definirClienteSelecionado(todosOsClientes[0].caminho);
    }
  }, [todosOsClientes, clienteSelecionado]);

  useEffect(() => {
    if (contas.length > 0 && !contaSelecionada) {
      definirContaSelecionada(contas[0].id);
    }
  }, [contas, contaSelecionada]);

  const aoIniciarJogo = async () => {
    if (!contaSelecionada || !clienteSelecionado) return;

    definirEstaLancando(true);
    definirErroMensagem(null);
    definirSucessoMensagem(null);

    try {
      // 1. Obter ticket para a conta
      const resultTicket = await obterTicketParaConta(contaSelecionada);
      if (!resultTicket.sucesso || !resultTicket.ticket) {
        throw new Error(resultTicket.mensagem || 'Falha ao gerar ticket');
      }

      const contaObj = contas.find(c => c.id === contaSelecionada);

      // 2. Chamar o Tauri para lançar
      await invoke('lancar_roblox', {
        caminhoCustomizado: clienteSelecionado,
        ticket: resultTicket.ticket,
        contaId: contaSelecionada,
        userId: contaObj?.usuario.id,
        placeId: jogo.place_id,
        jobId: jobIdInput.trim() || null,
      });

      definirSucessoMensagem(`Iniciando ${jogo.nome}...`);
      setTimeout(() => aoFechar(), 2500);
    } catch (e) {
      definirErroMensagem(String(e));
    } finally {
      definirEstaLancando(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={aoFechar}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg glass rounded-3xl shadow-2xl"
          style={{ border: '1px solid var(--cor-borda)', background: 'var(--cor-superficie)' }}
        >
          {/* Header com a Thumb do Jogo */}
          <div className="relative h-40 bg-slate-800 w-full overflow-hidden rounded-t-[1.4rem]">
            {jogo.thumbnail_url && (
              <img
                src={jogo.thumbnail_url}
                alt={jogo.nome}
                className="absolute inset-0 w-full h-full object-cover opacity-60 blur-sm scale-110"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--cor-superficie)] to-transparent" />
            
            <button
              onClick={aoFechar}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white/70 hover:text-white hover:bg-black/60 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="absolute bottom-4 left-6 right-6 flex items-end gap-4">
              {jogo.thumbnail_url && (
                <div 
                  className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl z-10" 
                  style={{ outline: '4px solid var(--cor-fundo)' }}
                >
                  <img src={jogo.thumbnail_url} alt={jogo.nome} className="w-full h-full object-cover bg-slate-800" />
                </div>
              )}
              <div className="pb-1 z-10">
                <h2 className="text-xl font-bold text-white shadow-black drop-shadow-md" style={{ fontFamily: 'var(--fonte-heading)' }}>
                  {jogo.nome}
                </h2>
                {jogo.criador_nome && <p className="text-sm font-medium text-white/80 drop-shadow-md">{jogo.criador_nome}</p>}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Escolha da Conta */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--cor-texto)' }}>
                <User className="w-4 h-4 text-[var(--cor-primaria)]" />
                Selecione a Conta
              </label>
              <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto custom-scrollbar p-1">
                {contas.length === 0 ? (
                  <p className="col-span-2 text-sm text-center text-rose-400 py-4 bg-rose-500/10 rounded-xl border border-rose-500/20">
                    Nenhuma conta configurada.
                  </p>
                ) : (
                  contas.map(c => (
                    <div
                      key={c.id}
                      onClick={() => !estaLancando && definirContaSelecionada(c.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                        contaSelecionada === c.id 
                          ? 'bg-[var(--cor-primaria)]/10 border-[var(--cor-primaria)] shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                          : 'bg-black/20 border-white/5 hover:bg-white/5'
                      } ${estaLancando ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <img src={c.usuario.avatar_url} alt="" className="w-8 h-8 rounded-full bg-black/40" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{c.usuario.nome_display}</p>
                        <p className="text-[10px] text-white/50 truncate">@{c.usuario.nome}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Escolha do Cliente */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--cor-texto)' }}>
                <Monitor className="w-4 h-4 text-[var(--cor-acento)]" />
                Selecione o Cliente
              </label>
              <div className="relative z-50">
                <button
                  type="button"
                  onClick={() => !estaLancando && todosOsClientes.length > 0 && definirDropdownClienteAberto(!dropdownClienteAberto)}
                  disabled={estaLancando || todosOsClientes.length === 0}
                  className="w-full px-4 py-3 rounded-xl text-sm flex items-center justify-between transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border hover:border-white/20"
                  style={{
                    background: 'var(--cor-superficie-2)',
                    borderColor: dropdownClienteAberto ? 'var(--cor-primaria)' : 'var(--cor-borda)',
                    color: 'var(--cor-texto)',
                    boxShadow: dropdownClienteAberto ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none'
                  }}
                >
                  <span className="truncate">
                    {todosOsClientes.length === 0 
                      ? 'Nenhum cliente detectado' 
                      : todosOsClientes.find(c => c.caminho === clienteSelecionado)?.nome || 'Selecione um cliente'
                    }
                  </span>
                  <ChevronDown className={`w-4 h-4 text-white/50 transition-transform duration-200 ${dropdownClienteAberto ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {dropdownClienteAberto && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 w-full mt-2 rounded-xl border border-white/10 shadow-2xl overflow-hidden bg-[#121620]"
                    >
                      <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                        {todosOsClientes.map((cli, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              definirClienteSelecionado(cli.caminho);
                              definirDropdownClienteAberto(false);
                            }}
                            className={`px-3 py-3 rounded-lg text-sm cursor-pointer transition-colors flex items-center justify-between font-medium ${
                              clienteSelecionado === cli.caminho 
                                ? 'bg-[var(--cor-primaria)] text-white' 
                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <span className="truncate">{cli.nome}</span>
                            {clienteSelecionado === cli.caminho && (
                              <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Input Job ID */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--cor-texto)' }}>
                <Server className="w-4 h-4 text-emerald-400" />
                Servidor Específico / Job ID (Opcional)
              </label>
              <input
                type="text"
                value={jobIdInput}
                onChange={(e) => definirJobIdInput(e.target.value)}
                placeholder="Ex: 5b4e3a2b-11c2-4d3e-..."
                disabled={estaLancando}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all disabled:opacity-50 border focus:border-emerald-400"
                style={{
                  background: 'var(--cor-superficie-2)',
                  borderColor: 'var(--cor-borda)',
                  color: 'var(--cor-texto)',
                }}
              />
            </div>

            {/* Mensagens de feedback */}
            {erroMensagem && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs leading-relaxed">{erroMensagem}</p>
              </div>
            )}
            
            {sucessoMensagem && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <p className="text-xs font-medium">{sucessoMensagem}</p>
              </div>
            )}

            {/* Botão de Lançar */}
            <button
              onClick={aoIniciarJogo}
              disabled={estaLancando || contas.length === 0 || !clienteSelecionado}
              className="relative w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-white
                         disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden transition-all duration-300
                         bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400
                         shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]
                         hover:-translate-y-0.5 active:translate-y-0"
            >
              {estaLancando ? (
                <>
                  <Loader2 className="w-5 h-5 animar-girar" />
                  Preparando Jogo...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  Jogar Agora
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
