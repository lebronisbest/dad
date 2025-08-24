import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  McpError,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { validateReportData } from "../../core/service.report.js";
import { normalizeReportDTO } from "../../core/schema.report.js";

/**
 * MCP 서버 - LLM이 필요한 기능만 제공
 * PDF 생성은 하지 않음 (API로 위임)
 */
class SafetyReportMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "safety-report-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // 도구 목록 제공
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "report.autofill",
            description: "자연어 텍스트에서 보고서 DTO를 자동 생성합니다",
            inputSchema: {
              type: "object",
              properties: {
                text: {
                  type: "string",
                  description: "보고서 내용을 포함한 자연어 텍스트"
                },
                context: {
                  type: "object",
                  description: "추가 맥락 정보 (선택사항)",
                  properties: {
                    site_info: { type: "string" },
                    organization_info: { type: "string" },
                    inspector_info: { type: "string" }
                  }
                }
              },
              required: ["text"]
            }
          },
          {
            name: "legal.search",
            description: "안전 관련 법령을 검색하고 요약합니다",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "검색할 법령 키워드"
                },
                category: {
                  type: "string",
                  enum: ["all", "labor", "construction", "safety"],
                  description: "법령 카테고리"
                }
              },
              required: ["query"]
            }
          },
          {
            name: "text.rewrite",
            description: "안전 보고서 텍스트를 다듬고 톤을 조정합니다",
            inputSchema: {
              type: "object",
              properties: {
                text: {
                  type: "string",
                  description: "다듬을 텍스트"
                },
                style: {
                  type: "string",
                  enum: ["formal", "concise", "detailed"],
                  description: "텍스트 스타일"
                },
                purpose: {
                  type: "string",
                  description: "텍스트 용도 (예: 결론, 권고사항 등)"
                }
              },
              required: ["text"]
            }
          },
          {
            name: "report.validate",
            description: "보고서 DTO의 유효성을 검증합니다",
            inputSchema: {
              type: "object",
              properties: {
                report_data: {
                  type: "object",
                  description: "검증할 보고서 데이터"
                }
              },
              required: ["report_data"]
            }
          }
        ]
      };
    });

    // 도구 실행 핸들러
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case "report.autofill":
            return await this.handleAutofill(args);

          case "legal.search":
            return await this.handleLegalSearch(args);

          case "text.rewrite":
            return await this.handleTextRewrite(args);

          case "report.validate":
            return await this.handleValidate(args);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  async handleAutofill(args) {
    const { text, context = {} } = args;

    // 간단한 텍스트 파싱 (실제로는 LLM 추론 필요)
    const dto = this.extractReportData(text, context);

    return {
      content: [
        {
          type: "json",
          json: {
            success: true,
            report: dto,
            message: "보고서 데이터를 생성했습니다"
          }
        },
        {
          type: "text",
          text: `✅ 보고서 DTO 생성 완료\n📊 추출된 필드: ${Object.keys(dto).join(', ')}`
        }
      ]
    };
  }

  async handleLegalSearch(args) {
    const { query, category = "all" } = args;

    // 법령 검색 시뮬레이션 (실제로는 법령 DB 검색)
    const results = this.searchLaws(query, category);

    return {
      content: [
        {
          type: "json",
          json: {
            success: true,
            query,
            category,
            results
          }
        },
        {
          type: "text",
          text: `📋 법령 검색 결과: ${results.length}건\n🔍 검색어: ${query}`
        }
      ]
    };
  }

  async handleTextRewrite(args) {
    const { text, style = "formal", purpose = "" } = args;

    // 텍스트 리라이팅 시뮬레이션
    const rewritten = this.rewriteText(text, style, purpose);

    return {
      content: [
        {
          type: "json",
          json: {
            success: true,
            original: text,
            rewritten,
            style,
            purpose
          }
        },
        {
          type: "text",
          text: `✏️ 텍스트 리라이팅 완료\n📝 스타일: ${style}`
        }
      ]
    };
  }

  async handleValidate(args) {
    const { report_data } = args;

    const result = await validateReportData(report_data);

    if (result.ok) {
      return {
        content: [
          {
            type: "json",
            json: {
              success: true,
              valid: true,
              normalized_data: result.normalizedData
            }
          },
          {
            type: "text",
            text: "✅ 데이터 검증 성공"
          }
        ]
      };
    } else {
      return {
        content: [
          {
            type: "json",
            json: {
              success: false,
              valid: false,
              errors: result.errors
            }
          },
          {
            type: "text",
            text: `❌ 데이터 검증 실패: ${result.errors.length}개 오류`
          }
        ]
      };
    }
  }

  // 헬퍼 메소드들
  extractReportData(text, context) {
    // 간단한 텍스트에서 보고서 데이터 추출
    const dto = {
      site: {
        name: this.extractField(text, /(현장|사이트|장소)[:\s]*([^\n\r]+)/i) || "현장명 미상",
        address: this.extractField(text, /(주소|위치)[:\s]*([^\n\r]+)/i) || "",
        phone: this.extractField(text, /(전화|연락처)[:\s]*([^\d-]+)/) || ""
      },
      org: {
        name: this.extractField(text, /(회사|조직|업체)[:\s]*([^\n\r]+)/i) || "조직명 미상",
        inspector: this.extractField(text, /(점검자|감독관|책임자)[:\s]*([^\n\r]+)/i) || "점검자명 미상"
      },
      inspector: this.extractField(text, /(점검자|감독관|책임자)[:\s]*([^\n\r]+)/i) || "점검자명 미상",
      round: this.extractNumber(text, /(차|회차|차수)[:\s]*(\d+)/i) || 1,
      round_total: this.extractNumber(text, /(총|전체)[:\s]*(\d+)[차회]/i) || 1,
      visit: {
        date: this.extractDate(text) || new Date().toISOString().split('T')[0]
      }
    };

    return normalizeReportDTO(dto);
  }

  extractField(text, pattern) {
    const match = text.match(pattern);
    return match ? match[2].trim() : null;
  }

  extractNumber(text, pattern) {
    const match = text.match(pattern);
    return match ? parseInt(match[2]) : null;
  }

  extractDate(text) {
    // 날짜 패턴들 시도
    const patterns = [
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, // YYYY-MM-DD
      /(\d{2})[\/\-](\d{1,2})[\/\-](\d{1,2})/, // YY-MM-DD
      /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/ // 한국식
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const year = match[1].length === 2 ? `20${match[1]}` : match[1];
        return `${year}-${match[2].padStart(2,'0')}-${match[3].padStart(2,'0')}`;
      }
    }
    return null;
  }

  searchLaws(query, category) {
    // 모의 법령 검색 결과
    const mockLaws = [
      {
        law: "산업안전보건법",
        clause: "제38조",
        content: "사업주는 근로자의 안전과 보건을 확보하기 위하여 필요한 조치를 하여야 한다",
        relevance: 0.95
      },
      {
        law: "건설업법",
        clause: "제25조",
        content: "건설공사 현장에는 안전관리자를 두어야 한다",
        relevance: 0.87
      }
    ];

    return mockLaws.filter(law =>
      law.content.includes(query) ||
      law.law.includes(query) ||
      law.clause.includes(query)
    );
  }

  rewriteText(text, style, purpose) {
    // 간단한 텍스트 리라이팅 (실제로는 LLM 사용)
    let rewritten = text;

    if (style === "formal") {
      rewritten = rewritten.replace(/잘/g, "적절히");
      rewritten = rewritten.replace(/좋은/g, "적합한");
    }

    if (purpose.includes("결론")) {
      rewritten = `결론적으로, ${rewritten}`;
    }

    return rewritten;
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("🚀 MCP 서버가 stdio 모드로 시작되었습니다");
  }
}

// 서버 실행
const server = new SafetyReportMCPServer();
server.start().catch(console.error);

// API 래퍼로 export (web_server.js에서 사용)
export { SafetyReportMCPServer as SafetyReportMCPAPIWrapper };