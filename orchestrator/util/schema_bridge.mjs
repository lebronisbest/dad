export function toOpenAITools(tools) {
  return tools.map(tool => {
    // MCP 도구의 스키마 정보를 더 정확하게 변환
    let parameters = { 
      type: 'object', 
      properties: {},
      required: []
    };
    
    if (tool.inputSchema) {
      // MCP 스키마를 OpenAI 형식으로 변환
      parameters = convertMCPSchemaToOpenAI(tool.inputSchema);
    } else if (tool.description) {
      // 설명에서 스키마 정보를 추출하려고 시도
      parameters = extractSchemaFromDescription(tool.description);
    }
    
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description || `도구: ${tool.name}`,
        parameters: parameters
      }
    };
  });
}

// MCP 스키마를 OpenAI 형식으로 변환
function convertMCPSchemaToOpenAI(mcpSchema) {
  if (typeof mcpSchema === 'string') {
    try {
      mcpSchema = JSON.parse(mcpSchema);
    } catch (e) {
      return { type: 'object', properties: {}, required: [] };
    }
  }
  
  if (mcpSchema.type === 'object' && mcpSchema.properties) {
    // 스키마에 validation_rules가 있으면 이를 활용
    let enhancedProperties = { ...mcpSchema.properties };
    
    // visit.date 필드에 날짜 형식 정보 추가
    if (enhancedProperties.visit && enhancedProperties.visit.properties && enhancedProperties.visit.properties.date) {
      enhancedProperties.visit.properties.date.description = 
        '방문일 (필수, 형식: YY.MM.DD(요일), 예: 25.08.22(목))';
    }
    
    // visit.round 필드에 형식 정보 추가
    if (enhancedProperties.visit && enhancedProperties.visit.properties && enhancedProperties.visit.properties.round) {
      enhancedProperties.visit.properties.round.description = 
        '방문차수 (필수, 정수)';
    }
    
    // visit.round_total 필드에 형식 정보 추가
    if (enhancedProperties.visit && enhancedProperties.visit.properties && enhancedProperties.visit.properties.round_total) {
      enhancedProperties.visit.properties.round_total.description = 
        '총 방문차수 (필수, 정수)';
    }
    
    return {
      type: 'object',
      properties: enhancedProperties,
      required: mcpSchema.required || []
    };
  }
  
  return { type: 'object', properties: {}, required: [] };
}

// 설명에서 스키마 정보 추출 시도
function extractSchemaFromDescription(description) {
  // MCP 도구의 설명에서 스키마 정보를 추출할 수 있는 경우에만 처리
  // 일반적으로는 MCP 도구의 inputSchema를 사용하는 것이 좋음
  return { type: 'object', properties: {}, required: [] };
}

export function sanitizeToolOutput(output) {
  if (typeof output === 'string') {
    return output;
  }
  
  if (typeof output === 'object' && output !== null) {
    // 민감한 정보 마스킹
    const sanitized = { ...output };
    
    // 전화번호 마스킹
    if (sanitized.phone) {
      sanitized.phone = sanitized.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    }
    
    // 주소 마스킹 (상세주소 부분)
    if (sanitized.address) {
      const parts = sanitized.address.split(' ');
      if (parts.length > 2) {
        parts[2] = '***';
        sanitized.address = parts.join(' ');
      }
    }
    
    // 이메일 마스킹
    if (sanitized.email) {
      const [local, domain] = sanitized.email.split('@');
      if (local.length > 2) {
        sanitized.email = local.substring(0, 2) + '***@' + domain;
      }
    }
    
    return sanitized;
  }
  
  return output;
}
