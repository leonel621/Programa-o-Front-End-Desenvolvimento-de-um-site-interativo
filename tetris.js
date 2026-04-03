/**
 * tetris.js
 * Lógica completa do Tetris integrada ao Portal.
 * Todas as variáveis e funções estão em português,
 * com comentários explicativos para cada parte.
 */

'use strict';

/* =====================================================================
   CONSTANTES DO JOGO
   Valores fixos que definem tamanho do tabuleiro e comportamento base.
   ===================================================================== */
const QTDE_COLUNAS        = 10;
const QTDE_LINHAS         = 20;
const PIXELS_BLOCO        = 30;   // px por célula no canvas principal
const PIXELS_BLOCO_PREVIA = 24;   // px por célula na prévia da próxima peça
const INTERVALO_INICIAL   = 800;  // ms entre cada queda no nível 1
const PONTOS_POR_LINHAS   = [0, 100, 300, 500, 800]; // pontos por 0-4 linhas limpas
const NOME_CHAVE_RECORDE  = 'tetris_highscore';       // chave no localStorage

/* =====================================================================
   CORES DE CADA TIPO DE PEÇA
   ===================================================================== */
const MAPA_CORES = {
  I: '#00ffe0',
  O: '#ffe000',
  T: '#cc00ff',
  S: '#00ff6a',
  Z: '#ff2255',
  J: '#0066ff',
  L: '#ff8800',
};

/* =====================================================================
   FORMATOS DAS PEÇAS (matrizes 2D)
   1 = bloco visível | 0 = espaço vazio
   ===================================================================== */
const MAPA_FORMATOS = {
  I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1],[0,0,0]],
  S: [[0,1,1],[1,1,0],[0,0,0]],
  Z: [[1,1,0],[0,1,1],[0,0,0]],
  J: [[1,0,0],[1,1,1],[0,0,0]],
  L: [[0,0,1],[1,1,1],[0,0,0]],
};

// Array com os nomes de cada tipo, usado para sortear aleatoriamente
const LISTA_TIPOS_PECA = Object.keys(MAPA_FORMATOS);

/* =====================================================================
   REFERÊNCIAS AOS ELEMENTOS DO DOM
   Capturamos uma vez só para não repetir getElementById durante o jogo.
   ===================================================================== */
const elementoCanvas    = document.getElementById('tetris-board');
const contextoDesenho   = elementoCanvas.getContext('2d');

const elementoCanvasPrevia  = document.getElementById('next-canvas');
const contextoDesenhoPrevia = elementoCanvasPrevia.getContext('2d');

const elementoPontuacao = document.getElementById('score');
const elementoNivel     = document.getElementById('level');
const elementoLinhas    = document.getElementById('lines');
const elementoRecorde   = document.getElementById('highscore');

// Overlay interno do Tetris (início / pause / game over)
const painelTetris    = document.getElementById('tetris-overlay');
const tituloPainel    = document.getElementById('tetris-overlay-title');
const subtituloPainel = document.getElementById('tetris-overlay-eyebrow');
const dicasPainel     = document.getElementById('tetris-overlay-hint');
const botaoAcaoPainel = document.getElementById('btn-start');

// Botões de controle mobile
const botaoMoverEsquerda = document.getElementById('btn-left');
const botaoMoverDireita  = document.getElementById('btn-right');
const botaoAcelerarQueda = document.getElementById('btn-down');
const botaoGirarPeca     = document.getElementById('btn-rotate');
const botaoPausarJogo    = document.getElementById('btn-pause');

/* =====================================================================
   VARIÁVEIS DE ESTADO DO JOGO
   Mudam constantemente durante a partida.
   ===================================================================== */
let grade            = [];    // tabuleiro 20x10: cor ou null em cada célula
let pecaAtual        = null;  // peça caindo: { tipo, matriz, x, y, cor }
let proximaPeca      = null;  // peça que entra a seguir
let pontuacao        = 0;
let nivelAtual       = 1;
let linhasEliminadas = 0;
let recordeSalvo     = 0;
let jogoAtivo        = false;
let jogoEmPausa      = false;
const idAnimacao     = { valor: null }; // id do requestAnimationFrame
let marcadorTempo    = 0;
let velocidadeQueda  = INTERVALO_INICIAL;
let quedaAcelerada   = false;

