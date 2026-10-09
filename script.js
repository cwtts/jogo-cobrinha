// Aluno(a): COLOQUE SEU NOME AQUI
// Jogo da Cobrinha - Atividade Invertida (HTML + CSS + JavaScript)

// ---------- 1. ELEMENTOS DA PÁGINA ----------
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const btnIniciar = document.getElementById("btn-iniciar");
const btnLimpar = document.getElementById("btn-limpar");
const campoNome = document.getElementById("nome");
const textoPontos = document.getElementById("pontos");
const textoRecorde = document.getElementById("recorde");
const mensagem = document.getElementById("mensagem");
const listaRanking = document.getElementById("lista-ranking");

// ---------- 2. VARIÁVEIS DO JOGO ----------
const TAMANHO = 20;                        // cada quadradinho tem 20px
const COLUNAS = canvas.width / TAMANHO;    // 400 / 20 = 20 quadradinhos
const VELOCIDADE_INICIAL = 150;            // milissegundos entre cada movimento
const VELOCIDADE_MINIMA = 70;              // limite para não ficar impossível
const CHAVE_RANKING = "ranking-cobrinha";  // nome usado para guardar no navegador

let cobra = [];            // lista de partes: [{x, y}, {x, y}, ...] (a [0] é a cabeça)
let direcao = "direita";   // direção atual
let proximaDirecao = "direita"; // direção pedida pelo jogador (evita virar 180° de uma vez)
let comida = { x: 0, y: 0 };
let pontos = 0;
let velocidade = VELOCIDADE_INICIAL;
let temporizador = null;   // guarda o setInterval para podermos parar
let jogando = false;

// Imagem da comida: coloque o arquivo na mesma pasta e troque o nome aqui
const ARQUIVO_IMAGEM_COMIDA = "comida.png";
const imagemComida = new Image();
imagemComida.src = ARQUIVO_IMAGEM_COMIDA;
imagemComida.onload = desenhar; // redesenha quando a imagem terminar de carregar

// ---------- 3. INICIAR / REINICIAR ----------
function iniciarJogo() {
  cobra = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 }
  ];
  direcao = "direita";
  proximaDirecao = "direita";
  pontos = 0;
  velocidade = VELOCIDADE_INICIAL;
  jogando = true;

  textoPontos.textContent = pontos;
  mensagem.classList.add("escondida");
  btnIniciar.textContent = "Reiniciar";

  sortearComida();
  desenhar();

  clearInterval(temporizador);
  temporizador = setInterval(atualizar, velocidade);
}

// ---------- 4. LÓGICA PRINCIPAL (roda a cada "tick") ----------
function atualizar() {
  direcao = proximaDirecao;

  // Calcula onde a cabeça vai ficar
  const cabeca = { x: cobra[0].x, y: cobra[0].y };
  if (direcao === "cima") cabeca.y--;
  if (direcao === "baixo") cabeca.y++;
  if (direcao === "esquerda") cabeca.x--;
  if (direcao === "direita") cabeca.x++;

  // Atravessar a parede: ao sair por um lado, a cobra reaparece no lado oposto
  if (cabeca.x < 0) cabeca.x = COLUNAS - 1;
  if (cabeca.x >= COLUNAS) cabeca.x = 0;
  if (cabeca.y < 0) cabeca.y = COLUNAS - 1;
  if (cabeca.y >= COLUNAS) cabeca.y = 0;

  // Condição de derrota: só o próprio corpo (a parede não mata mais)
  if (bateuNoCorpo(cabeca)) {
    fimDeJogo();
    return;
  }

  // Adiciona a nova cabeça no início da lista
  cobra.unshift(cabeca);

  // Condição de ponto: a cabeça está em cima da comida?
  if (cabeca.x === comida.x && cabeca.y === comida.y) {
    pontos += 10;
    textoPontos.textContent = pontos;
    sortearComida();
    aumentarVelocidade();
  } else {
    cobra.pop(); // não comeu: remove o rabo (a cobra "anda" sem crescer)
  }

  desenhar();
}

function bateuNoCorpo(cabeca) {
  return cobra.some(parte => parte.x === cabeca.x && parte.y === cabeca.y);
}

function sortearComida() {
  // Sorteia posições até achar uma que não esteja em cima da cobra
  do {
    comida.x = Math.floor(Math.random() * COLUNAS);
    comida.y = Math.floor(Math.random() * COLUNAS);
  } while (cobra.some(parte => parte.x === comida.x && parte.y === comida.y));
}

