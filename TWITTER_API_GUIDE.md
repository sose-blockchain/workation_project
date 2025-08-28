# Twitter API (X API) 사용 가이드

## 📋 개요

이 문서는 RapidAPI를 통한 Twitter API 연동 및 데이터 수집에 대한 가이드입니다.

## 🔑 API 인증 정보

### RapidAPI 설정
- **서비스**: Twitter API (RapidAPI)
- **호스트**: `twitter-api45.p.rapidapi.com`
- **요청 URL**: `rapidapi.com`

### 환경 변수 설정
```env
# .env.local 파일에 추가
NEXT_PUBLIC_TWITTER_API_KEY=your_rapidapi_key_here
NEXT_PUBLIC_TWITTER_API_HOST=twitter-api45.p.rapidapi.com
```

> ⚠️ **보안 주의**: API 키는 환경 변수로 관리하며, 공개 저장소에 노출되지 않도록 주의하세요.

## 🛠️ 사용 가능한 엔드포인트

### 사용자 정보
- **`GET User info`** - 사용자 기본 정보 조회
- **`GET User timeline`** - 사용자 타임라인 조회
- **`GET Following`** - 팔로잉 목록 조회
- **`GET Followers`** - 팔로워 목록 조회
- **`GET User's Media`** - 사용자 미디어 조회

### 트윗 정보
- **`GET Tweet info`** - 특정 트윗 정보 조회
- **`GET Retweets`** - 리트윗 조회
- **`GET Tweet thread`** - 트윗 스레드 조회
- **`GET User replies`** - 사용자 답글 조회
- **`GET Latest replies`** - 최신 답글 조회

### 검색 및 트렌드
- **`GET Search`** - 트윗 검색
- **`GET Trends`** - 트렌드 조회
- **`GET Check Retweet`** - 리트윗 확인
- **`GET Check follow`** - 팔로우 확인

### 커뮤니티 및 기타
- **`GET Communities Posts Search`** - 커뮤니티 포스트 검색
- **`GET Communities Search`** - 커뮤니티 검색
- **`GET Profiles By RestIds`** - 프로필 ID로 조회
- **`GET List followers`** - 리스트 팔로워 조회
- **`GET List members`** - 리스트 멤버 조회
- **`GET Spaces info`** - 스페이스 정보 조회

## 💻 Node.js 구현 예제

### 1. 사용자 정보 조회 (User Info)
```javascript
const http = require('https');

const options = {
  method: 'GET',
  hostname: 'twitter-api45.p.rapidapi.com',
  port: null,
  path: '/screenname.php?screenname=elonmusk&rest_id=44196397',
  headers: {
    'x-rapidapi-key': process.env.NEXT_PUBLIC_TWITTER_API_KEY,
    'x-rapidapi-host': 'twitter-api45.p.rapidapi.com'
  }
};

const req = http.request(options, function (res) {
  const chunks = [];

  res.on('data', function (chunk) {
    chunks.push(chunk);
  });

  res.on('end', function () {
    const body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.end();
```

### 2. 사용자 타임라인 조회 (User Timeline)
```javascript
const http = require('https');

const options = {
  method: 'GET',
  hostname: 'twitter-api45.p.rapidapi.com',
  port: null,
  path: '/timeline.php?screenname=elonmusk',
  headers: {
    'x-rapidapi-key': process.env.NEXT_PUBLIC_TWITTER_API_KEY,
    'x-rapidapi-host': 'twitter-api45.p.rapidapi.com'
  }
};

const req = http.request(options, function (res) {
  const chunks = [];

  res.on('data', function (chunk) {
    chunks.push(chunk);
  });

  res.on('end', function () {
    const body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.end();
```

### 3. 팔로잉 목록 조회 (Following)
```javascript
const http = require('https');

const options = {
  method: 'GET',
  hostname: 'twitter-api45.p.rapidapi.com',
  port: null,
  path: '/following.php?screenname=elonmusk',
  headers: {
    'x-rapidapi-key': process.env.NEXT_PUBLIC_TWITTER_API_KEY,
    'x-rapidapi-host': 'twitter-api45.p.rapidapi.com'
  }
};

const req = http.request(options, function (res) {
  const chunks = [];

  res.on('data', function (chunk) {
    chunks.push(chunk);
  });

  res.on('end', function () {
    const body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.end();
```

