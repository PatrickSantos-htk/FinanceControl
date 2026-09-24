<h1 align="center">💰 FinanceControl</h1>

<p align="center">
  Controle financeiro pessoal para o dia a dia: ganhos e gastos do mês, gastos fixos lançados sozinhos,
  relatórios com gráficos e exportação para planilha. Funciona no celular (instalável) e no PC.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/TanStack_Query-FF4154?style=flat-square&logo=reactquery&logoColor=white" />
  <img src="https://img.shields.io/badge/styled--components-DB7093?style=flat-square&logo=styledcomponents&logoColor=white" />
  <img src="https://img.shields.io/badge/PWA-5A0FC8?style=flat-square&logo=pwa&logoColor=white" />
</p>

<p align="center">
  <img src="docs/mobile-mes.png" width="240" alt="Visão do mês no celular" />
  <img src="docs/mobile-fixos.png" width="240" alt="Gastos fixos" />
  <img src="docs/mobile-relatorios.png" width="240" alt="Relatórios" />
</p>

## O que ele faz

| Aba | Para quê |
| :--- | :--- |
| **Mês** | Navega mês a mês com saldo, entradas e saídas, comparação com o mês anterior, busca e filtros (entradas, saídas, pendentes). Um toque marca a conta como paga. |
| **Fixos** | Cadastra aluguel, internet, assinaturas, salário… O app lança sozinho todo mês como *pendente*, mostra quanto da renda fixa já está comprometido e permite pausar ou encerrar. Nos meses futuros os fixos aparecem como *previstos*. |
| **Relatórios** | Entradas x saídas x saldo dos últimos 3, 6 ou 12 meses, gastos por categoria (mês ou período), média mensal, taxa de economia e exportação em CSV (abre direto no Excel e no Google Planilhas). |

Outros detalhes:

- **Sem cadastro e sem servidor:** os dados ficam salvos no próprio navegador (localStorage).
- **Backup:** baixa um arquivo `.json` com tudo e restaura em outro aparelho (celular ↔ PC). O app avisa quando faz mais de 30 dias sem backup.
- Valores digitados no padrão brasileiro (`1.234,56`) e somas em centavos, sem erro de arredondamento.
- Um fixo nunca é lançado duas vezes no mesmo mês. Se você apagar um lançamento de fixo, ele não volta.
- Instalável como app (PWA): no celular, *Adicionar à tela inicial*.
- **Pronto para nuvem:** a camada de dados tem a mesma interface para o navegador e para o Supabase (Postgres + Auth + RLS). Basta configurar as variáveis para ativar login e sincronização.

## Como usar no dia a dia

```bash
npm install
npm run dev
```

Para usar no celular, publique na Vercel (importar o repositório, sem configurar nada) e, no celular, abra o link e toque em *Adicionar à tela inicial*.

> Os dados de cada aparelho são independentes. Para levar do PC para o celular (ou vice-versa), use **Backup → Baixar backup** em um e **Restaurar** no outro.

### Opcional: sincronizar entre aparelhos com Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) e rode [`supabase/schema.sql`](supabase/schema.sql) no **SQL Editor**.
2. Em **Authentication → URL Configuration**, coloque a URL do app em *Site URL*.
3. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (na Vercel, em *Environment Variables*).

Com as variáveis configuradas o app passa a pedir login e salva tudo no banco, com Row Level Security.

## Scripts

```bash
npm run dev        # ambiente de desenvolvimento
npm run build      # checagem de tipos + build de produção
npm run preview    # testa o build localmente
npm run lint       # ESLint
npm test           # testes das regras (dinheiro, meses, fixos, resumo e CSV)
```

## Estrutura

```
src/
├── auth/          # sessão (login só quando o Supabase está ativo)
├── components/    # layout, formulários, lista, cards de resumo
├── data/          # acesso a dados: navegador (padrão) ou Supabase, com a mesma interface
├── domain/        # regras puras e testadas: dinheiro, meses, fixos, resumo, CSV
├── hooks/         # queries e mutations com TanStack Query
├── pages/         # Mês, Fixos, Relatórios, Entrar
└── styles/        # tema e estilos globais
supabase/schema.sql   # tabelas, índices e políticas de segurança
public/               # manifest, ícones e service worker do PWA
```

<p align="center">
  <img src="docs/desktop-relatorios.png" width="820" alt="Relatórios no desktop" />
</p>

---

Feito por [Patrick Santos Ribeiro](https://www.linkedin.com/in/patrick-santos-162899207/). Começou como o projeto *DT Money* do curso de React da Rocketseat e foi reescrito para uso real.
