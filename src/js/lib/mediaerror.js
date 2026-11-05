// Turns a <video> error into a message that says what actually went wrong.
// MediaError codes: 1 aborted, 2 network, 3 decode, 4 source not supported. Code 4 is also what
// the TV reports when the server refuses the request (403, 404...), so for 4 we ask the server.
import { t } from './i18n.js';

const CODEC_HINT = 'Tente outra fonte (de preferência MP4/MKV com H.264 ou HEVC e áudio AAC/AC3).';

// HEAD request: status and content type, without downloading the file. Status 0 means the
// server did not answer or blocked the check (CORS), so we do not know.
function probe(url, timeoutMs) {
  return new Promise((resolve) => {
    if (!/^https?:\/\//.test(url)) return resolve({ status: 0, type: '' });
    let done = false;
    const end = (r) => {
      if (done) return;
      done = true;
      resolve(r);
    };
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('HEAD', url, true);
      xhr.timeout = timeoutMs;
      xhr.onload = () => end({ status: xhr.status, type: (xhr.getResponseHeader('Content-Type') || '').toLowerCase() });
      xhr.onerror = () => end({ status: 0, type: '' });
      xhr.ontimeout = () => end({ status: 0, type: '', timeout: true });
      xhr.send(null);
    } catch (e) {
      end({ status: 0, type: '' });
    }
  });
}

function fromStatus(p) {
  const s = p.status;
  if (s === 401 || s === 403) {
    return {
      title: t('O servidor da fonte recusou o acesso (HTTP {code}).', { code: s }),
      hint: t('O link pode ter expirado ou exigir dados que a TV não envia. Tente outra fonte ou atualize a lista de fontes.'),
    };
  }
  if (s === 404 || s === 410) {
    return {
      title: t('O arquivo não existe mais no servidor da fonte (HTTP {code}).', { code: s }),
      hint: t('O link provavelmente expirou. Volte e abra a lista de fontes de novo para pegar um link novo.'),
    };
  }
  if (s === 429) {
    return {
      title: t('O servidor da fonte está limitando os pedidos (HTTP 429).'),
      hint: t('Espere um pouco e tente de novo, ou escolha outra fonte.'),
    };
  }
  if (s >= 500) {
    return {
      title: t('O servidor da fonte está com problema (HTTP {code}).', { code: s }),
      hint: t('O problema é do lado da fonte, não da TV. Tente outra fonte ou mais tarde.'),
    };
  }
  if (s >= 200 && s < 300 && /text\/html/.test(p.type)) {
    return {
      title: t('A fonte devolveu uma página da web em vez do vídeo.'),
      hint: t('O link não aponta direto para o arquivo (pode pedir login ou captcha). Tente outra fonte.'),
    };
  }
  if (s >= 200 && s < 300) {
    return {
      title: t('A fonte respondeu, mas o vídeo não pôde ser reproduzido.'),
      hint: !p.type || /^application\/(?:octet-stream|binary)(?:;|$)/.test(p.type)
        ? t('O servidor informou um tipo de arquivo genérico. Isso não identifica o formato nem comprova um codec incompatível.')
        : t('O tipo informado pelo servidor ({type}) não confirma o codec do arquivo. Pode faltar suporte ao formato ou haver um problema no conteúdo.', { type: p.type }),
      codec: true,
    };
  }
  return null;
}

// Resolves to { title, hint, codec }; codec is true when converting on the PC could help.
export function explainVideoError(code, url) {
  if (code === 1) {
    return Promise.resolve({
      title: t('A reprodução foi interrompida antes de começar.'),
      hint: t('Tente abrir a fonte de novo.'),
    });
  }
  if (code === 2) {
    return Promise.resolve({
      title: t('A conexão com a fonte caiu enquanto o vídeo carregava.'),
      hint: t('Confira a internet da TV. Se continuar, o servidor da fonte está lento ou o link expirou: tente outra fonte.'),
    });
  }
  if (code === 3) {
    return Promise.resolve({
      title: t('A TV não consegue decodificar o vídeo ou o áudio deste arquivo (codec não suportado ou arquivo danificado).'),
      hint: t(CODEC_HINT),
      codec: true,
    });
  }
  return probe(url, 6000).then((p) => {
    const known = fromStatus(p);
    if (known) return known;
    return {
      title: t('A TV não conseguiu abrir esta fonte.'),
      hint: p.timeout
        ? t('O servidor da fonte não respondeu a tempo. Tente outra fonte.')
        : t('O formato pode não ser suportado pela TV, ou o servidor recusou o acesso. Tente outra fonte.'),
      codec: true,
    };
  });
}