### 4. 팔로워 목록 조회 (Followers)
```javascript
const http = require('https');

const options = {
  method: 'GET',
  hostname: 'twitter-api45.p.rapidapi.com',
  port: null,
  path: '/followers.php?screenname=elonmusk&blue_verified=0',
  headers: {
    'x-rapidapi-key': process.env.NEXT_PUBLIC_TWITTER_API_KEY,
    'x-rapidapi-host': 'twitter-api45.p.rapidapi.com'
  }
};

const req = http.request(options, function (res) {
  const chunks = [];

  res.on('data', function (chunk) {
    chunks.push(chunk);
  });

  res.on('end', function () {
    const body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.end();
```

### 5. 트윗 정보 조회 (Tweet Info)
```javascript
const http = require('https');

const options = {
  method: 'GET',
  hostname: 'twitter-api45.p.rapidapi.com',
  port: null,
  path: '/tweet.php?id=1671370010743263233',
  headers: {
    'x-rapidapi-key': process.env.NEXT_PUBLIC_TWITTER_API_KEY,
    'x-rapidapi-host': 'twitter-api45.p.rapidapi.com'
  }
};

const req = http.request(options, function (res) {
  const chunks = [];

  res.on('data', function (chunk) {
    chunks.push(chunk);
  });

  res.on('end', function () {
    const body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.end();
```

### 6. 제휴사 정보 조회 (Affiliates)
```javascript
const http = require('https');

const options = {
  method: 'GET',
  hostname: 'twitter-api45.p.rapidapi.com',
  port: null,
  path: '/affilates.php?screenname=x',
  headers: {
    'x-rapidapi-key': process.env.NEXT_PUBLIC_TWITTER_API_KEY,
    'x-rapidapi-host': 'twitter-api45.p.rapidapi.com'
  }
};

const req = http.request(options, function (res) {
  const chunks = [];

  res.on('data', function (chunk) {
    chunks.push(chunk);
  });

  res.on('end', function () {
    const body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.end();
```

### 7. 리트윗 조회 (Retweets)
```javascript
const http = require('https');

const options = {
  method: 'GET',
  hostname: 'twitter-api45.p.rapidapi.com',
  port: null,
  path: '/retweets.php?id=1700199139470942473',
  headers: {
    'x-rapidapi-key': process.env.NEXT_PUBLIC_TWITTER_API_KEY,
    'x-rapidapi-host': 'twitter-api45.p.rapidapi.com'
  }
};

const req = http.request(options, function (res) {
  const chunks = [];

  res.on('data', function (chunk) {
    chunks.push(chunk);
  });

  res.on('end', function () {
    const body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.end();
```

### 8. 사용자 답글 조회 (User Replies)
```javascript
const http = require('https');

const options = {
  method: 'GET',
  hostname: 'twitter-api45.p.rapidapi.com',
  port: null,
  path: '/replies.php',
  headers: {
    'x-rapidapi-key': process.env.NEXT_PUBLIC_TWITTER_API_KEY,
    'x-rapidapi-host': 'twitter-api45.p.rapidapi.com'
  }
};

const req = http.request(options, function (res) {
  const chunks = [];

  res.on('data', function (chunk) {
    chunks.push(chunk);
  });

  res.on('end', function () {
    const body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.end();
```

### 9. 트윗 스레드 조회 (Tweet Thread)
```javascript
const http = require('https');

const options = {
  method: 'GET',
  hostname: 'twitter-api45.p.rapidapi.com',
  port: null,
  path: '/tweet_thread.php?id=1738106896777699464',
  headers: {
    'x-rapidapi-key': process.env.NEXT_PUBLIC_TWITTER_API_KEY,
    'x-rapidapi-host': 'twitter-api45.p.rapidapi.com'
  }
};

const req = http.request(options, function (res) {
  const chunks = [];

  res.on('data', function (chunk) {
    chunks.push(chunk);
  });

  res.on('end', function () {
    const body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.end();
```

### 10. 팔로우 확인 (Check Follow)
```javascript
const http = require('https');

const options = {
  method: 'GET',
  hostname: 'twitter-api45.p.rapidapi.com',
  port: null,
  path: '/checkfollow.php',
  headers: {
    'x-rapidapi-key': process.env.NEXT_PUBLIC_TWITTER_API_KEY,
    'x-rapidapi-host': 'twitter-api45.p.rapidapi.com'
  }
};

const req = http.request(options, function (res) {
  const chunks = [];

  res.on('data', function (chunk) {
    chunks.push(chunk);
  });

  res.on('end', function () {
    const body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.end();
```