/* =====================================================================
   INICIALIZAÇÃO
   ===================================================================== */

/**
 * Carrega o recorde salvo no localStorage e exibe no HUD.
 */
function carregarRecorde() {
  const valorSalvo = localStorage.getItem(NOME_CHAVE_RECORDE);
  recordeSalvo = valorSalvo ? parseInt(valorSalvo, 10) : 0;
  elementoRecorde.textContent = recordeSalvo;
}

/**
 * Cria o tabuleiro totalmente vazio (todas as células = null).
 */
function criarGrade() {
  grade = Array.from({ length: QTDE_LINHAS }, () => Array(QTDE_COLUNAS).fill(null));
}

/**
 * Gera um objeto representando uma nova peça.
 * Se nenhum tipo for passado, sorteia um aleatoriamente.
 * Faz cópia profunda da matriz para não alterar o template original ao rotacionar.
 */
function criarNovaPeca(tipoPeca) {
  if (!tipoPeca) {
    tipoPeca = LISTA_TIPOS_PECA[Math.floor(Math.random() * LISTA_TIPOS_PECA.length)];
  }
  const matrizDaPeca = MAPA_FORMATOS[tipoPeca].map(linha => [...linha]);
  return {
    tipo:   tipoPeca,
    matriz: matrizDaPeca,
    cor:    MAPA_CORES[tipoPeca],
    // centraliza horizontalmente no topo
    x: Math.floor(QTDE_COLUNAS / 2) - Math.floor(matrizDaPeca[0].length / 2),
    y: 0,
  };
}

/**
 * Inicia (ou reinicia) a partida:
 * zera contadores, esconde overlay e dispara o loop de animação.
 */
function iniciarPartida() {
  criarGrade();
  pontuacao        = 0;
  nivelAtual       = 1;
  linhasEliminadas = 0;
  velocidadeQueda  = INTERVALO_INICIAL;
  quedaAcelerada   = false;

  atualizarPlacar();
  esconderPainel();

  proximaPeca = criarNovaPeca();
  colocarNovaPecaEmJogo();

  jogoAtivo    = true;
  jogoEmPausa  = false;
  marcadorTempo = performance.now();

  cancelAnimationFrame(idAnimacao.valor);
  idAnimacao.valor = requestAnimationFrame(loopPrincipal);
}

/* =====================================================================
   LOOP PRINCIPAL
   requestAnimationFrame chama ~60x por segundo.
   Controla a queda automática e redesenha o canvas.
   ===================================================================== */
function loopPrincipal(timestamp) {
  if (!jogoAtivo) return;

  if (!jogoEmPausa) {
    const tempoDecorrido = timestamp - marcadorTempo;
    const intervaloUsado = quedaAcelerada ? 50 : velocidadeQueda;

    if (tempoDecorrido >= intervaloUsado) {
      marcadorTempo = timestamp;
      descerPecaUmaLinha();
    }
    desenharTudo();
  }

  idAnimacao.valor = requestAnimationFrame(loopPrincipal);
}

/* =====================================================================
   LÓGICA DAS PEÇAS
   ===================================================================== */

/**
 * Coloca a próxima peça em jogo e sorteia a seguinte.
 * Detecta game over se a peça nova já nasce colidindo.
 */
function colocarNovaPecaEmJogo() {
  pecaAtual   = proximaPeca;
  proximaPeca = criarNovaPeca();
  desenharPecaDePrevia();

  if (verificarColisao(pecaAtual.matriz, pecaAtual.x, pecaAtual.y)) {
    ativarGameOver();
  }
}

/**
 * Tenta mover a peça nas direções indicadas.
 * Retorna true se conseguiu mover, false se havia obstáculo.
 */
