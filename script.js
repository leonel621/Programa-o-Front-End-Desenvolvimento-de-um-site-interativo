/* =============================================
   FUNCIONALIDADE 1 - ALTERNAR TEMA CLARO/ESCURO
 
   O document.getElementById busca um elemento HTML pelo id dele e guarda na variável.
   O addEventListener fica "escutando" o botão esperando um clique,
   quando o clique acontece ele chama a função alternarTema.
   ============================================= */
 
let btnTema = document.getElementById("btn-tema");
 
btnTema.addEventListener("click", function () {
  alternarTema();
});
 
/* O classList.toggle adiciona a classe "tema-claro" no body se ela não existir,
   ou remove se ela já estiver lá, funcionando como um interruptor de liga/desliga.
   O CSS usa essa classe pra trocar todas as variáveis de cor de uma vez.
   Depois verificamos qual tema está ativo com o classList.contains pra trocar o texto do botão. */
function alternarTema() {
  document.body.classList.toggle("tema-claro");
 
  if (document.body.classList.contains("tema-claro")) {
    btnTema.textContent = "Tema Escuro";
  } else {
    btnTema.textContent = "Tema Claro";
  }
}
 
/* =============================================
   FUNCIONALIDADE 2 - VALIDAÇÃO DO FORMULÁRIO
 
   Pegamos os três elementos envolvidos no formulário:
   o form em si, o input onde o usuário digita e o span que exibe erros.
   ============================================= */
 
let formApelido = document.getElementById("form-apelido");
let inputApelido = document.getElementById("input-apelido");
let erroApelido = document.getElementById("erro-apelido");
 
/* O evento "submit" dispara quando o usuário clica em Registrar ou aperta Enter.
   O evento.preventDefault() impede o comportamento padrão do form que seria
   recarregar a página inteira ao enviar — assim ficamos no controle. */
formApelido.addEventListener("submit", function (evento) {
  evento.preventDefault();
  validarFormulario();
});
 
/* O .trim() remove os espaços em branco das pontas do que foi digitado,
   assim um apelido de só espaços não passa na validação.
   O return para a função imediatamente quando encontra um erro,
   sem continuar executando o restante do código. */
function validarFormulario() {
  let apelido = inputApelido.value.trim();
 
  if (apelido === "") {
    erroApelido.textContent = "Por favor, digite um apelido.";
    return;
  }
 
  if (apelido.length < 3) {
    erroApelido.textContent = "O apelido precisa ter pelo menos 3 caracteres.";
    return;
  }
 
  /* se passou pelas duas verificações acima, o apelido é válido:
     limpamos a mensagem de erro, adicionamos na lista e limpamos o campo */
  erroApelido.textContent = "";
  adicionarJogador(apelido);
  inputApelido.value = "";
}
 
/* =============================================
   FUNCIONALIDADE 3 - MANIPULAÇÃO DO DOM
   (adicionar e remover jogadores da lista)
 
   O DOM é a representação do HTML na memória do navegador.
   "Manipular o DOM" significa criar, modificar ou remover elementos
   da página usando JavaScript, sem precisar recarregar.
   ============================================= */
 
let listaJogadores = document.getElementById("lista-jogadores");
 
/* O querySelector busca o primeiro elemento com a classe passada dentro da lista.
   Se ainda existir o aviso "Nenhum jogador...", removemos ele antes de adicionar o primeiro jogador.
   O createElement cria um novo elemento HTML e o appendChild o coloca dentro da lista. */
function adicionarJogador(nomeJogador) {
  let itemVazio = listaJogadores.querySelector(".lista-vazia");
  if (itemVazio !== null) {
    listaJogadores.removeChild(itemVazio);
  }
 
  let novoItem = document.createElement("li");
  novoItem.textContent = nomeJogador;
 
  /* criamos o botão de remover dinamicamente pelo JavaScript,
     o setAttribute coloca o aria-label nele pra acessibilidade */
  let btnRemover = document.createElement("button");
  btnRemover.textContent = "Remover";
  btnRemover.classList.add("btn-remover");
  btnRemover.setAttribute("aria-label", "Remover jogador " + nomeJogador);
 
  btnRemover.addEventListener("click", function () {
    removerJogador(novoItem);
  });
 
  /* appendChild coloca o botão dentro do <li> e depois o <li> dentro da <ul> */
  novoItem.appendChild(btnRemover);
  listaJogadores.appendChild(novoItem);
}
 
