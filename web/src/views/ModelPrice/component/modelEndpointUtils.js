export const parseJsonArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value || '[]');
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch (error) {
      if (value.trim()) {
        return [value.trim()];
      }
    }
  }

  return [];
};

export const inferApiEndpoints = ({ model, provider, inputModalities, outputModalities }) => {
  const endpoints = [];
  const seen = new Set();
  const source = [provider, model].filter(Boolean).join(' ').toLowerCase();

  const hasInputModality = (modality) => inputModalities.includes(modality);
  const hasOutputModality = (modality) => outputModalities.includes(modality);

  const isGemini = /gemini|vertex/.test(source);
  const isClaude = /claude|anthropic/.test(source);
  const isEmbeddingModel = /embedding|text-embedding|bge|voyage|rerank|e5|mxbai/.test(source);
  const isImageModel =
    hasInputModality('image') ||
    hasOutputModality('image') ||
    /(dall|flux|stable[- ]?diffusion|sdxl|midjourney|recraft|imagen|image|janus)/.test(source);
  const isVideoModel = hasInputModality('video') || hasOutputModality('video') || /(veo|video)/.test(source);
  const isSpeechModel = /(tts|text-to-speech|speech)/.test(source) || (hasOutputModality('audio') && !hasInputModality('audio'));
  const isTranscriptionModel = /(whisper|transcri|asr|stt)/.test(source) || hasInputModality('audio');
  const hasTextCapability =
    hasInputModality('text') ||
    hasOutputModality('text') ||
    (!isEmbeddingModel && !isImageModel && !isVideoModel && !isSpeechModel && !isTranscriptionModel);

  const addEndpoint = (protocol, path, color) => {
    const key = `${protocol}:${path}`;
    if (seen.has(key)) return;
    seen.add(key);
    endpoints.push({
      protocol,
      path,
      method: 'POST',
      color
    });
  };

  if (isGemini) {
    if (isVideoModel && /veo/.test(source)) {
      addEndpoint('gemini', `/gemini/v1beta/models/${model}:predictLongRunning`, 'info');
    } else if (isImageModel && !hasTextCapability) {
      addEndpoint('gemini', `/gemini/v1beta/models/${model}:predict`, 'info');
    } else {
      addEndpoint('gemini', `/gemini/v1beta/models/${model}:generateContent`, 'info');
    }
  }

  if (isClaude) {
    addEndpoint('claude', '/claude/v1/messages', 'warning');
  }

  if (hasTextCapability) {
    addEndpoint('openai', '/v1/chat/completions', 'primary');
  }

  if (isEmbeddingModel) {
    addEndpoint('openai', '/v1/embeddings', 'primary');
  }

  if (isImageModel) {
    addEndpoint('openai', '/v1/images/generations', 'primary');
  }

  if (isSpeechModel) {
    addEndpoint('openai', '/v1/audio/speech', 'primary');
  }

  if (isTranscriptionModel) {
    addEndpoint('openai', '/v1/audio/transcriptions', 'primary');
  }

  if (!endpoints.length) {
    addEndpoint('openai', '/v1/chat/completions', 'primary');
  }

  return endpoints;
};