function aumentarVelocidade() {
  if (velocidade > VELOCIDADE_MINIMA) {
    velocidade -= 5;
    clearInterval(temporizador);
    temporizador = setInterval(atualizar, velocidade);
  }
}

// ---------- 5. DESENHO NA TELA ----------
function desenhar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // comida: usa a imagem se ela carregou; senão desenha um círculo vermelho
  if (imagemComida.complete && imagemComida.naturalWidth > 0) {
    ctx.drawImage(imagemComida, comida.x * TAMANHO, comida.y * TAMANHO, TAMANHO, TAMANHO);
  } else {
    ctx.fillStyle = "#ff5a4d";
    ctx.beginPath();
    ctx.arc(comida.x * TAMANHO + TAMANHO / 2, comida.y * TAMANHO + TAMANHO / 2, TAMANHO / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // cobra (a cabeça tem cor diferente)
  cobra.forEach((parte, indice) => {
    ctx.fillStyle = indice === 0 ? "#f5d547" : "#8fe388";
    ctx.fillRect(parte.x * TAMANHO + 1, parte.y * TAMANHO + 1, TAMANHO - 2, TAMANHO - 2);
  });
}

// ---------- 6. FIM DE JOGO ----------
function fimDeJogo() {
  clearInterval(temporizador);
  jogando = false;

  const nome = campoNome.value.trim() || "Anônimo";
  salvarNoRanking(nome, pontos);
  mostrarRanking();

  mensagem.textContent = "Fim de jogo!\n" + nome + ", você fez " + pontos + " pontos.\nClique em Reiniciar.";
  mensagem.classList.remove("escondida");
}

// ---------- 7. RANKING (guardado no navegador com localStorage) ----------
function lerRanking() {
  const texto = localStorage.getItem(CHAVE_RANKING);
  return texto ? JSON.parse(texto) : [];
}

function salvarNoRanking(nome, pontuacao) {
  if (pontuacao === 0) return; // não registra quem não fez ponto

  const ranking = lerRanking();
  ranking.push({ nome: nome, pontos: pontuacao });
  ranking.sort((a, b) => b.pontos - a.pontos); // maior pontuação primeiro
  const top5 = ranking.slice(0, 5);            // guarda só os 5 melhores
  localStorage.setItem(CHAVE_RANKING, JSON.stringify(top5));
}

function mostrarRanking() {
  const ranking = lerRanking();
  listaRanking.innerHTML = "";

  if (ranking.length === 0) {
    listaRanking.innerHTML = '<li class="vazio">Ninguém pontuou ainda.</li>';
    textoRecorde.textContent = 0;
    return;
  }

  ranking.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item.nome;
    const span = document.createElement("span");
    span.textContent = item.pontos;
    li.appendChild(span);
    listaRanking.appendChild(li);
  });

  textoRecorde.textContent = ranking[0].pontos;
}

// ---------- 8. EVENTOS ----------
function mudarDirecao(nova) {
  // Não deixa virar para o sentido contrário (a cobra bateria nela mesma)
  if (nova === "cima" && direcao !== "baixo") proximaDirecao = "cima";
  if (nova === "baixo" && direcao !== "cima") proximaDirecao = "baixo";
  if (nova === "esquerda" && direcao !== "direita") proximaDirecao = "esquerda";
  if (nova === "direita" && direcao !== "esquerda") proximaDirecao = "direita";
}

// Evento de teclado
document.addEventListener("keydown", evento => {
  const teclas = {
    ArrowUp: "cima", w: "cima", W: "cima",
    ArrowDown: "baixo", s: "baixo", S: "baixo",
    ArrowLeft: "esquerda", a: "esquerda", A: "esquerda",
    ArrowRight: "direita", d: "direita", D: "direita"
  };

  const nova = teclas[evento.key];
  if (nova && jogando) {
    evento.preventDefault(); // impede a página de rolar com as setas
    mudarDirecao(nova);
  }
});

// Eventos de clique nos botões do celular
document.querySelectorAll(".direcionais button").forEach(botao => {
  botao.addEventListener("click", () => {
    if (jogando) mudarDirecao(botao.dataset.dir);
  });
});

btnIniciar.addEventListener("click", iniciarJogo);

btnLimpar.addEventListener("click", () => {
  localStorage.removeItem(CHAVE_RANKING);
  mostrarRanking();
});

// ---------- 9. AO ABRIR A PÁGINA ----------
mostrarRanking();
desenhar();
