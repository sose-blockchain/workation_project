// 오류 처리 관련 타입 정의

export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: string;
  context?: string;
}

export interface SupabaseError extends AppError {
  supabaseCode?: string;
  hint?: string;
}

export interface APIError extends AppError {
  endpoint?: string;
  status?: number;
}

// 사용자 친화적 오류 메시지 매핑
export const ERROR_MESSAGES: Record<string, string> = {
  // Supabase 오류
  'PGRST116': '요청한 데이터가 존재하지 않습니다.',
  'PGRST301': '데이터 접근 권한이 없습니다.',
  '42P01': '데이터베이스 테이블이 존재하지 않습니다.',
  'connection_error': 'Supabase 데이터베이스에 연결할 수 없습니다.',
  
  // API 오류
  'twitter_api_limit': 'Twitter API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
  'twitter_user_not_found': 'Twitter 사용자를 찾을 수 없습니다.',
  'coingecko_api_error': 'CoinGecko API에서 데이터를 가져올 수 없습니다.',
  'gemini_api_error': 'AI 분석 서비스에 일시적인 문제가 발생했습니다.',
  
  // 일반 오류
  'network_error': '네트워크 연결을 확인해주세요.',
  'unknown_error': '알 수 없는 오류가 발생했습니다. 지속되면 관리자에게 문의해주세요.',
  'invalid_input': '입력된 정보가 올바르지 않습니다.',
  'data_not_found': '요청한 정보를 찾을 수 없습니다.'
};

export class AppErrorHandler {
  static createError(code: string, context?: string, details?: string): AppError {
    return {
      code,
      message: ERROR_MESSAGES[code] || ERROR_MESSAGES['unknown_error'],
      details,
      context,
      timestamp: new Date().toISOString()
    };
  }

  static createSupabaseError(error: any, context?: string): SupabaseError {
    const code = error.code || 'connection_error';
    const message = ERROR_MESSAGES[code] || error.message || ERROR_MESSAGES['unknown_error'];
    
    return {
      code,
      message,
      details: error.details,
      hint: error.hint,
      context,
      timestamp: new Date().toISOString(),
      supabaseCode: error.code
    };
  }

  static createAPIError(endpoint: string, status: number, message?: string): APIError {
    let code = 'unknown_error';
    
    if (status === 429) {
      code = 'twitter_api_limit';
    } else if (status === 404) {
      code = 'data_not_found';
    } else if (status >= 500) {
      code = 'network_error';
    }

    return {
      code,
      message: message || ERROR_MESSAGES[code],
      endpoint,
      status,
      timestamp: new Date().toISOString()
    };
  }

  static logError(error: AppError): void {
    console.error(`❌ [${error.code}] ${error.message}`, {
      details: error.details,
      context: error.context,
      timestamp: error.timestamp
    });
  }

  static getUserMessage(error: AppError): string {
    return error.message;
  }
}
