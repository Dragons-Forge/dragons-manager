import { useEffect, useMemo, useState } from 'react';
import packageJson from '../../package.json';

interface InformacaoAtualizacao {
  versaoAtual: string;
  versaoDisponivel: string | null;
  urlRelease: string | null;
  estaCarregando: boolean;
  temNovaVersao: boolean;
}

function compararSemver(versaoA: string, versaoB: string): number {
  const partesA = versaoA.split('.').map(Number);
  const partesB = versaoB.split('.').map(Number);

  for (let i = 0; i < Math.max(partesA.length, partesB.length); i++) {
    const a = partesA[i] ?? 0;
    const b = partesB[i] ?? 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

export function useAtualizacao(): InformacaoAtualizacao {
  const versaoAtual = useMemo(() => packageJson.version, []);
  const [versaoDisponivel, definirVersaoDisponivel] = useState<string | null>(null);
  const [urlRelease, definirUrlRelease] = useState<string | null>(null);
  const [estaCarregando, definirEstaCarregando] = useState(true);

  useEffect(() => {
    const buscarUltimaRelease = async () => {
      try {
        const resposta = await fetch('https://api.github.com/repos/Dragons-Forge/dragons-manager/releases/latest', {
          headers: {
            'Accept': 'application/vnd.github+json'
          }
        });
        if (!resposta.ok) throw new Error(`Falha ao consultar releases (${resposta.status})`);
        const dados = await resposta.json();
        const versaoApi = (dados.tag_name || dados.name || '').replace(/^v/i, '') || null;
        definirVersaoDisponivel(versaoApi);
        definirUrlRelease(dados.html_url || null);
      } catch (e) {
        console.error('Erro ao verificar atualização:', e);
      } finally {
        definirEstaCarregando(false);
      }
    };

    buscarUltimaRelease();
  }, []);

  const temNovaVersao = useMemo(() => {
    if (!versaoDisponivel) return false;
    return compararSemver(versaoDisponivel, versaoAtual) === 1;
  }, [versaoDisponivel, versaoAtual]);

  return { versaoAtual, versaoDisponivel, urlRelease, estaCarregando, temNovaVersao };
}
