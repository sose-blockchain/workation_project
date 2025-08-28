import { NextRequest, NextResponse } from 'next/server';
import { cryptoRankAPI } from '@/lib/cryptorank';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectName = searchParams.get('project');
    
    if (!projectName) {
      return NextResponse.json(
        { error: 'Project name is required' }, 
        { status: 400 }
      );
    }

    // CryptoRank API에서 투자 라운드 데이터 가져오기
    const fundingRounds = await cryptoRankAPI.getFundingRoundsByProjectName(projectName);
    
    if (fundingRounds.length === 0) {
      return NextResponse.json({
        project: projectName,
        fundingRounds: [],
        message: 'No funding rounds found for this project'
      });
    }

    // 데이터베이스 형식으로 변환
    const convertedData = cryptoRankAPI.convertToInvestmentData(fundingRounds);

    return NextResponse.json({
      project: projectName,
      fundingRounds: convertedData,
      total: fundingRounds.length,
      source: 'cryptorank.io'
    });

  } catch (error) {
    console.error('CryptoRank API Error:', error);
    
    // API 오류 시에도 성공적인 응답을 보내되, 빈 데이터를 반환
    return NextResponse.json({
      project: request.nextUrl.searchParams.get('project'),
      fundingRounds: [],
      error: 'Failed to fetch from CryptoRank API',
      fallback: true
    });
  }
}

// POST 요청으로 여러 프로젝트의 투자 라운드를 일괄 조회
export async function POST(request: NextRequest) {
  try {
    const { projects } = await request.json();
    
    if (!Array.isArray(projects) || projects.length === 0) {
      return NextResponse.json(
        { error: 'Projects array is required' },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      projects.map(async (projectName: string) => {
        try {
          const fundingRounds = await cryptoRankAPI.getFundingRoundsByProjectName(projectName);
          const convertedData = cryptoRankAPI.convertToInvestmentData(fundingRounds);
          
          return {
            project: projectName,
            fundingRounds: convertedData,
            success: true
          };
        } catch (error) {
          return {
            project: projectName,
            fundingRounds: [],
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return NextResponse.json({
      results,
      total: results.length,
      successful: results.filter(r => r.success).length
    });

  } catch (error) {
    console.error('Batch funding rounds error:', error);
    return NextResponse.json(
      { error: 'Failed to process batch request' },
      { status: 500 }
    );
  }
}
