import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { caseId } = await request.json()
    if (!caseId) return NextResponse.json({ error: '사건 ID가 없습니다' }, { status: 400 })

    const supabase = await createServiceClient()

    const [{ data: c, error: fetchError }, { data: laws }] = await Promise.all([
      supabase.from('cases').select('*').eq('id', caseId).single(),
      supabase.from('laws').select('article_number, title, content, category').order('article_number'),
    ])

    if (fetchError || !c) return NextResponse.json({ error: '사건을 찾을 수 없습니다' }, { status: 404 })
    if (c.ai_verdict) return NextResponse.json({ verdict: c.ai_verdict, winner: c.ai_verdict_winner })

    const lawsSection = laws && laws.length > 0
      ? `\n\n【관계법정 법전】\n다음 조항들을 판결에 적극 활용하세요:\n${laws.map(l => `제${l.article_number}조(${l.title}): ${l.content}`).join('\n')}`
      : ''

    const systemPrompt = `당신은 '관계법정'의 AI 판사입니다.
연애, 우정, 가족 등 인간관계의 분쟁을 심판합니다.
공정하되 재치 있고, 직설적이되 배려 있게 판결합니다.
한국어로 판결하며, 법정 용어를 적절히 섞어 권위 있게 표현합니다.
판결문에는 관련 법조항을 "관계법정 제X조(죄명)에 의거하여..." 형식으로 반드시 인용하세요.${lawsSection}`

    const userPrompt = `다음 사건을 심판해주세요.

**사건명:** ${c.title}
**원고:** ${c.plaintiff_name}
**피고:** ${c.defendant_name}

**원고 측 진술:**
${c.plaintiff_statement}

${c.defendant_statement ? `**피고 측 진술:**\n${c.defendant_statement}` : '**피고 측 진술:** 없음 (원고 진술만으로 판단)'}

---

다음 형식으로 판결문을 작성해주세요:

**【판결 요지】**
(1-2문장으로 핵심 판단)

**【적용 법조】**
(이 사건과 관련된 관계법정 조항을 "제X조(죄명)에 의거하여..." 형식으로 인용)

**【사실 인정】**
(원고·피고 진술에서 인정되는 사실 관계)

**【판단 이유】**
(왜 이 결론에 이르렀는지 3-5문장)

**【최종 판결】**
원고 승 / 피고 승 / 무승부 중 하나를 선언하고, 판결 이유 한 줄 추가

**【재판장 조언】**
(양측 모두를 위한 건설적인 조언 1-2문장)

마지막 줄에 반드시 아래 형식으로 승자를 표시하세요:
WINNER: plaintiff | defendant | neutral`

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1200,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    })

    const fullText = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    const winnerMatch = fullText.match(/WINNER:\s*(plaintiff|defendant|neutral)/i)
    const winner = (winnerMatch?.[1]?.toLowerCase() ?? 'neutral') as 'plaintiff' | 'defendant' | 'neutral'
    const verdict = fullText.replace(/\nWINNER:.*$/im, '').trim()

    await supabase
      .from('cases')
      .update({ ai_verdict: verdict, ai_verdict_winner: winner })
      .eq('id', caseId)

    return NextResponse.json({ verdict, winner })
  } catch (error: unknown) {
    console.error('AI verdict error:', error)
    const msg = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
