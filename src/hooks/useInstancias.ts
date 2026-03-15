import { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { InfoInstancia, ClienteRoblox, ClienteCustomizado } from '../tipos';

const CHAVE_STORAGE_CAMINHO = 'multiroblox_caminho_custom';
const CHAVE_STORAGE_CLIENTES_CUSTOM = 'multiroblox_clientes_customizados';
const CHAVE_STORAGE_CLIENTES_OCULTOS = 'multiroblox_clientes_ocultos';

const INTERVALO_ATUALIZACAO_MS = 3000;

/**
 * Hook para monitorar as instâncias do Roblox em tempo real.
 * Faz polling a cada 3 segundos.
 */
export function useInstancias() {
  const [instancias, definirInstancias] = useState<InfoInstancia[]>([]);
  const [clientesEncontrados, definirClientesEncontrados] = useState<ClienteRoblox[]>([]);
  const [clientesCustomizados, definirClientesCustomizados] = useState<ClienteCustomizado[]>(() => {
    const salvo = localStorage.getItem(CHAVE_STORAGE_CLIENTES_CUSTOM);
    return salvo ? JSON.parse(salvo) : [];
  });
  const [caminhoCustomizado, definirCaminhoCustomizado] = useState<string | null>(localStorage.getItem(CHAVE_STORAGE_CAMINHO));
  const [estaCarregando, definirEstaCarregando] = useState(true);
  const [erro, definirErro] = useState<string | null>(null);

  const [clientesOcultos, definirClientesOcultos] = useState<string[]>(() => {
    const salvo = localStorage.getItem(CHAVE_STORAGE_CLIENTES_OCULTOS);
    return salvo ? JSON.parse(salvo) : [];
  });

  // Sincroniza clientes customizados com localStorage
  useEffect(() => {
    localStorage.setItem(CHAVE_STORAGE_CLIENTES_CUSTOM, JSON.stringify(clientesCustomizados));
  }, [clientesCustomizados]);

  useEffect(() => {
    localStorage.setItem(CHAVE_STORAGE_CLIENTES_OCULTOS, JSON.stringify(clientesOcultos));
  }, [clientesOcultos]);

  const ocultarCliente = useCallback((caminho: string) => {
    definirClientesOcultos(prev => {
      if (!prev.includes(caminho)) return [...prev, caminho];
      return prev;
    });
  }, []);

  const atualizarClientes = useCallback(async () => {
    try {
      const lista = await invoke<ClienteRoblox[]>('verificar_roblox_instalado');
      definirClientesEncontrados(lista);
    } catch (e) {
      console.error('Erro ao buscar clientes:', e);
    }
  }, []);

  const adicionarClienteCustomizado = useCallback(async (nome: string) => {
    try {
      const selecionado = await open({
        multiple: false,
        directory: false,
        filters: [{
          name: 'Executável do Roblox',
          extensions: ['exe']
        }]
      });

      if (selecionado && typeof selecionado === 'string') {
        const novoCliente: ClienteCustomizado = {
          id: crypto.randomUUID(),
          nome,
          caminho: selecionado
        };
        definirClientesCustomizados(prev => [...prev, novoCliente]);
        return true;
      }
    } catch (e) {
      console.error('Erro ao adicionar cliente:', e);
    }
    return false;
  }, []);

  const removerClienteCustomizado = useCallback((id: string) => {
    definirClientesCustomizados(prev => prev.filter(c => c.id !== id));
  }, []);

  const selecionarCaminhoManual = useCallback(async () => {
    try {
      const selecionado = await open({
        multiple: false,
        directory: false,
        filters: [{
          name: 'Executável do Roblox',
          extensions: ['exe']
        }]
      });

      if (selecionado && typeof selecionado === 'string') {
        localStorage.setItem(CHAVE_STORAGE_CAMINHO, selecionado);
        definirCaminhoCustomizado(selecionado);
        return selecionado;
      }
    } catch (e) {
      console.error('Erro ao abrir seletor:', e);
    }
    return null;
  }, []);

  const limparCaminhoManual = useCallback(() => {
    localStorage.removeItem(CHAVE_STORAGE_CAMINHO);
    definirCaminhoCustomizado(null);
  }, []);

  const atualizarInstancias = useCallback(async () => {
    try {
      const resultado = await invoke<InfoInstancia[]>('listar_instancias');
      definirInstancias(resultado);
      definirErro(null);
    } catch (erroCapturado) {
      definirErro(String(erroCapturado));
    } finally {
      definirEstaCarregando(false);
    }
  }, []);

  useEffect(() => {
    atualizarInstancias();
    atualizarClientes();
    const intervalo = setInterval(atualizarInstancias, INTERVALO_ATUALIZACAO_MS);
    return () => clearInterval(intervalo);
  }, [atualizarInstancias, atualizarClientes]);

  const lancarNovaInstancia = useCallback(async (config?: { caminho?: string, ticket?: string, contaId?: string, userId?: number, placeId?: number, jobId?: string }): Promise<{sucesso: boolean; mensagem: string}> => {
    try {
      const caminhoParaUsar = config?.caminho || caminhoCustomizado || null;
      const mensagem = await invoke<string>('lancar_roblox', { 
        caminhoCustomizado: caminhoParaUsar,
        ticket: config?.ticket || null,
        contaId: config?.contaId || null,
        userId: config?.userId || null,
        placeId: config?.placeId || null,
        jobId: config?.jobId || null
      });
      // Atualiza a lista após lançar
      setTimeout(atualizarInstancias, 1500);
      return { sucesso: true, mensagem };
    } catch (erroCapturado) {
      return { sucesso: false, mensagem: String(erroCapturado) };
    }
  }, [atualizarInstancias, caminhoCustomizado]);

  const fecharInstancia = useCallback(async (pid: number): Promise<{sucesso: boolean; mensagem: string}> => {
    try {
      await invoke('fechar_instancia', { pid });
      setTimeout(atualizarInstancias, 800);
      return { sucesso: true, mensagem: `Instância PID ${pid} encerrada.` };
    } catch (erroCapturado) {
      return { sucesso: false, mensagem: String(erroCapturado) };
    }
  }, [atualizarInstancias]);

  // Lista consolidada de todos os clientes disponíveis
  const todosOsClientes = useMemo(() => {
    const lista: { id: string, nome: string, caminho: string, eAutomatico: boolean, eLegado?: boolean }[] = [];

    // 1. Adiciona detectados automaticamente
    clientesEncontrados.forEach(c => {
      if (!clientesOcultos.includes(c.caminho)) {
        lista.push({
          id: `auto-${c.tipo}`,
          nome: c.tipo === 'Oficial' ? 'Roblox Padrão' : c.nome,
          caminho: c.caminho,
          eAutomatico: true
        });
      }
    });
    
    // 2. Adiciona o customizado "legado" se existir e não for duplicado
    if (caminhoCustomizado) {
      const existeNalista = lista.some(c => c.caminho === caminhoCustomizado);
      if (!existeNalista) {
        lista.push({
          id: 'legacy-custom',
          nome: 'Cliente Configurado',
          caminho: caminhoCustomizado,
          eAutomatico: false,
          eLegado: true
        });
      }
    }

    // 3. Adiciona os novos customizados com nome
    clientesCustomizados.forEach(c => {
      const existeNalista = lista.some(item => item.caminho === c.caminho);
      if (!existeNalista) {
        lista.push({
          id: c.id,
          nome: c.nome,
          caminho: c.caminho,
          eAutomatico: false
        });
      }
    });

    return lista;
  }, [clientesEncontrados, clientesCustomizados, caminhoCustomizado, clientesOcultos]);

  return {
    instancias,
    clientesEncontrados,
    clientesCustomizados,
    todosOsClientes,
    caminhoCustomizado,
    estaCarregando,
    erro,
    lancarNovaInstancia,
    fecharInstancia,
    atualizarInstancias,
    selecionarCaminhoManual,
    limparCaminhoManual,
    adicionarClienteCustomizado,
    removerClienteCustomizado,
    clientesOcultos,
    ocultarCliente
  };
}
