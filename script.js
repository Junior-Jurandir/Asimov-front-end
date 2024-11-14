// Constantes
const formularioMensagem = document.querySelector(".chatbot__form");
const inputMensagem = document.querySelector(".chatbot__enviar");
const containerHistoricoChat = document.querySelector(".chats");
const itensSugestoes = document.querySelectorAll(".sugestoes_item");
const botaoAlternarTema = document.getElementById("alterarDarkLight");
const botaoLimparChat = document.getElementById("apagarbotao");

// Estados das variáveis
let mensagemUsuarioAtual = null;
let gerandoResposta = false;

// const que armazena o valor da chave da API
const chaveApi = "VZNTG1N-X3B4VNB-ND2N2GQ-BPG9460";

// Função para chamar a API do LLM Studio
async function chamarLLMStudio(pergunta) {
    try {
        console.log("Pergunta para LLM Studio:", pergunta); // Log para depuração
        const response = await fetch("http://localhost:3001/api/v1/workspace/tcc-87598254/chat", {
            method: "POST",
            headers: {
                accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${chaveApi}`,
            },
            body: JSON.stringify({
                mode: "chat", // Modo de chat
                message: pergunta, // A pergunta enviada pelo usuário
                max_tokens: 150, // Limita a quantidade de tokens na resposta
            }),
        });

        // Verifica possíveis erros
        if (!resposta.ok) {
            throw new Error(`Erro: ${resposta.status} - ${resposta.statusText}`);
        }

        const dados = await resposta.json();
        console.log("Resposta da API:", dados); // Log para depuração

        if (dados.choices && dados.choices.length > 0) {
            return dados.choices[0].message.content; // Retorna o conteúdo da resposta
        } else {
            throw new Error("Resposta da API não contém dados válidos.");
        }
    } catch (erro) {
        console.error("Erro ao acessar a API:", erro); // Log do erro
        return "Desculpe, ocorreu um erro ao processar sua solicitação."; // Mensagem de erro 
    }
}

const exibirEfeitoDigitacao = (textoBruto, elementoMensagem, elementoMensagemRecebida, pularEfeito = false) => {
    const elementoIconeCopiar = elementoMensagemRecebida.querySelector(".message__icon");
    elementoIconeCopiar.classList.add("hide");

    if (pularEfeito) {
        elementoMensagem.innerHTML = textoBruto;
        gerandoResposta = false;
        elementoIconeCopiar.classList.remove("hide");
        return;
    }

    const palavrasArray = textoBruto.split(" ");
    let indicePalavra = 0;

    const intervaloDigitacao = setInterval(() => {
        elementoMensagem.innerText += (indicePalavra === 0 ? "" : " ") + palavrasArray[indicePalavra++];
        if (indicePalavra === palavrasArray.length) {
            clearInterval(intervaloDigitacao);
            gerandoResposta = false;
            elementoMensagem.innerHTML = textoBruto;
            elementoIconeCopiar.classList.remove("hide");
        }
    }, 75);
};

// Criar um novo elemento de mensagem
const criarElementoMensagem = (conteudoHtml, ...classesCss) => {
    const elementoMensagem = document.createElement("div");
    elementoMensagem.classList.add("message", ...classesCss);
    elementoMensagem.innerHTML = conteudoHtml;
    return elementoMensagem;
};

// Exibir a animação de "carregando" enquanto espera pela resposta da IA
const exibirAnimacaoCarregando = () => {
    const htmlCarregando = `
    <div class="message__content">
      <p class="message__text"></p>
      <div class="message__loading-indicator">
        <div class="message__loading-bar"></div>
        <div class="message__loading-bar"></div>
        <div class="message__loading-bar"></div>
      </div>
    </div>
    <span onClick="copiarMensagemParaAreaTransferencia(this)" class="message__icon hide"><i class='bx bx-copy-alt'></i></span>
  `;
    const elementoMensagemCarregando = criarElementoMensagem(htmlCarregando, "message--incoming", "message--loading");
    containerHistoricoChat.appendChild(elementoMensagemCarregando);

    // Chama a função que envia a pergunta para a API
    solicitarRespostaApi(elementoMensagemCarregando);
};

// Função que envia a pergunta para a API e lida com a resposta
const solicitarRespostaApi = async (elementoMensagemCarregando) => {
    const elementoTextoMensagem = elementoMensagemCarregando.querySelector(".message__text");

    try {
        // Envia a pergunta para o LLM Studio
        const resposta = await chamarLLMStudio(mensagemUsuarioAtual);

        // Exibe a resposta com o efeito de digitação
        exibirEfeitoDigitacao(resposta, elementoTextoMensagem, elementoMensagemCarregando);

    } catch (erro) {
        gerandoResposta = false;
        elementoTextoMensagem.innerText = erro.message;
        elementoTextoMensagem.closest(".message").classList.add("message--error");
    } finally {
        elementoMensagemCarregando.classList.remove("message--loading");
    }
};

// Função para copiar a mensagem para a área de transferência
const copiarMensagemParaAreaTransferencia = (botaoCopiar) => {
    const conteudoMensagem = botaoCopiar.parentElement.querySelector(".message__text").innerText;
    navigator.clipboard.writeText(conteudoMensagem);
    botaoCopiar.innerHTML = "<i class='bx bx-check'></i>";
    setTimeout(() => botaoCopiar.innerHTML = "<i class='bx bx-copy-alt'></i>", 1000);
};

// Função para lidar com o envio da mensagem
const enviarMensagem = () => {
    mensagemUsuarioAtual = inputMensagem.value.trim() || mensagemUsuarioAtual;
    if (!mensagemUsuarioAtual || gerandoResposta) return;
    gerandoResposta = true;

    const htmlMensagemEnviada = `
    <div class="message__content">
      <p class="message__text">${mensagemUsuarioAtual}</p>
    </div>
  `;
    const elementoMensagemEnviada = criarElementoMensagem(htmlMensagemEnviada, "message--outgoing");
    containerHistoricoChat.appendChild(elementoMensagemEnviada);
    formularioMensagem.reset();
    document.body.classList.add("hide-header");

    setTimeout(exibirAnimacaoCarregando, 500);
};

// Função para alternar entre os temas claro e escuro
botaoAlternarTema.addEventListener('click', () => {
    const isModoClaro = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isModoClaro ? "light_mode" : "dark_mode");
    botaoAlternarTema.querySelector("i").className = isModoClaro ? "bx bx-moon" : "bx bx-sun";
});

// Função para limpar o histórico de chat
botaoLimparChat.addEventListener('click', () => {
    if (confirm("Tem certeza de que deseja excluir todo o histórico de chat?")) {
        // Limpa o histórico de mensagens da tela
        containerHistoricoChat.innerHTML = '';

        // Limpa o histórico do localStorage
        localStorage.removeItem("saved-api-chats");

        // Reseta o estado das variáveis
        mensagemUsuarioAtual = null;
        gerandoResposta = false;
    }
});

// Função para lidar com sugestões de mensagem
itensSugestoes.forEach(sugestao => {
    sugestao.addEventListener('click', () => {
        mensagemUsuarioAtual = sugestao.querySelector(".texto_sugestoes").innerText;
        enviarMensagem();
    });
});

// Função para evitar o envio do formulário padrão
formularioMensagem.addEventListener('submit', (e) => {
    e.preventDefault();  // Impede o envio padrão do formulário (que recarregaria a página)
    enviarMensagem();    // Envia a mensagem
});

// Função para carregar o histórico de conversa (sem salvar no localStorage)
const carregarHistoricoChat = () => {
    containerHistoricoChat.innerHTML = ''; // Limpa o histórico de chat
    // A partir de agora, você pode adicionar novas mensagens manualmente, sem salvar.
};

carregarHistoricoChat();  