function moverPeca(deslocamentoX, deslocamentoY) {
  const novaPosX = pecaAtual.x + deslocamentoX;
  const novaPosY = pecaAtual.y + deslocamentoY;
  if (!verificarColisao(pecaAtual.matriz, novaPosX, novaPosY)) {
    pecaAtual.x = novaPosX;
    pecaAtual.y = novaPosY;
    return true;
  }
  return false;
}

/**
 * Desce a peça uma linha. Se não puder, fixa e coloca a próxima.
 */
function descerPecaUmaLinha() {
  if (!moverPeca(0, 1)) {
    fixarPecaNoTabuleiro();
    eliminarLinhasCompletas();
    colocarNovaPecaEmJogo();
  }
}

/**
 * Rotaciona a peça 90° com wall kicks para não prender na borda.
 */
function girarPecaAtual() {
  const matrizRotacionada = rotacionar90graus(pecaAtual.matriz);
  for (const deslocamentoKick of [0, -1, 1, -2, 2]) {
    if (!verificarColisao(matrizRotacionada, pecaAtual.x + deslocamentoKick, pecaAtual.y)) {
      pecaAtual.matriz = matrizRotacionada;
      pecaAtual.x += deslocamentoKick;
      return;
    }
  }
}

/**
 * Rotaciona uma matriz 2D 90° no sentido horário.
 * Fórmula: novaMatriz[col][totalLinhas-1-lin] = original[lin][col]
 */
function rotacionar90graus(matrizOriginal) {
  const qtdeLinhas  = matrizOriginal.length;
  const qtdeColunas = matrizOriginal[0].length;
  const matrizResultado = Array.from({ length: qtdeColunas }, () => Array(qtdeLinhas).fill(0));
  for (let lin = 0; lin < qtdeLinhas; lin++) {
    for (let col = 0; col < qtdeColunas; col++) {
      matrizResultado[col][qtdeLinhas - 1 - lin] = matrizOriginal[lin][col];
    }
  }
  return matrizResultado;
}

/**
 * Verifica colisão de uma matriz em (posX, posY).
 * Retorna true se há colisão com borda ou bloco fixado.
 */
function verificarColisao(matrizVerificar, posX, posY) {
  for (let lin = 0; lin < matrizVerificar.length; lin++) {
    for (let col = 0; col < matrizVerificar[lin].length; col++) {
      if (!matrizVerificar[lin][col]) continue;
      const celulaX = posX + col;
      const celulaY = posY + lin;
      if (celulaX < 0 || celulaX >= QTDE_COLUNAS || celulaY >= QTDE_LINHAS) return true;
      if (celulaY >= 0 && grade[celulaY][celulaX]) return true;
    }
  }
  return false;
}

/**
 * Fixa a peça atual na grade (ela vira parte do cenário permanente).
 */
function fixarPecaNoTabuleiro() {
  for (let lin = 0; lin < pecaAtual.matriz.length; lin++) {
    for (let col = 0; col < pecaAtual.matriz[lin].length; col++) {
      if (!pecaAtual.matriz[lin][col]) continue;
      const linhaGrade  = pecaAtual.y + lin;
      const colunaGrade = pecaAtual.x + col;
      if (linhaGrade >= 0) grade[linhaGrade][colunaGrade] = pecaAtual.cor;
    }
  }
}

/* =====================================================================
   LIMPEZA DE LINHAS
   ===================================================================== */

/**
 * Percorre o tabuleiro de baixo pra cima.
 * Quando uma linha está completamente preenchida, a remove
 * e adiciona uma nova vazia no topo.
 * Depois atualiza pontuação, nível e efeito visual.
 */
