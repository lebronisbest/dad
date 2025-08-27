import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// 현재 파일의 디렉토리 경로를 가져옴
const __dirname = dirname(fileURLToPath(import.meta.url));

// .env 파일 로드 (프로젝트 루트에서)
const envPath = resolve(__dirname, '../.env');
config({ path: envPath });

export const cfg = {
  provider: process.env.LLM_PROVIDER || 'openai',
  model: process.env.LLM_MODEL || 'gpt-4o-mini',
  parallel: Number(process.env.PARALLEL_LIMIT || 3),
  timeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 60000),
  temperature: Number(process.env.LLM_TEMPERATURE || 0.2),
  mcpCommand: process.env.MCP_COMMAND || 'node',
  mcpArgs: process.env.MCP_ARGS ? process.env.MCP_ARGS.split(' ') : ['server/mcp_server.js'],
  mcpEnv: { TZ: 'Asia/Seoul' }
};