/* Remove o item da lista e verifica se a lista ficou vazia.
   O .children.length conta quantos filhos a lista tem no momento,
   se for 0 recolocamos o aviso de lista vazia. */
function removerJogador(item) {
  listaJogadores.removeChild(item);
 
  if (listaJogadores.children.length === 0) {
    let itemVazio = document.createElement("li");
    itemVazio.textContent = "Nenhum jogador registrado ainda.";
    itemVazio.classList.add("lista-vazia");
    listaJogadores.appendChild(itemVazio);
  }
}
 
/* =============================================
   FUNCIONALIDADE 4 - REQUISIÇÃO À API (fetch)
 
   O fetch é a forma do JavaScript fazer uma requisição HTTP,
   ou seja, pedir dados pra um servidor externo pela internet.
   Ele retorna uma Promise — uma "promessa" de que os dados vão chegar.
   O .then() define o que fazer quando a promessa for cumprida (deu certo)
   e o .catch() define o que fazer se ela falhar (sem internet, API fora do ar, etc).
 
   O corsproxy.io é um intermediário necessário quando abrimos o HTML direto como arquivo local,
   pois o navegador bloqueia chamadas diretas a APIs externas nesse caso por segurança (política CORS).
   ============================================= */
 
let btnBuscarJogos = document.getElementById("btn-buscar-jogos");
let jogosGrid = document.getElementById("jogos-grid");
let jogosStatus = document.getElementById("jogos-status");
 
btnBuscarJogos.addEventListener("click", function () {
  buscarJogos();
});
 
function buscarJogos() {
  /* desativamos o botão pra evitar que o usuário clique várias vezes seguidas
     enquanto a API ainda está respondendo */
  btnBuscarJogos.disabled = true;
  jogosStatus.textContent = "Buscando jogos...";
  jogosGrid.innerHTML = "";
 
  fetch("https://corsproxy.io/?https://www.freetogame.com/api/games?category=shooter&sort-by=relevance")
    .then(function (resposta) {
      /* a resposta chega como texto puro, o .json() converte pra um objeto JavaScript
         que conseguimos usar normalmente com ponto e colchetes */
      return resposta.json();
    })
    .then(function (jogos) {
      jogosStatus.textContent = "";
 
      /* a API retorna uma lista enorme de jogos, o .slice(0, 6) pega só os 6 primeiros */
      let primeiros6 = jogos.slice(0, 6);
 
      /* o forEach percorre cada jogo da lista e executa a função pra cada um,
         criando um card e adicionando no grid */
      primeiros6.forEach(function (jogo) {
        let card = criarCardJogo(jogo);
        jogosGrid.appendChild(card);
      });
 
      btnBuscarJogos.disabled = false;
    })
    .catch(function (erro) {
      /* se qualquer coisa der errado (sem internet, API fora do ar, proxy com problema)
         exibe a mensagem de erro pro usuário e reativa o botão */
      jogosStatus.textContent = "Não foi possível buscar os jogos. Tente novamente.";
      console.log("Erro na requisição:", erro);
      btnBuscarJogos.disabled = false;
    });
}
 
/* Recebe os dados de um jogo vindo da API e monta o HTML do card com eles.
   O jogo.thumbnail, jogo.title etc são as propriedades que a API retorna pra cada jogo.
   O target="_blank" no link faz ele abrir em uma nova aba do navegador. */
function criarCardJogo(jogo) {
  let card = document.createElement("div");
  card.classList.add("jogo-card");
 
  card.innerHTML =
    '<img src="' + jogo.thumbnail + '" alt="Imagem do jogo ' + jogo.title + '" />' +
    '<div class="jogo-card__info">' +
      '<p class="jogo-card__titulo">' + jogo.title + '</p>' +
      '<p class="jogo-card__genero">' + jogo.genre + '</p>' +
      '<a href="' + jogo.game_url + '" target="_blank" class="jogo-card__link">Ver jogo →</a>' +
    '</div>';
 
  return card;
}
 