function eliminarLinhasCompletas() {
  let quantidadeEliminadas = 0;

  for (let lin = QTDE_LINHAS - 1; lin >= 0; lin--) {
    // .every() retorna true se todas as células têm cor (≠ null)
    if (grade[lin].every(celula => celula !== null)) {
      grade.splice(lin, 1);                          // remove a linha cheia
      grade.unshift(Array(QTDE_COLUNAS).fill(null)); // adiciona vazia no topo
      quantidadeEliminadas++;
      lin++; // reavalia o mesmo índice (que agora aponta para a linha de cima)
    }
  }

  if (quantidadeEliminadas > 0) {
    pontuacao        += PONTOS_POR_LINHAS[quantidadeEliminadas] * nivelAtual;
    linhasEliminadas += quantidadeEliminadas;
    nivelAtual        = Math.floor(linhasEliminadas / 10) + 1;
    velocidadeQueda   = Math.max(100, INTERVALO_INICIAL - (nivelAtual - 1) * 70);

    atualizarPlacar();

    // Efeito visual: classe CSS dispara animação de flash no canvas
    elementoCanvas.classList.add('line-clear-flash');
    elementoCanvas.addEventListener('animationend', () => {
      elementoCanvas.classList.remove('line-clear-flash');
    }, { once: true });

    // Salva recorde se ultrapassar o anterior
    if (pontuacao > recordeSalvo) {
      recordeSalvo = pontuacao;
      localStorage.setItem(NOME_CHAVE_RECORDE, recordeSalvo);
      elementoRecorde.textContent = recordeSalvo;
    }
  }
}

/* =====================================================================
   RENDERIZAÇÃO
   ===================================================================== */

/**
 * Apaga e redesenha o canvas inteiro a cada frame.
 */
function desenharTudo() {
  contextoDesenho.clearRect(0, 0, elementoCanvas.width, elementoCanvas.height);
  desenharBlocosFixados();
  desenharPecaFantasma();
  desenharPeca(contextoDesenho, pecaAtual.matriz, pecaAtual.x, pecaAtual.y, pecaAtual.cor, PIXELS_BLOCO);
  desenharLinhasDeGrade();
}

/**
 * Desenha as células já fixadas no tabuleiro.
 */
function desenharBlocosFixados() {
  for (let lin = 0; lin < QTDE_LINHAS; lin++) {
    for (let col = 0; col < QTDE_COLUNAS; col++) {
      if (grade[lin][col]) {
        desenharBloco(contextoDesenho, col, lin, grade[lin][col], PIXELS_BLOCO);
      }
    }
  }
}

/**
 * Desenha linhas de grade sutis sobre o canvas.
 */
function desenharLinhasDeGrade() {
  contextoDesenho.strokeStyle = 'rgba(255,255,255,0.03)';
  contextoDesenho.lineWidth   = 0.5;
  for (let col = 0; col <= QTDE_COLUNAS; col++) {
    contextoDesenho.beginPath();
    contextoDesenho.moveTo(col * PIXELS_BLOCO, 0);
    contextoDesenho.lineTo(col * PIXELS_BLOCO, QTDE_LINHAS * PIXELS_BLOCO);
    contextoDesenho.stroke();
  }
  for (let lin = 0; lin <= QTDE_LINHAS; lin++) {
    contextoDesenho.beginPath();
    contextoDesenho.moveTo(0, lin * PIXELS_BLOCO);
    contextoDesenho.lineTo(QTDE_COLUNAS * PIXELS_BLOCO, lin * PIXELS_BLOCO);
    contextoDesenho.stroke();
  }
}

/**
 * Desenha a peça fantasma (sombra translúcida de onde a peça vai cair).
 */
function desenharPecaFantasma() {
  let posYFantasma = pecaAtual.y;
  while (!verificarColisao(pecaAtual.matriz, pecaAtual.x, posYFantasma + 1)) posYFantasma++;
  if (posYFantasma === pecaAtual.y) return;
  desenharPeca(contextoDesenho, pecaAtual.matriz, pecaAtual.x, posYFantasma, pecaAtual.cor, PIXELS_BLOCO, 0.2);
}

/**
 * Percorre a matriz e chama desenharBloco() para cada célula com valor 1.
 * transparencia = 1 → opaco | 0.2 → fantasma
 */
function desenharPeca(contexto, matrizPeca, posX, posY, cor, tamBloco, transparencia = 1) {
  for (let lin = 0; lin < matrizPeca.length; lin++) {
    for (let col = 0; col < matrizPeca[lin].length; col++) {
      if (matrizPeca[lin][col]) {
        desenharBloco(contexto, posX + col, posY + lin, cor, tamBloco, transparencia);
      }
    }
  }
}

