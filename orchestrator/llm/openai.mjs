import OpenAI from 'openai';
import { BaseProvider } from './provider.mjs';
import { logger } from '../util/logger.mjs';

export class OpenAIProvider extends BaseProvider {
  constructor(options = {}) {
    super(options);
    this.apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('OpenAI API 키가 필요합니다. OPENAI_API_KEY 환경변수를 설정하거나 options.apiKey를 제공하세요.');
    }
    
    this.client = new OpenAI({ 
      apiKey: this.apiKey,
      timeout: this.timeout
    });
    
    logger.info('OpenAI 프로바이더 초기화 완료', { model: this.model });
  }

  async chat({ messages, tools, ...options }) {
    const startTime = Date.now();
    
    try {
      const requestOptions = {
        model: this.model,
        messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        ...options
      };

      if (tools && tools.length > 0) {
        requestOptions.tools = tools;
        requestOptions.tool_choice = 'auto';
      }

      logger.debug('OpenAI API 호출 시작', { 
        model: this.model, 
        messageCount: messages.length,
        hasTools: !!tools
      });

      const response = await this.client.chat.completions.create(requestOptions);
      
      const duration = Date.now() - startTime;
      logger.logLLMCall(this.model, messages, response, duration);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('OpenAI API 호출 실패', error);
      
      // 재시도 로직
      if (error.status === 429 || error.status >= 500) {
        logger.warning('API 오류로 인한 재시도 시도', { 
          status: error.status, 
          retryable: true 
        });
        
        // 잠시 대기 후 재시도
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.chat({ messages, tools, ...options });
      }
      
      throw error;
    }
  }

  async ask(prompt, options = {}) {
    const messages = [{ role: 'user', content: prompt }];
    const response = await this.chat({ messages, ...options });
    return response.choices[0].message.content;
  }
}
