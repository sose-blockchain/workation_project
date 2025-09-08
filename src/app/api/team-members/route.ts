import { NextRequest, NextResponse } from 'next/server'
import { twitterService } from '@/lib/twitterService'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const screenName = searchParams.get('screenName')

  if (!projectId) {
    return NextResponse.json(
      { error: 'projectId is required' },
      { status: 400 }
    )
  }

  try {
    // 프로젝트의 기존 팀원 정보 조회
    const teamMembers = await twitterService.getTeamMembers(projectId)
    const teamOverview = await twitterService.getTeamOverview(projectId)

    return NextResponse.json({
      success: true,
      data: {
        teamMembers,
        teamOverview
      }
    })
  } catch (error) {
    console.error('팀원 정보 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, twitterAccountId, screenName } = await request.json()

    if (!projectId || !twitterAccountId || !screenName) {
      return NextResponse.json(
        { error: 'projectId, twitterAccountId, and screenName are required' },
        { status: 400 }
      )
    }

    // 팀원 정보 수집 및 저장
    const result = await twitterService.collectAndSaveTeamMembers(
      projectId,
      twitterAccountId,
      screenName
    )

    return NextResponse.json({
      success: result.success,
      data: result,
      error: result.error
    })
  } catch (error) {
    console.error('팀원 정보 수집 오류:', error)
    return NextResponse.json(
      { error: 'Failed to collect team members' },
      { status: 500 }
    )
  }
}