/**
 * Desenha um único bloco com efeito 3D:
 * fundo colorido + brilho superior/esquerdo + sombra inferior/direito.
 */
function desenharBloco(contexto, coluna, linha, cor, tamBloco, transparencia = 1) {
  const pixelX = coluna * tamBloco;
  const pixelY = linha  * tamBloco;
  const tam    = tamBloco;

  contexto.save();
  contexto.globalAlpha = transparencia;

  // fundo colorido
  contexto.fillStyle = cor;
  contexto.fillRect(pixelX + 1, pixelY + 1, tam - 2, tam - 2);

  // brilho superior
  contexto.fillStyle = 'rgba(255,255,255,0.35)';
  contexto.fillRect(pixelX + 1, pixelY + 1, tam - 2, 3);

  // brilho esquerdo
  contexto.fillRect(pixelX + 1, pixelY + 1, 3, tam - 2);

  // sombra inferior
  contexto.fillStyle = 'rgba(0,0,0,0.4)';
  contexto.fillRect(pixelX + 1, pixelY + tam - 4, tam - 2, 3);

  // sombra direita
  contexto.fillRect(pixelX + tam - 4, pixelY + 1, 3, tam - 2);

  contexto.restore();
}

/**
 * Desenha a prévia da próxima peça no canvas lateral, centralizada.
 */
function desenharPecaDePrevia() {
  contextoDesenhoPrevia.clearRect(0, 0, elementoCanvasPrevia.width, elementoCanvasPrevia.height);
  if (!proximaPeca) return;
  const matrizPrevia = proximaPeca.matriz;
  const offsetColunas = Math.floor((elementoCanvasPrevia.width  / PIXELS_BLOCO_PREVIA - matrizPrevia[0].length) / 2);
  const offsetLinhas  = Math.floor((elementoCanvasPrevia.height / PIXELS_BLOCO_PREVIA - matrizPrevia.length)    / 2);
  desenharPeca(contextoDesenhoPrevia, matrizPrevia, offsetColunas, offsetLinhas, proximaPeca.cor, PIXELS_BLOCO_PREVIA);
}

/* =====================================================================
   PLACAR
   ===================================================================== */
function atualizarPlacar() {
  elementoPontuacao.textContent = pontuacao;
  elementoNivel.textContent     = nivelAtual;
  elementoLinhas.textContent    = linhasEliminadas;
}

/* =====================================================================
   PAINEL INTERNO DO TETRIS (overlay de início / pause / game over)
   ===================================================================== */
function exibirPainel(subtitulo, titulo, textoBotao, dica) {
  subtituloPainel.textContent = subtitulo;
  tituloPainel.textContent    = titulo;
  botaoAcaoPainel.textContent = textoBotao;
  dicasPainel.textContent     = dica;
  painelTetris.classList.remove('hidden');
}

function esconderPainel() {
  painelTetris.classList.add('hidden');
}

function ativarGameOver() {
  jogoAtivo = false;
  cancelAnimationFrame(idAnimacao.valor);
  desenharTudo();
  setTimeout(() => {
    exibirPainel('FIM DE JOGO', 'GAME OVER', 'JOGAR NOVAMENTE', `Pontuação final: ${pontuacao}`);
  }, 400);
}

function alternarPausa() {
  if (!jogoAtivo) return;
  jogoEmPausa = !jogoEmPausa;
  if (jogoEmPausa) {
    exibirPainel('PAUSADO', 'PAUSE', 'CONTINUAR', 'P para retomar');
  } else {
    esconderPainel();
    marcadorTempo = performance.now();
  }
}

/* =====================================================================
   CONTROLES DE TECLADO
   Só funciona se o modal do Tetris estiver visível.
   ===================================================================== */
