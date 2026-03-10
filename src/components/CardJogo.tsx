import { motion } from 'framer-motion';
import { Heart, Users, ThumbsUp } from 'lucide-react';
import { InfoJogoRoblox } from '../tipos';
import { useTranslation } from 'react-i18next';

interface PropsCardJogo {
  jogo: InfoJogoRoblox;
  aoClicar: (jogo: InfoJogoRoblox) => void;
  aoFavoritar: (e: React.MouseEvent, jogo: InfoJogoRoblox) => void;
}

export function CardJogo({ jogo, aoClicar, aoFavoritar }: PropsCardJogo) {
  const { t } = useTranslation();
  // Formata números grandes (ex: 12500 -> 12.5k)
  const formatarNumero = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => aoClicar(jogo)}
      className="glass rounded-2xl overflow-hidden cursor-pointer flex flex-col transition-shadow duration-300 hover:shadow-xl"
      style={{
        boxShadow: 'var(--sombra-suave)',
        border: '1px solid var(--cor-borda)',
      }}
    >
      <div className="relative aspect-video w-full bg-slate-800 overflow-hidden">
        {jogo.thumbnail_url ? (
          <img
            src={jogo.thumbnail_url}
            alt={jogo.nome}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800/50">
            <span className="text-slate-500 text-xs">{t('jogos.semImagem')}</span>
          </div>
        )}

        {/* Gradiente sobre a imagem para destacar o texto e os icones */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />

        {/* Botão de Favoritar */}
        <button
          onClick={(e) => aoFavoritar(e, jogo)}
          className="absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all hover:scale-110"
          style={{
            background: jogo.favorito_local ? 'rgba(244, 63, 94, 0.2)' : 'rgba(0,0,0,0.4)',
            border: `1px solid ${jogo.favorito_local ? 'rgba(244, 63, 94, 0.4)' : 'rgba(255,255,255,0.1)'}`
          }}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${jogo.favorito_local ? 'text-rose-500 fill-rose-500' : 'text-white'}`}
          />
        </button>

        {/* Badges de stats rápidos na imagem */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
          {jogo.jogadores_ativos !== undefined && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-white/90 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md border border-white/10">
              <Users className="w-3 h-3 text-emerald-400" />
              {formatarNumero(jogo.jogadores_ativos)}
            </span>
          )}
          {jogo.curtidas !== undefined && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-white/90 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md border border-white/10">
              <ThumbsUp className="w-3 h-3 text-blue-400" />
              {formatarNumero(jogo.curtidas)}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-sm line-clamp-1 mb-1" style={{ color: 'var(--cor-texto)', fontFamily: 'var(--fonte-heading)' }}>
          {jogo.nome}
        </h3>
        {jogo.criador_nome && (
          <p className="text-xs mb-2" style={{ color: 'var(--cor-texto-suave)' }}>
            {t('jogos.por')} <span className="text-white/80 font-medium">{jogo.criador_nome}</span>
          </p>
        )}
        <p className="text-[11px] line-clamp-2 mt-auto leading-relaxed" style={{ color: 'var(--cor-texto-apagado)' }}>
          {jogo.descricao || t('jogos.semDescricao')}
        </p>
      </div>
    </motion.div>
  );
}
