import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { Search, Loader2, Heart, Library } from 'lucide-react';
import { InfoJogoRoblox, RespostaBuscaJogos } from '../tipos';
import { CardJogo } from './CardJogo';
import { ModalLancamentoJogo } from './ModalLancamentoJogo';
import { useTranslation } from 'react-i18next';

export function SecaoJogos() {
  const { t } = useTranslation();
  const [abaAtual, definirAbaAtual] = useState<'descobrir' | 'favoritos'>('descobrir');
  const [termoBusca, definirTermoBusca] = useState('');

  const [jogos, definirJogos] = useState<InfoJogoRoblox[]>([]);
  const [favoritos, definirFavoritos] = useState<InfoJogoRoblox[]>([]);

  const [cursorProximo, definirCursorProximo] = useState<string | null>(null);
  const [estaCarregando, definirEstaCarregando] = useState(false);
  const [estaCarregandoMais, definirEstaCarregandoMais] = useState(false);
  const [erroMensagem, definirErroMensagem] = useState<string | null>(null);

  const [jogoSelecionado, definirJogoSelecionado] = useState<InfoJogoRoblox | null>(null);

  const carregarFavoritos = useCallback(async () => {
    try {
      const favs = await invoke<InfoJogoRoblox[]>('obter_favoritos_locais');
      definirFavoritos(favs);
    } catch (e) {
      console.error(t('jogos.erroFavoritos'), e);
    }
  }, [t]);

  useEffect(() => {
    carregarFavoritos();
    // Busca inicial em branco para trazer os jogos "Em Alta"
    buscarJogos('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregarFavoritos]);

  const buscarJogos = async (termo: string, resetar: boolean = true) => {
    // Só bloqueia se for busca pelo formulário e estiver vazio. 
    // Como a load inicial manda termo='', e a gente trata isso na backend, passa direto.
    if (resetar) {
      definirEstaCarregando(true);
      definirJogos([]);
      definirCursorProximo(null);
    } else {
      definirEstaCarregandoMais(true);
    }

    definirErroMensagem(null);

    try {
      const cursorParaMandar = resetar ? null : cursorProximo;
      const resultado = await invoke<RespostaBuscaJogos>('buscar_jogos_roblox', {
        termo: termo.trim(),
        cursor: cursorParaMandar,
      });

      if (resetar) {
        definirJogos(resultado.jogos);
      } else {
        definirJogos(prev => [...prev, ...resultado.jogos]);
      }

      definirCursorProximo(resultado.virgula_proxima || null);
    } catch (erro) {
      definirErroMensagem(String(erro));
    } finally {
      definirEstaCarregando(false);
      definirEstaCarregandoMais(false);
    }
  };

  const aoSubmeterBusca = (e: React.FormEvent) => {
    e.preventDefault();
    if (abaAtual !== 'descobrir') definirAbaAtual('descobrir');
    buscarJogos(termoBusca, true);
  };

  const alternarFavorito = async (e: React.MouseEvent, jogo: InfoJogoRoblox) => {
    e.stopPropagation();

    let novosFavoritos = [...favoritos];
    const index = novosFavoritos.findIndex(f => f.universe_id === jogo.universe_id);

    const eFavAgora = index === -1;

    if (eFavAgora) {
      const novoFav = { ...jogo, favorito_local: true };
      novosFavoritos.push(novoFav);
    } else {
      novosFavoritos.splice(index, 1);
    }

    definirFavoritos(novosFavoritos);

    // Atualiza a lista atual de jogos da busca
    definirJogos(prev =>
      prev.map(j =>
        j.universe_id === jogo.universe_id ? { ...j, favorito_local: eFavAgora } : j
      )
    );

    try {
      await invoke('salvar_favoritos_locais', { favoritos: novosFavoritos });
    } catch (error) {
      console.error(t('jogos.erroSalvarFavoritos'), error);
    }
  };

  const listaAtual = abaAtual === 'descobrir' ? jogos : favoritos;

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white" style={{ fontFamily: 'var(--fonte-heading)' }}>
            {t('jogos.titulo')}
          </h2>
          <p className="text-sm text-gray-400 mt-1">{t('jogos.descricao')}</p>
        </div>

        {/* Abas */}
        <div className="flex p-1 bg-black/20 rounded-xl border border-white/5 max-w-sm shrink-0">
          <button
            onClick={() => definirAbaAtual('descobrir')}
            className={`flex items-center justify-center gap-2 px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${abaAtual === 'descobrir' ? 'bg-[var(--cor-primaria)] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            <Library className="w-4 h-4" />
            {t('jogos.descobrir')}
          </button>
          <button
            onClick={() => definirAbaAtual('favoritos')}
            className={`flex items-center justify-center gap-2 px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${abaAtual === 'favoritos' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-gray-500 hover:text-rose-400'
              }`}
          >
            <Heart className="w-4 h-4" />
            {t('jogos.favoritos', { count: favoritos.length })}
          </button>
        </div>
      </div>

      {/* Busca */}
      {abaAtual === 'descobrir' && (
        <form onSubmit={aoSubmeterBusca} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => definirTermoBusca(e.target.value)}
              placeholder={t('jogos.placeholderBusca')}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm bg-[var(--cor-superficie-2)] border border-[var(--cor-borda)] text-white outline-none focus:border-[var(--cor-primaria)] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={estaCarregando}
            className="px-8 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--cor-primaria), var(--cor-acento))' }}
          >
            {t('jogos.buscar')}
          </button>
        </form>
      )}

      {/* Grid de Jogos */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
        {estaCarregando ? (
          <div className="flex flex-col items-center justify-center h-40 space-y-4">
            <Loader2 className="w-8 h-8 text-[var(--cor-primaria)] animar-girar" />
            <p className="text-sm text-gray-400">{t('jogos.buscando')}</p>
          </div>
        ) : erroMensagem ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-center text-sm">
            {erroMensagem}
          </div>
        ) : listaAtual.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 space-y-2 text-gray-500">
            {abaAtual === 'favoritos' ? (
              <>
                <Heart className="w-10 h-10 text-gray-600 mb-2" />
                <p>{t('jogos.semFavoritos')}</p>
                <p className="text-xs">{t('jogos.dicaFavoritos')}</p>
              </>
            ) : (
              <>
                <Search className="w-10 h-10 text-gray-600 mb-2" />
                <p>{t('jogos.nenhumEncontrado')}</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {listaAtual.map((jogo, i) => (
                <CardJogo
                  key={`${jogo.universe_id}-${i}`}
                  jogo={jogo}
                  aoFavoritar={alternarFavorito}
                  aoClicar={definirJogoSelecionado}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Load More Button */}
        {abaAtual === 'descobrir' && cursorProximo && !estaCarregando && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => buscarJogos(termoBusca, false)}
              disabled={estaCarregandoMais}
              className="px-6 py-2.5 rounded-xl border border-[var(--cor-borda)] text-gray-300 text-sm font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
            >
              {estaCarregandoMais ? <Loader2 className="w-4 h-4 animar-girar" /> : t('jogos.carregarMais')}
            </button>
          </div>
        )}
      </div>

      {jogoSelecionado && (
        <ModalLancamentoJogo
          jogo={jogoSelecionado}
          aoFechar={() => definirJogoSelecionado(null)}
        />
      )}
    </div>
  );
}
