# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.2.2] - 2026-03-15
### Adicionado
- Funcionalidade de anticrash automática: relança instâncias abertas, preservando conta/cliente, agora robusta para Blox Fruits (mares 2/3).
### Corrigido
- Anticrash agora relança corretamente Blox Fruits nos mares 2 e 3 usando o place raiz, evitando erro 524.
- Formatação da versão exibida em instâncias, mostrando apenas o trecho a partir de "version" para não quebrar o layout.
- Extração de place/universe/jobId refinada para relançamentos estáveis e sem loops de permissão.

## [1.2.0] - 2026-03-10
### Adicionado
- Verificação automática de nova versão via releases do GitHub, com comparação semântica.
- Banner de alerta exibindo quando há uma versão mais recente disponível.
- Exibição da versão atual no topo e no rodapé do menu lateral, com link rápido para a release nova.

## [1.1.0] - 2026-03-10
### Adicionado
- Internacionalização completa em Português e Inglês utilizando `react-i18next`.
- Troca de idioma em tempo real direto pela Interface do Usuário (UI).
- Campo opcional de Job ID (Servidor Específico) adicionado no modal de Lançamento de Instância.

### Corrigido
- Traduções quebradas ou com chaves estáticas ao longo de painéis de perfil de usuário e visualizador de jogos.
- Correções estéticas e links apontados na página Sobre.

## [1.0.0] - 2026-03-10
### Adicionado
- Implementação inicial da interface moderna com React, TypeScript, TailwindCSS e Framer Motion.
- Integração do Backend nativo em Rust (Tauri) com bypass do Mutex `ROBLOX_singletonEvent`.
- Sistema de isolamento de contas via diretórios `LocalStorage`.
- Gerenciador persistente de Múltiplas Contas do Roblox.
- Biblioteca de Jogos completa utilizando APIs Search e Explore do Roblox.
- Suporte a detecção e adição de clientes customizados (Bloxstrap, Fishtrap, etc).
- Suporte de entrada via Job ID para acesso a servidores específicos.
- Monitoramento de instâncias e PIDs em tempo real.
- Página dinâmica de Perfil para busca de jogadores.
- Documentações README em Português e Inglês.
- **[NOVO]** Sistema de Changelog adicionado para rastreamento de versão.
