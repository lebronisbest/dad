import { UIAction } from './socket';

export interface ToolResult {
  tool: string;
  result: any;
  success: boolean;
  error?: string;
}

export interface TranslationContext {
  uiSessionId: string;
  userId?: string;
  currentFormData?: any;
  previousActions?: UIAction[];
}

export class UITranslator {
  private context: TranslationContext;

  constructor(context: TranslationContext) {
    this.context = context;
  }

  // MCP 툴 결과를 UI 액션으로 변환
  public translateToolResult(toolResult: ToolResult): UIAction[] {
    const { tool, result, success, error } = toolResult;

    if (!success) {
      return this.handleToolError(tool, error);
    }

    switch (tool) {
      case 'fill_report':
        return this.translateFillReport(result);
      
      case 'validate_report_data':
        return this.translateValidationResult(result);
      
      case 'render_pdf':
        return this.translatePdfRender(result);
      
      case 'get_law_content':
        return this.translateLawContent(result);
      
      case 'web_snapshot':
        return this.translateWebSnapshot(result);
      
      case 'upload_image':
        return this.translateImageUpload(result);
      
      default:
        return this.translateGenericResult(tool, result);
    }
  }

  // fill_report 결과 변환
  private translateFillReport(result: any): UIAction[] {
    const actions: UIAction[] = [];

    // 필드 설정 액션
    if (result.data && typeof result.data === 'object') {
      actions.push({
        type: 'set_fields',
        payload: {
          fields: result.data,
          source: 'fill_report',
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        sequence: 0
      });
    }

    // 성공 토스트
    actions.push({
      type: 'show_toast',
      payload: {
        message: '보고서 필드가 자동으로 채워졌습니다.',
        type: 'success',
        duration: 3000
      },
      timestamp: Date.now(),
      sequence: 0
    });

    // 미리보기 패널 열기
    actions.push({
      type: 'open_panel',
      payload: {
        panel: 'preview',
        title: '보고서 미리보기',
        data: result.data
      },
      timestamp: Date.now(),
      sequence: 0
    });

    return actions;
  }

  // validate_report_data 결과 변환
  private translateValidationResult(result: any): UIAction[] {
    const actions: UIAction[] = [];

    if (result.valid) {
      // 검증 성공
      actions.push({
        type: 'show_toast',
        payload: {
          message: '보고서 데이터가 유효합니다.',
          type: 'success',
          duration: 3000
        },
        timestamp: Date.now(),
        sequence: 0
      });
    } else {
      // 검증 실패 - 문제가 있는 필드 강조
      if (result.errors && Array.isArray(result.errors)) {
        result.errors.forEach((error: any) => {
          if (error.field) {
            actions.push({
              type: 'highlight_field',
              payload: {
                field: error.field,
                message: error.message,
                type: 'error',
                duration: 5000
              },
              timestamp: Date.now(),
              sequence: 0
            });
          }
        });
      }

      // 오류 토스트
      actions.push({
        type: 'show_toast',
        payload: {
          message: `검증 실패: ${result.errors?.length || 0}개 오류가 발견되었습니다.`,
          type: 'error',
          duration: 5000
        },
        timestamp: Date.now(),
        sequence: 0
      });
    }

    return actions;
  }

  // render_pdf 결과 변환
  private translatePdfRender(result: any): UIAction[] {
    const actions: UIAction[] = [];

    // PDF 렌더링 시작
    actions.push({
      type: 'start_pdf_render',
      payload: {
        message: 'PDF를 생성하고 있습니다...',
        progress: 0
      },
      timestamp: Date.now(),
      sequence: 0
    });

    // 진행률 업데이트
    actions.push({
      type: 'update_progress',
      payload: {
        progress: 50,
        message: '템플릿에 데이터를 주입하고 있습니다...'
      },
      timestamp: Date.now(),
      sequence: 0
    });

    // 완료 액션
    if (result.url) {
      actions.push({
        type: 'end_pdf_render',
        payload: {
          url: result.url,
          filename: result.filename,
          message: 'PDF 생성이 완료되었습니다.',
          downloadUrl: result.url
        },
        timestamp: Date.now(),
        sequence: 0
      });
    }

    return actions;
  }

  // get_law_content 결과 변환
  private translateLawContent(result: any): UIAction[] {
    const actions: UIAction[] = [];

    if (result.content) {
      // 법령 내용 삽입
      actions.push({
        type: 'insert_law_citation',
        payload: {
          lawName: result.law_name || '관련 법령',
          content: result.content,
          source: result.source,
          article: result.article
        },
        timestamp: Date.now(),
        sequence: 0
      });

      // 성공 토스트
      actions.push({
        type: 'show_toast',
        payload: {
          message: '법령 내용이 삽입되었습니다.',
          type: 'success',
          duration: 3000
        },
        timestamp: Date.now(),
        sequence: 0
      });
    }

    return actions;
  }

  // web_snapshot 결과 변환
  private translateWebSnapshot(result: any): UIAction[] {
    const actions: UIAction[] = [];

    if (result.summary) {
      // 웹 스냅샷 내용 삽입
      actions.push({
        type: 'insert_law_citation',
        payload: {
          lawName: '웹 스냅샷',
          content: result.summary,
          source: result.url,
          article: '웹 페이지 요약'
        },
        timestamp: Date.now(),
        sequence: 0
      });

      // 성공 토스트
      actions.push({
        type: 'show_toast',
        payload: {
          message: '웹 페이지 내용이 요약되어 삽입되었습니다.',
          type: 'success',
          duration: 3000
        },
        timestamp: Date.now(),
        sequence: 0
      });
    }

    return actions;
  }

  // upload_image 결과 변환
  private translateImageUpload(result: any): UIAction[] {
    const actions: UIAction[] = [];

    if (result.url) {
      // 이미지 삽입
      actions.push({
        type: 'set_field',
        payload: {
          field: 'safety_photo',
          value: result.url,
          type: 'image',
          metadata: {
            width: result.width,
            height: result.height,
            format: result.format,
            size: result.size
          }
        },
        timestamp: Date.now(),
        sequence: 0
      });

      // 성공 토스트
      actions.push({
        type: 'show_toast',
        payload: {
          message: '이미지가 업로드되었습니다.',
          type: 'success',
          duration: 3000
        },
        timestamp: Date.now(),
        sequence: 0
      });
    }

    return actions;
  }

  // 일반적인 툴 결과 변환
  private translateGenericResult(tool: string, result: any): UIAction[] {
    const actions: UIAction[] = [];

    // 성공 토스트
    actions.push({
      type: 'show_toast',
      payload: {
        message: `${tool} 작업이 완료되었습니다.`,
        type: 'success',
        duration: 3000
      },
      timestamp: Date.now(),
      sequence: 0
    });

    return actions;
  }

  // 툴 오류 처리
  private handleToolError(tool: string, error?: string): UIAction[] {
    const actions: UIAction[] = [];

    // 오류 토스트
    actions.push({
      type: 'show_toast',
      payload: {
        message: `${tool} 실행 중 오류가 발생했습니다: ${error || '알 수 없는 오류'}`,
        type: 'error',
        duration: 5000
      },
      timestamp: Date.now(),
      sequence: 0
    });

    return actions;
  }

  // 컨텍스트 업데이트
  public updateContext(newContext: Partial<TranslationContext>) {
    this.context = { ...this.context, ...newContext };
  }

  // 컨텍스트 조회
  public getContext(): TranslationContext {
    return this.context;
  }
}

export default UITranslator;
