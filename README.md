# 🚀 DeskHub 3.0 Pro

![Version](https://img.shields.io/badge/version-3.1.0-emerald.svg)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

O **DeskHub** é uma plataforma multi-tenant de produtividade e gestão de atendimentos projetada para equipes de suporte e operações. Ele centraliza base de conhecimento rápido (mensagens, links, atalhos), registro de tickets/ligações, acompanhamento de KPIs em tempo real e integração com Inteligência Artificial (Google Gemini).

---

## ✨ Principais Funcionalidades

* 🔒 **Autenticação e Multi-tenancy:** Sistema seguro via JWT. Os dados (Hub, Anotações, Atendimentos, KPIs) são isolados por usuário.
* 🛡️ **Controle de Acesso (RBAC):** Níveis de permissão `Admin` e `User`. Apenas administradores gerenciam a equipe, IA e configurações globais.
* ⚡ **Hub Rápido:** Gerencie e copie com 1 clique suas Mensagens Padrão, Atalhos de Diretório, Links Úteis e Emojis.
* 📞 **Gestão de Atendimentos:** Controle de ligações e tickets com recurso de *Auto-save* contra perda de dados.
* 🤖 **Integração com IA (Gemini):** Classificação automática da categoria do atendimento baseada na descrição do problema usando o modelo Gemini 2.5 Flash/Pro.
* 📊 **Dashboard de KPIs:** Gráficos interativos (Recharts) com cruzamento de dados de feriados nacionais, metas de produtividade diárias e controle de pausas.
* 📢 **Quadro de Recados e Alertas:** Sistema de comunicação global para a equipe (Incidentes, Lembretes, Informativos) em tempo real.
* 💾 **Backup Automatizado:** Rotina em background com Docker que realiza *dumps* compactados (`.sql.gz`) do banco de dados diariamente na máquina host.

---

## 🛠️ Tecnologias Utilizadas

**Frontend:**
* [React](https://reactjs.org/) (criado via Vite)
* [Tailwind CSS](https://tailwindcss.com/) (Estilização e Dark Mode)
* [Lucide Icons](https://lucide.dev/) (Iconografia)
* [Recharts](https://recharts.org/) (Gráficos)

**Backend:**
* [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
* [Prisma ORM](https://www.prisma.io/) (Modelagem e Migrations)
* [PostgreSQL](https://www.postgresql.org/) (Banco de Dados)
* [Bcryptjs](https://www.npmjs.com/package/bcryptjs) & [JsonWebToken](https://jwt.io/) (Criptografia e Segurança)
* [Helmet](https://helmetjs.github.io/) & [Express Rate Limit](https://www.npmjs.com/package/express-rate-limit) (Proteção de API)

**Infraestrutura:**
* [Docker](https://www.docker.com/) & Docker Compose
* `prodrigestivill/postgres-backup-local` (Imagem para Backup)

---

## ⚙️ Como Executar o Projeto (Deploy Local)

### 1. Pré-requisitos
* Ter o [Docker](https://docs.docker.com/get-docker/) e o [Docker Compose](https://docs.docker.com/compose/install/) instalados na sua máquina.
* Git para clonar o repositório.

### 2. Configuração de Variáveis de Ambiente
Na pasta raiz do projeto e também dentro da pasta `backend`, crie os arquivos `.env` baseados nos arquivos de exemplo:
```bash
cp .env.production.example .env
