import { motion } from 'framer-motion';
import { Gamepad2, Search, Info, ChevronRight, Users, LayoutDashboard } from 'lucide-react';
import { SecaoAtiva } from '../tipos';
import clsx from 'clsx';

interface BarraLateralProps {
  secaoAtiva: SecaoAtiva;
  aoSelecionarSecao: (secao: SecaoAtiva) => void;
  quantidadeInstancias: number;
}

const itensNavegacao = [
  {
    id: 'instancias' as SecaoAtiva,
    rotulo: 'Instâncias',
    descricao: 'Gerenciar sessões',
    Icone: Gamepad2,
  },
  {
    id: 'buscar' as SecaoAtiva,
    rotulo: 'Buscar Jogador',
    descricao: 'Perfil Roblox',
    Icone: Search,
  },
  {
    id: 'contas' as SecaoAtiva,
    rotulo: 'Contas',
    descricao: 'Multiconta',
    Icone: Users,
  },
  {
    id: 'jogos' as SecaoAtiva,
    rotulo: 'Jogos',
    descricao: 'Jogos Catalogados',
    Icone: LayoutDashboard,
  },
  {
    id: 'sobre' as SecaoAtiva,
    rotulo: 'Sobre',
    descricao: 'Info do app',
    Icone: Info,
  },
] as const;

export function BarraLateral({ secaoAtiva, aoSelecionarSecao, quantidadeInstancias }: BarraLateralProps) {
  return (
    <aside
      className="flex flex-col h-full w-64 flex-shrink-0 border-r"
      style={{ borderColor: 'var(--color-borda)', background: 'var(--color-superficie)' }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b" style={{ borderColor: 'var(--color-borda)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 flex items-center justify-center flex-shrink-0"
          >
            <img src="/logo.png" alt="MultiRoblox" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              MultiRoblox
            </h1>
            <p className="text-xs" style={{ color: 'var(--color-texto-suave)' }}>Manager v1.0</p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {itensNavegacao.map(({ id, rotulo, descricao, Icone }) => {
          const eAtivo = secaoAtiva === id;
          return (
            <motion.button
              key={id}
              onClick={() => aoSelecionarSecao(id)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer group',
                eAtivo
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              )}
              style={eAtivo ? {
                background: 'rgba(232, 106, 88, 0.1)', // Fundo laranja super suave
                border: '1px solid rgba(232, 106, 88, 0.3)', // Borda laranja
              } : {
                background: 'transparent',
                border: '1px solid transparent',
              }}
              aria-current={eAtivo ? 'page' : undefined}
            >
              <Icone
                className="w-4 h-4 flex-shrink-0"
                style={{ color: eAtivo ? 'var(--color-primaria)' : 'inherit' }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {rotulo}
                  {id === 'instancias' && quantidadeInstancias > 0 && (
                    <span
                      className="ml-2 inline-flex items-center justify-center w-4 h-4 text-xs font-bold rounded-full"
                      style={{ background: 'var(--color-primaria)', color: 'white' }}
                    >
                      {quantidadeInstancias}
                    </span>
                  )}
                </div>
                <div className="text-xs truncate opacity-60">{descricao}</div>
              </div>
              {eAtivo && (
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-primaria)' }} />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Rodapé */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--color-borda)' }}>
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--color-texto-suave)' }}>
            Baseado no MultiRoblox
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-texto-apagado)' }}>
            by WellDone-Dev
          </p>
        </div>
      </div>
    </aside>
  );
}