### 11. 리스트 팔로워 조회 (List Followers)
```javascript
const http = require('https');

const options = {
  method: 'GET',
  hostname: 'twitter-api45.p.rapidapi.com',
  port: null,
  path: '/list_followers.php?list_id=1177128103228989440',
  headers: {
    'x-rapidapi-key': process.env.NEXT_PUBLIC_TWITTER_API_KEY,
    'x-rapidapi-host': 'twitter-api45.p.rapidapi.com'
  }
};

const req = http.request(options, function (res) {
  const chunks = [];

  res.on('data', function (chunk) {
    chunks.push(chunk);
  });

  res.on('end', function () {
    const body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.end();
```

### 12. 리스트 멤버 조회 (List Members)
```javascript
const http = require('https');

const options = {
  method: 'GET',
  hostname: 'twitter-api45.p.rapidapi.com',
  port: null,
  path: '/list_members.php?list_id=1177128103228989440',
  headers: {
    'x-rapidapi-key': process.env.NEXT_PUBLIC_TWITTER_API_KEY,
    'x-rapidapi-host': 'twitter-api45.p.rapidapi.com'
  }
};

const req = http.request(options, function (res) {
  const chunks = [];

  res.on('data', function (chunk) {
    chunks.push(chunk);
  });

  res.on('end', function () {
    const body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.end();
```

## 🔗 Next.js API Route 예제

### 사용자 정보 API Route
```javascript
// src/app/api/twitter/user-info/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const screenname = searchParams.get('screenname');
  const rest_id = searchParams.get('rest_id');

  if (!screenname) {
    return Response.json({ error: 'screenname is required' }, { status: 400 });
  }

  try {
    const url = rest_id 
      ? `https://twitter-api45.p.rapidapi.com/screenname.php?screenname=${screenname}&rest_id=${rest_id}`
      : `https://twitter-api45.p.rapidapi.com/screenname.php?screenname=${screenname}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.NEXT_PUBLIC_TWITTER_API_KEY,
        'x-rapidapi-host': 'twitter-api45.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Twitter API Error:', error);
    return Response.json({ error: 'Failed to fetch Twitter data' }, { status: 500 });
  }
}
```

### 타임라인 API Route
```javascript
// src/app/api/twitter/timeline/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const screenname = searchParams.get('screenname');

  if (!screenname) {
    return Response.json({ error: 'screenname is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://twitter-api45.p.rapidapi.com/timeline.php?screenname=${screenname}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': process.env.NEXT_PUBLIC_TWITTER_API_KEY,
          'x-rapidapi-host': 'twitter-api45.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Twitter Timeline API Error:', error);
    return Response.json({ error: 'Failed to fetch timeline data' }, { status: 500 });
  }
}
```

### 팔로워 API Route
```javascript
// src/app/api/twitter/followers/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const screenname = searchParams.get('screenname');
  const blue_verified = searchParams.get('blue_verified') || '0';

  if (!screenname) {
    return Response.json({ error: 'screenname is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://twitter-api45.p.rapidapi.com/followers.php?screenname=${screenname}&blue_verified=${blue_verified}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': process.env.NEXT_PUBLIC_TWITTER_API_KEY,
          'x-rapidapi-host': 'twitter-api45.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Twitter Followers API Error:', error);
    return Response.json({ error: 'Failed to fetch followers data' }, { status: 500 });
  }
}
```

