# MultiRoblox Manager

Uma versão moderna, robusta e elegante do utilitário MultiRoblox. Construído com **Tauri**, **React** e **TypeScript**, este gerenciador permite que você tenha total controle sobre suas sessões de Roblox no Windows.

## 🚀 Funcionalidades

- **Multiplas Instâncias:** Abra quantas instâncias do Roblox você quiser simultaneamente (através da técnica de Bypass do Mutex `ROBLOX_singletonEvent`).
- **Gerenciador de Contas:** Salve múltiplas contas do Roblox e alterne entre elas com facilidade.
- **Biblioteca de Jogos:** Pesquise jogos, visualize novidades e lance jogos em contas específicas ou com diferentes clientes customizados nativamente do app.
- **Clientes Customizados:** Compatibilidade e gerenciamento de executáveis modificados/custom de Roblox (como Fishtrap, Ronix, etc).
- **Busca de Jogadores:** Encontre perfis e acompanhe status da API em tempo real.
- **Monitoramento em Tempo Real:** Acompanhe PIDs e tempo de execução das instâncias abertas ativamente.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion, Lucide React
- **Backend (Desktop):** Rust via Tauri
- **APIs:** Integração direta com os novos endpoints do Roblox (Search API, Explore API, Auth)

## ⚙️ Como Funciona?

O Roblox padrão detecta se o jogo já está aberto procurando por um Mutex específico no Windows chamado `ROBLOX_singletonEvent`. O backend em Rust deste aplicativo atua proativamente segurando e manipulando esse Mutex, o que "engana" o Roblox ao tentar buscar bloqueios, permitindo que infinitas sessões operem simultaneamente no mesmo PC.

## 💻 Como Rodar o Projeto

\`\`\`bash
# 1. Clone o repositório
git clone https://github.com/SeuUsuario/dragons-manager.git

# 2. Instale as dependências
npm install

# 3. Rode no ambiente de desenvolvimento (Inicia o frontend e o backend webview/Rust)
npm run tauri dev

# 4. Construa (Build) para produção (gera o instalador .exe)
npm run tauri build
\`\`\`

## 📚 Créditos / Inspiração

Baseado na lógica original do [MultiRoblox](https://github.com/Dashbloxx/MultiRoblox) por Dashbloxx e no projeto [RAM_Source](https://github.com/Babyhamsta/RAM_Source). Recriado com foco em estabilidade, UI moderna e facilidades multi-contas.
