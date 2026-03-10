import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ContaRoblox, InfoUsuarioRoblox, ContaImportada } from '../tipos';

interface ContasContextData {
  contas: ContaRoblox[];
  estaCarregando: boolean;
  adicionarConta: (cookie: string) => Promise<{ sucesso: boolean; mensagem: string }>;
  removerConta: (id: string) => void;
  buscarContasNavegador: () => Promise<{ sucesso: boolean; contas?: ContaImportada[]; mensagem: string }>;
  adicionarContasImportadas: (contasParaAdicionar: ContaImportada[]) => Promise<void>;
  obterTicketParaConta: (id: string) => Promise<{ sucesso: boolean; ticket?: string; mensagem?: string }>;
  solicitarElevacaoUAC: () => Promise<void>;
  abrirJanelaLogin: () => Promise<void>;
  capturarCookieApp: () => Promise<{ sucesso: boolean; mensagem: string }>;
}

const ContasContext = createContext<ContasContextData>({} as ContasContextData);

export function ContasProvider({ children }: { children: ReactNode }) {
  const [contas, definirContas] = useState<ContaRoblox[]>([]);
  const [estaCarregando, definirEstaCarregando] = useState(true);

  // Carregar contas do banco local ao iniciar
  useEffect(() => {
    const inicializar = async () => {
      try {
        const contasSalvas = await invoke<ContaRoblox[]>('carregar_contas_local');
        definirContas(contasSalvas);
      } catch (e) {
        console.error('Erro ao carregar contas do banco local:', e);
      } finally {
        definirEstaCarregando(false);
      }
    };
    inicializar();
  }, []);

  // Salvar contas no banco local sempre que mudar
  useEffect(() => {
    if (estaCarregando) return;

    const salvar = async () => {
      try {
        await invoke('salvar_contas_local', { contas });
      } catch (e) {
        console.error('Erro ao salvar contas no banco local:', e);
      }
    };
    salvar();
  }, [contas, estaCarregando]);

  const adicionarConta = useCallback(async (cookie: string): Promise<{ sucesso: boolean; mensagem: string }> => {
    try {
      const usuario = await invoke<InfoUsuarioRoblox>('obter_usuario_por_cookie', { cookie });
      
      if (contas.some(c => c.usuario.id === usuario.id)) {
        return { sucesso: false, mensagem: 'Esta conta já foi adicionada.' };
      }

      const novaConta: ContaRoblox = {
        id: usuario.id.toString(),
        cookie,
        usuario,
        data_adicionada: Date.now(),
      };

      definirContas(prev => [...prev, novaConta]);
      return { sucesso: true, mensagem: `Conta ${usuario.nome_display} adicionada!` };
    } catch (e) {
      return { sucesso: false, mensagem: String(e) };
    }
  }, [contas]);

  const removerConta = useCallback((id: string) => {
    definirContas(prev => prev.filter(c => c.id !== id));
  }, []);

  const buscarContasNavegador = useCallback(async (): Promise<{ sucesso: boolean; contas?: ContaImportada[]; mensagem: string }> => {
    try {
      const importadas = await invoke<ContaImportada[]>('importar_contas_navegador');
      const novasContas = importadas.filter(item => !contas.some(c => c.usuario.id === item.perfil.id));
      
      if (novasContas.length === 0) {
        return { sucesso: false, mensagem: 'Nenhuma conta nova encontrada nos navegadores.' };
      }

      return { sucesso: true, contas: novasContas, mensagem: `${novasContas.length} conta(s) encontrada(s)!` };
    } catch (e) {
      return { sucesso: false, mensagem: String(e) };
    }
  }, [contas]);

  const adicionarContasImportadas = useCallback(async (contasParaAdicionar: ContaImportada[]): Promise<void> => {
      const novas = contasParaAdicionar.map(item => ({
        id: item.perfil.id.toString(),
        cookie: item.cookie,
        usuario: item.perfil,
        data_adicionada: Date.now()
      }));

      definirContas(prev => [...prev, ...novas]);
  }, []);

  const obterTicketParaConta = useCallback(async (id: string): Promise<{ sucesso: boolean; ticket?: string; mensagem?: string }> => {
    const conta = contas.find(c => c.id === id);
    if (!conta) return { sucesso: false, mensagem: 'Conta não encontrada.' };

    try {
      const ticket = await invoke<string>('gerar_ticket_autenticacao', { cookie: conta.cookie });
      return { sucesso: true, ticket };
    } catch (e) {
      console.error('Erro ao gerar ticket:', e);
      return { sucesso: false, mensagem: String(e) };
    }
  }, [contas]);

  const solicitarElevacaoUAC = useCallback(async (): Promise<void> => {
    try {
      await invoke('solicitar_elevacao_uac');
    } catch (e) {
      console.error('Erro ao solicitar elevação:', e);
      throw e;
    }
  }, []);

  const abrirJanelaLogin = useCallback(async (): Promise<void> => {
    try {
      await invoke('abrir_janela_login');
    } catch (e) {
      console.error('Erro ao abrir janela de login:', e);
      throw e;
    }
  }, []);

  const capturarCookieApp = useCallback(async (): Promise<{ sucesso: boolean; mensagem: string }> => {
    try {
      const cookie = await invoke<string>('capturar_cookie_app');
      return await adicionarConta(cookie);
    } catch (e) {
      return { sucesso: false, mensagem: String(e) };
    }
  }, [adicionarConta]);

  return (
    <ContasContext.Provider value={{
      contas,
      estaCarregando,
      adicionarConta,
      removerConta,
      buscarContasNavegador,
      adicionarContasImportadas,
      obterTicketParaConta,
      solicitarElevacaoUAC,
      abrirJanelaLogin,
      capturarCookieApp
    }}>
      {children}
    </ContasContext.Provider>
  );
}

export function useSharedContas() {
  const context = useContext(ContasContext);
  if (!context) {
    throw new Error('useSharedContas deve ser usado dentro de um ContasProvider');
  }
  return context;
}
