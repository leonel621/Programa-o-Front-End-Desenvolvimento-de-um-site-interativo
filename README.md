# 🎮 Portal Tetris

Projeto desenvolvido para a disciplina de **Programação Front-End**, com o objetivo de criar um site interativo utilizando **HTML, CSS e JavaScript puro**, sem o uso de frameworks.

---

## 📌 Tema

O site é um **portal temático de Tetris**, onde o usuário pode jogar o clássico jogo diretamente no navegador, registrar seu apelido, visualizar outros jogos gratuitos e alternar entre tema claro e escuro.

---

## ✅ Funcionalidades Implementadas

### 1. 🌓 Alternância de Tema Claro/Escuro
- Botão no cabeçalho que alterna entre tema escuro (padrão) e tema claro
- A troca acontece de forma suave via transição CSS
- As cores são controladas por variáveis CSS (`:root`), facilitando a manutenção

### 2. 📝 Formulário com Validação
- Campo para o usuário registrar um apelido
- Validação feita em JavaScript puro (sem bibliotecas):
  - Apelido não pode ser vazio
  - Apelido precisa ter pelo menos 3 caracteres
- Mensagens de erro exibidas dinamicamente na tela

### 3. 👥 Lista de Jogadores Registrados
- Jogadores registrados aparecem em uma lista dinâmica
- Cada item possui um botão **Remover** gerado via JavaScript
- Quando a lista fica vazia, exibe a mensagem padrão automaticamente

### 4. 🌐 Requisição à API Externa (AJAX/Fetch)
- Botão que busca jogos gratuitos da API [FreeToGame](https://www.freetogame.com/)
- Os 6 primeiros resultados são exibidos em cards com imagem, nome, gênero e link
- Tratamento de erros caso a API esteja fora do ar ou sem conexão

### 5. 🕹️ Jogo Tetris Completo
- Jogo clássico de Tetris implementado do zero com JavaScript e Canvas 2D
- Funcionalidades do jogo:
  - 7 tipos de peças com cores distintas
  - Rotação com *wall kicks* (sistema SRS simplificado)
  - Peça fantasma mostrando onde a peça vai cair
  - Queda acelerada (segurar ↓) e queda instantânea (Espaço)
  - Sistema de níveis: a cada 10 linhas o jogo fica mais rápido
  - Pontuação por quantidade de linhas eliminadas de uma vez
  - Recorde salvo no `localStorage` (persiste mesmo fechando o navegador)
  - Tela de pause, game over e reinício
- Controles por **teclado** e por **botões na tela** (compatível com celular)
- Suporte a **gestos de swipe** no canvas para jogar no mobile
- O jogo abre em um **modal** por cima da página

### 6. ℹ️ Pop-up "Saiba Mais" com Botão Fugitivo
- Botão "Saiba Mais" abre um pop-up de confirmação
- O pop-up pergunta se o usuário quer jogar Tetris
- O botão **"Sim"** fecha o pop-up e abre o jogo
- O botão **"Não"** foge do cursor do mouse toda vez que o usuário tenta clicar nele
- No celular, o botão foge ao toque (`touchstart`)

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Uso |
|---|---|
| **HTML5** | Estrutura semântica da página (`header`, `main`, `section`, `aside`, `footer`) |
| **CSS3** | Estilização completa, variáveis CSS, Flexbox, Grid, animações e Media Queries |
| **JavaScript (ES6+)** | Toda a interatividade: DOM, eventos, Canvas 2D, Fetch API, localStorage |
| **Canvas API** | Renderização do jogo Tetris (desenho de blocos, grade e animações) |
| **Fetch API** | Requisição assíncrona à API externa de jogos |
| **localStorage** | Persistência do recorde do Tetris entre sessões |

---

## 📁 Estrutura de Arquivos

```
📁 projeto/
├── index.html   → estrutura HTML da página
├── style.css    → toda a estilização (tema, layout, responsividade, Tetris)
├── script.js    → funcionalidades do portal (tema, formulário, lista, API, popups)
├── tetris.js    → lógica completa do jogo Tetris
└── README.md    → documentação do projeto
```

---

## 📱 Responsividade

O site se adapta a diferentes tamanhos de tela:

- **Desktop** — layout completo com grid de 3 colunas para os jogos da API
- **Tablet (≤ 768px)** — cabeçalho empilhado, grid de 2 colunas
- **Mobile (≤ 480px)** — layout em coluna única, botões ocupam largura total
- **Tetris no mobile** — controles por botões na tela e gestos de swipe

---

## ♿ Acessibilidade

- Atributos `aria-label`, `aria-labelledby`, `aria-modal` e `role` nos elementos interativos
- Texto alternativo (`alt`) nas imagens dos cards de jogos
- Mensagens de erro com `role="alert"` e `aria-live="polite"`
- Navegação por teclado em todos os botões e formulários
- Contraste adequado entre texto e fundo em ambos os temas

---

## 👨‍💻 Desenvolvedores

| Nome |
|---|
| Eduardo Leonel Santos |
| João Victor Bassolli |
| Reginaldo de Oliveira Ribeiro da Silva |

**Disciplina:** Programação Front-End  
**Professor:** José Carlos Domingues Flores
