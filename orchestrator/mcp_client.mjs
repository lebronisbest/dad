import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { cfg } from './config.mjs';

export async function createMCP() {
  try {
    const transport = new StdioClientTransport({
      command: cfg.mcpCommand,
      args: cfg.mcpArgs,
      env: cfg.mcpEnv
    });
    
    const client = new Client({ 
      name: 'safety-report-orchestrator', 
      version: '1.0.0' 
    });
    
    await client.connect(transport);
    console.log('✅ MCP 클라이언트 연결 성공');
    return client;
  } catch (error) {
    console.error('❌ MCP 클라이언트 연결 실패:', error.message);
    throw error;
  }
}

export async function listTools(mcp) {
  try {
    const { tools } = await mcp.listTools();
    console.log(`📋 사용 가능한 도구: ${tools.length}개`);
    return tools;
  } catch (error) {
    console.error('❌ 도구 목록 조회 실패:', error.message);
    throw error;
  }
}

export async function callTool(mcp, name, arguments_) {
  try {
    console.log(`🔧 도구 호출: ${name}`);
    const result = await mcp.callTool({ name, arguments: arguments_ });
    return result;
  } catch (error) {
    console.error(`❌ 도구 호출 실패 (${name}):`, error.message);
    throw error;
  }
}
