// agents/stdio.mjs  (ESM)
import { Agent, run, MCPServerStdio, createMCPToolStaticFilter } from '@openai/agents';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// To use this agent, set the OPENAI_API_KEY environment variable.
// For example:
// OPENAI_API_KEY="sk-..." node agents/stdio.mjs "Your prompt"

async function main() {
  // 1) 로컬 MCP 서버(stdio) 실행: 네 프로젝트의 서버 파일을 그대로 사용
  const fullCommand = `node ${path.join(__dirname, '..', 'server', 'mcp_server.js')}`;
  const mcp = new MCPServerStdio({
    name: 'safety-report',
    fullCommand,
    env: { 
      OPENAI_API_KEY: process.env.OPENAI_API_KEY
    }
  });
  await mcp.connect(); // 연결 필수

  try {
    // 2) 노출할 MCP 툴을 최소화(권장): 서버가 제공하는 툴 이름에 맞춰 조정
    const toolFilter = createMCPToolStaticFilter({
      allowed: ['fill_report', 'validate_report_data'] // 서버 툴 이름에 맞게 유지/수정
    });

    // 3) 에이전트 생성: 누락 필드가 있으면 먼저 되물은 후 툴을 호출하도록 지시
    const agent = new Agent({
      name: 'Safety Report Agent',
      instructions: [
        '너는 산업안전 보고서 어시스턴트다.',
        '툴 인자(data.*)가 비거나 형식이 틀리면 먼저 사용자에게 필요한 값을 되물어 채운다.',
        'fill_report 호출 시 data/site/org/visit/progress 필수값을 빠짐없이 JSON으로 전달한다.',
        '검증 오류가 오면 오류 메시지를 분석해 인자를 수정하고 재호출한다.',
        '툴 호출 이외의 서술 텍스트는 최소화하고, 결과 파일 경로나 요약만 최종 출력한다.'
      ].join('\n'),
      mcpServers: [mcp],
      toolFilter
    });

    // 4) 사용자 입력 받기
    const userInput = process.argv[2] || `
강남구 신축아파트 점검 보고서 초안을 PDF로 만들어줘.
현장명: 현장A, 주소: 서울특별시 강남구 어딘가 123
기관: G1 안전 기술원, 점검자: 홍길동
방문: 25.08.22(금), 1/4회차
진척도: 60%
`;

    console.log('사용자 입력:', userInput);
    console.log('에이전트 실행 중...\n');

    const result = await run(agent, userInput);
    console.log('\n=== FINAL OUTPUT ===\n');
    console.log(result.finalOutput);
  } finally {
    await mcp.close();
  }
}

main().catch(err => {
  console.error('Agent run failed:', err);
  process.exit(1);
});
