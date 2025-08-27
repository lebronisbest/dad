export async function makeProvider({ provider, ...opts }) {
  try {
    if (provider === 'openai') {
      const { OpenAIProvider } = await import('./openai.mjs');
      return new OpenAIProvider(opts);
    }
    
    if (provider === 'anthropic') {
      const { AnthropicProvider } = await import('./anthropic.mjs');
      return new AnthropicProvider(opts);
    }
    
    if (provider === 'google') {
      const { GoogleProvider } = await import('./google.mjs');
      return new GoogleProvider(opts);
    }
    
    throw new Error(`지원하지 않는 프로바이더: ${provider}`);
  } catch (error) {
    throw new Error(`프로바이더 생성 실패 (${provider}): ${error.message}`);
  }
}

export class BaseProvider {
  constructor(options = {}) {
    this.model = options.model;
    this.temperature = options.temperature || 0.2;
    this.maxTokens = options.maxTokens || 4000;
    this.timeout = options.timeout || 60000;
  }

  async chat({ messages, tools }) {
    throw new Error('chat 메서드를 구현해야 합니다');
  }

  async ask(prompt, options = {}) {
    const messages = [{ role: 'user', content: prompt }];
    const response = await this.chat({ messages, ...options });
    return response.choices[0].message.content;
  }
}
