// ─────────────────────────────────────────────
// Tipos compartilhados do MultiRoblox Manager
// ─────────────────────────────────────────────

export interface InfoInstancia {
  pid: number;
  nome_processo: string;
  tempo_iniciado_secs: number;
  conta_id?: string;
  place_id?: number;
  universe_id?: number;
  nome_jogo?: string;
  versao?: string;
  caminho_cliente?: string;
  job_id?: string;
}

export interface ClienteRoblox {
  nome: string;
  caminho: string;
  tipo: string;
}

export interface ClienteCustomizado {
  id: string;
  nome: string;
  caminho: string;
}

export interface ContaRoblox {
  id: string; // id único para gerenciar no storage
  cookie: string;
  usuario: InfoUsuarioRoblox;
  data_adicionada: number;
}

export interface ContaImportada {
  perfil: InfoUsuarioRoblox;
  cookie: string;
}

export interface InfoUsuarioRoblox {
  id: number;
  nome: string;
  nome_display: string;
  avatar_url: string;
  descricao: string;
  e_premium: boolean;
}

export interface InfoJogoRoblox {
  place_id: number;
  universe_id: number;
  nome: string;
  descricao: string;
  thumbnail_url?: string;
  jogadores_ativos?: number;
  criador_nome?: string;
  curtidas?: number;
  favorito_local?: boolean; // Estado local (manager) de favorito
}

export interface RespostaBuscaJogos {
  virgula_anterior?: string;
  virgula_proxima?: string;
  jogos: InfoJogoRoblox[];
}

export type SecaoAtiva = 'instancias' | 'buscar' | 'sobre' | 'contas' | 'jogos';