document.addEventListener('keydown', (evento) => {
  // ignora se o modal do Tetris estiver fechado
  if (document.getElementById('modal-tetris').hasAttribute('hidden')) return;
  if (!jogoAtivo) return;

  switch (evento.code) {
    case 'ArrowLeft':
      evento.preventDefault();
      if (!jogoEmPausa) moverPeca(-1, 0);
      break;
    case 'ArrowRight':
      evento.preventDefault();
      if (!jogoEmPausa) moverPeca(1, 0);
      break;
    case 'ArrowDown':
      evento.preventDefault();
      if (!jogoEmPausa) quedaAcelerada = true;
      break;
    case 'ArrowUp':
      evento.preventDefault();
      if (!jogoEmPausa) girarPecaAtual();
      break;
    case 'KeyP':
      alternarPausa();
      break;
    case 'Space':
      evento.preventDefault();
      if (!jogoEmPausa) quedaInstantanea();
      break;
  }
});

document.addEventListener('keyup', (evento) => {
  if (evento.code === 'ArrowDown') quedaAcelerada = false;
});

/**
 * Hard drop: a peça cai direto até o fundo.
 */
function quedaInstantanea() {
  while (moverPeca(0, 1)) { /* desce até bater */ }
  fixarPecaNoTabuleiro();
  eliminarLinhasCompletas();
  colocarNovaPecaEmJogo();
}

/* =====================================================================
   CONTROLES MOBILE
   ===================================================================== */
function registrarControleMobile(botao, acaoDoControle) {
  botao.addEventListener('touchstart', (evento) => {
    evento.preventDefault();
    if (jogoAtivo && !jogoEmPausa) acaoDoControle();
  }, { passive: false });

  botao.addEventListener('click', () => {
    if (jogoAtivo && !jogoEmPausa) acaoDoControle();
  });
}

registrarControleMobile(botaoMoverEsquerda, () => moverPeca(-1, 0));
registrarControleMobile(botaoMoverDireita,  () => moverPeca(1, 0));
registrarControleMobile(botaoAcelerarQueda, () => {
  quedaAcelerada = true;
  setTimeout(() => { quedaAcelerada = false; }, 300);
});
registrarControleMobile(botaoGirarPeca, () => girarPecaAtual());

botaoPausarJogo.addEventListener('click', alternarPausa);
botaoPausarJogo.addEventListener('touchstart', (evento) => {
  evento.preventDefault();
  alternarPausa();
}, { passive: false });

botaoAcaoPainel.addEventListener('click', iniciarPartida);

/* =====================================================================
   SWIPE NO CANVAS (celular)
   ===================================================================== */
(function configurarSwipe() {
  let inicioToqueX = 0;
  let inicioToqueY = 0;
  const distanciaMinima = 30;

  elementoCanvas.addEventListener('touchstart', (evento) => {
    inicioToqueX = evento.touches[0].clientX;
    inicioToqueY = evento.touches[0].clientY;
  }, { passive: true });

  elementoCanvas.addEventListener('touchend', (evento) => {
    if (!jogoAtivo || jogoEmPausa) return;
    const deslocamentoX = evento.changedTouches[0].clientX - inicioToqueX;
    const deslocamentoY = evento.changedTouches[0].clientY - inicioToqueY;

    if (Math.abs(deslocamentoX) > Math.abs(deslocamentoY)) {
      if (Math.abs(deslocamentoX) > distanciaMinima) moverPeca(deslocamentoX > 0 ? 1 : -1, 0);
    } else {
      if (deslocamentoY >  distanciaMinima) quedaAcelerada = true;
      if (deslocamentoY < -distanciaMinima) girarPecaAtual();
    }
  }, { passive: true });

  elementoCanvas.addEventListener('touchmove', () => { quedaAcelerada = false; }, { passive: true });
})();

/* =====================================================================
   INICIALIZAÇÃO: carrega recorde e exibe tela de início do Tetris
   ===================================================================== */
carregarRecorde();
exibirPainel(
  'PRONTO?',
  'TETRIS',
  'INICIAR',
  '← → mover  |  ↑ girar  |  ↓ acelerar  |  P pausar  |  ESPAÇO drop'
);
