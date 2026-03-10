import { motion } from 'framer-motion';
import { Clock, Activity, Loader2, Power, Gamepad2 } from 'lucide-react';
import { InfoInstancia } from '../tipos';
import { useContas } from '../hooks/useContas';

interface CartaoInstanciaProps {
  instancia: InfoInstancia;
  numero: number;
  aoFechar: (pid: number) => void;
  eFechando?: boolean;
  eEncerrando?: boolean;
}

function formatarTempoAtivo(start_time: number) {
  if (start_time === 0) return 'Recentemente';
  const agora = Math.floor(Date.now() / 1000);
  const diff = agora - start_time;
  
  const minutos = Math.floor(diff / 60);
  const horas = Math.floor(minutos / 60);
  
  if (horas > 0) return `${horas}h ${minutos % 60}m`;
  if (minutos > 0) return `${minutos}m ${diff % 60}s`;
  return `${diff}s`;
}

export function CartaoInstancia({ instancia, numero, aoFechar, eFechando, eEncerrando }: CartaoInstanciaProps) {
  const tempoAtivo = formatarTempoAtivo(instancia.tempo_iniciado_secs);
  const { contas } = useContas();
  
  const contaVinculada = contas.find(c => c.id === instancia.conta_id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative rounded-2xl glass p-4 transition-all duration-300"
      style={{
        background: 'rgba(15, 20, 34, 0.6)',
        borderColor: eEncerrando ? 'var(--color-perigo)' : 'var(--color-borda)',
      }}
    >
      {/* Indicador lateral colorido */}
      <div
        className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full transition-all duration-300"
        style={{
          background: eEncerrando ? 'var(--color-perigo)' : 'var(--color-primaria)',
          boxShadow: eEncerrando ? 'none' : '0 0 10px var(--color-primaria)',
        }}
      />

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {contaVinculada ? (
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0">
              <img src={contaVinculada.usuario.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold"
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid var(--color-borda)',
                color: 'var(--color-primaria)',
              }}
            >
              #{numero}
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-bold text-white truncate max-w-[140px]">
              {contaVinculada ? contaVinculada.usuario.nome_display : 'Roblox Instance'}
            </h3>
            <div className="flex items-center gap-1.5 ">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: 'var(--color-sucesso)',
                  boxShadow: '0 0 5px var(--color-sucesso)',
                }}
              />
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--color-sucesso)' }}>
                Ativa
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--color-texto-apagado)' }}>
            PID do Processo
          </p>
          <p className="text-sm font-mono font-bold text-white">
            {instancia.pid}
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5" style={{ color: 'var(--color-texto-suave)' }}>
            <Clock className="w-3.5 h-3.5" />
            <span>Tempo Ativo</span>
          </div>
          <span className="font-medium text-white">{tempoAtivo}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5" style={{ color: 'var(--color-texto-suave)' }}>
            <Activity className="w-3.5 h-3.5" />
            <span>Status</span>
          </div>
          <span className="font-medium" style={{ color: 'var(--color-sucesso)' }}>Executando</span>
        </div>

        {instancia.nome_jogo && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
            <div className="flex items-center gap-1.5" style={{ color: 'var(--color-primaria)' }}>
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Jogando</span>
            </div>
            <span className="font-bold text-white truncate max-w-[120px]" title={instancia.nome_jogo}>
              {instancia.nome_jogo}
            </span>
          </div>
        )}
      </div>

      <motion.button
        onClick={() => aoFechar(instancia.pid)}
        disabled={eFechando || eEncerrando} // Disabled if eEncerrando is true
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs
                   transition-all duration-200 cursor-pointer disabled:opacity-50"
        style={{
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.2)',
          color: 'var(--color-perigo)',
        }}
      >
        {eFechando || eEncerrando ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animar-girar" />
            <span>Encerrando...</span>
          </>
        ) : (
          <>
            <Power className="w-3.5 h-3.5" />
            <span>Encerrar instância</span>
          </>
        )}
      </motion.button>
    </motion.div>
  );
}