### React 컴포넌트에서 사용
```javascript
// components/TwitterUserInfo.jsx
import { useState, useEffect } from 'react';

export default function TwitterUserInfo({ screenname }) {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/twitter/user-info?screenname=${screenname}`);
      if (!response.ok) throw new Error('Failed to fetch user info');
      
      const data = await response.json();
      setUserInfo(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (screenname) {
      fetchUserInfo();
    }
  }, [screenname]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!userInfo) return null;

  return (
    <div className="twitter-user-info">
      <h3>{userInfo.name}</h3>
      <p>@{userInfo.screen_name}</p>
      <p>Followers: {userInfo.followers_count}</p>
      <p>Following: {userInfo.friends_count}</p>
    </div>
  );
}
```

## 🎯 프로젝트에서 활용 방안

### 1. 팀원 트위터 활동도 분석
```javascript
// 팀원들의 트위터 활동도 측정
const analyzeTeamActivity = async (twitterHandles) => {
  const results = [];
  
  for (const handle of twitterHandles) {
    try {
      // 사용자 정보 조회
      const userInfo = await fetchUserInfo(handle);
      
      // 최근 타임라인 조회
      const timeline = await fetchUserTimeline(handle);
      
      // 활동도 계산
      const activityScore = calculateActivityScore(timeline);
      
      results.push({
        handle,
        userInfo,
        activityScore,
        lastTweetDate: timeline[0]?.created_at,
        tweetsPerWeek: calculateTweetsPerWeek(timeline)
      });
    } catch (error) {
      console.error(`Failed to analyze ${handle}:`, error);
    }
  }
  
  return results;
};
```

### 2. 프로젝트 관련 트윗 모니터링
```javascript
// 특정 프로젝트 관련 트윗 검색 및 분석
const monitorProjectMentions = async (projectName) => {
  try {
    const searchResults = await searchTweets(projectName);
    
    return {
      totalMentions: searchResults.length,
      sentiment: analyzeSentiment(searchResults),
      topInfluencers: getTopInfluencers(searchResults),
      trendingTopics: extractHashtags(searchResults)
    };
  } catch (error) {
    console.error('Failed to monitor project mentions:', error);
  }
};
```

### 3. SNS 스코어링 시스템
```javascript
// SNS 활동도를 기반으로 한 스코어링
const calculateSNSScore = (twitterData) => {
  const {
    followers_count,
    friends_count,
    statuses_count,
    favourites_count,
    account_age_days,
    recent_activity
  } = twitterData;

  // 가중치 기반 스코어 계산
  const followerScore = Math.min(followers_count / 1000, 100) * 0.3;
  const activityScore = (statuses_count / account_age_days) * 365 * 0.4;
  const engagementScore = (favourites_count / statuses_count) * 0.2;
  const recentActivityScore = recent_activity ? 0.1 : 0;

  return Math.min(
    followerScore + activityScore + engagementScore + recentActivityScore,
    100
  );
};
```

## ⚠️ 사용 시 주의사항

### API 제한사항
- **Rate Limiting**: API 호출 횟수 제한 확인 필요
- **데이터 정확성**: 실시간 데이터가 아닐 수 있음
- **계정 상태**: 비공개 계정이나 삭제된 계정 처리 필요

### 보안 고려사항
- API 키를 클라이언트 사이드에 노출하지 않기
- 환경 변수로 민감한 정보 관리
- CORS 설정 및 도메인 제한 설정

### 에러 처리
```javascript
const handleTwitterAPIError = (error) => {
  switch (error.status) {
    case 401:
      return 'API 인증 실패';
    case 403:
      return '접근 권한 없음 (비공개 계정)';
    case 404:
      return '사용자를 찾을 수 없음';
    case 429:
      return 'API 호출 제한 초과';
    case 500:
      return 'Twitter 서버 오류';
    default:
      return `알 수 없는 오류: ${error.message}`;
  }
};
```

## 📊 데이터 구조 예시

### 사용자 정보 응답
```json
{
  "id": "44196397",
  "name": "Elon Musk",
  "screen_name": "elonmusk",
  "followers_count": 120000000,
  "friends_count": 200,
  "statuses_count": 25000,
  "favourites_count": 15000,
  "created_at": "Tue Jun 02 20:12:29 +0000 2009",
  "verified": true,
  "profile_image_url": "https://..."
}
```

### 타임라인 응답
```json
[
  {
    "id": "1234567890",
    "text": "Tweet content here...",
    "created_at": "Wed Oct 25 20:12:29 +0000 2023",
    "retweet_count": 150,
    "favorite_count": 500,
    "user": { /* user object */ }
  }
]
```

## 🔗 관련 링크

- [RapidAPI Twitter API 문서](https://rapidapi.com/Glavier/api/twitter-api45/)
- [Twitter API 공식 문서](https://developer.twitter.com/en/docs)
- [Next.js API Routes 가이드](https://nextjs.org/docs/api-routes/introduction)

---

**마지막 업데이트**: 2025-01-28  
**작성자**: DeSpread Team  
**버전**: 1.0.0
