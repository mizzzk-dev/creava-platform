import type { FAQItem, GuideItem, SourceSite } from '@/types'
import type { PublicStatusResponse } from '@/modules/status/api'

export type AssistantSessionState = 'idle' | 'active' | 'awaiting_input' | 'suggesting' | 'troubleshooting' | 'handing_off' | 'completed' | 'abandoned'
export type AssistantTurnState = 'listening' | 'retrieving' | 'guiding' | 'resolving' | 'handoff_ready'
export type AssistantIntentState = 'unknown' | 'account' | 'billing' | 'order' | 'fanclub' | 'event' | 'technical' | 'policy' | 'other'
export type SemanticRetrievalState = 'not_run' | 'results_found' | 'low_confidence' | 'no_results' | 'ambiguous'
export type RetrievalConfidenceState = 'low' | 'medium' | 'high'
export type TroubleshootingState = 'not_started' | 'guided' | 'blocked' | 'self_resolved' | 'failed' | 'escalated_to_human'
export type TroubleshootingStepState = 'none' | 'suggested' | 'in_progress' | 'completed' | 'skipped'
export type TroubleshootingOutcomeState = 'unknown' | 'fixed' | 'partial' | 'not_fixed'
export type HandoffState = 'not_needed' | 'suggested' | 'preparing' | 'submitted' | 'linked_to_case' | 'failed'
export type CasePrefillState = 'none' | 'partial' | 'prepared' | 'attached_to_case'
export type ConversationEffectivenessState = 'unknown' | 'self_resolved' | 'handoff_needed' | 'drop_off' | 'needs_knowledge_update'
export type ArticleSuggestionState = 'none' | 'suggested' | 'opened' | 'helpful' | 'not_helpful'
export type KnownIssueSuggestionState = 'none' | 'suggested' | 'opened' | 'matched'
export type AssistantFeedbackState = 'none' | 'positive' | 'negative'
export type AssistantFeedbackScoreState = 'unrated' | '1' | '2' | '3' | '4' | '5'
export type SearchState = 'idle' | 'typing' | 'searched'
export type SearchResultState = 'none' | 'results_found' | 'low_confidence' | 'no_results' | 'ambiguous'
export type KnowledgeGapState = 'none' | 'suspected' | 'confirmed'
export type ArticleEffectivenessState = 'unknown' | 'effective' | 'needs_update' | 'ineffective'

export interface ConversationalHelpSummary {
  helpAssistantSummary: string
  assistantSessionState: AssistantSessionState
  assistantTurnState: AssistantTurnState
  assistantIntentState: AssistantIntentState
  semanticRetrievalState: SemanticRetrievalState
  retrievalConfidenceState: RetrievalConfidenceState
  troubleshootingState: TroubleshootingState
  troubleshootingStepState: TroubleshootingStepState
  troubleshootingOutcomeState: TroubleshootingOutcomeState
  handoffState: HandoffState
  handoffReason: string
  casePrefillState: CasePrefillState
  conversationEffectivenessState: ConversationEffectivenessState
  articleSuggestionState: ArticleSuggestionState
  knownIssueSuggestionState: KnownIssueSuggestionState
  assistantFeedbackState: AssistantFeedbackState
  assistantFeedbackScoreState: AssistantFeedbackScoreState
  searchState: SearchState
  searchQueryState: string
  searchResultState: SearchResultState
  knowledgeGapState: KnowledgeGapState
  articleEffectivenessState: ArticleEffectivenessState
  assistantLastRetrievedAt?: string
  assistantLastSuggestedAt?: string
  assistantLastHandedOffAt?: string
}

export interface HelpKnowledgeCandidate {
  id: string
  type: 'faq' | 'guide' | 'known_issue'
  title: string
  summary: string
  category: string
  score: number
  slug: string
}

const intentKeywords: Array<{ intent: AssistantIntentState; words: string[] }> = [
  { intent: 'order', words: ['注文', '配送', '返金', '返品', 'shipping', 'delivery', 'refund'] },
  { intent: 'fanclub', words: ['ファンクラブ', 'membership', '会員', 'plan'] },
  { intent: 'billing', words: ['請求', '決済', 'payment', 'invoice', 'card'] },
  { intent: 'account', words: ['ログイン', '認証', 'password', 'account'] },
  { intent: 'technical', words: ['表示', 'error', '不具合', 'bug', '動かない'] },
  { intent: 'policy', words: ['規約', 'policy', 'privacy', 'legal'] },
  { intent: 'event', words: ['イベント', 'event', 'ticket'] },
]

export function detectAssistantIntent(query: string): AssistantIntentState {
  const lowered = query.toLowerCase()
  const matched = intentKeywords.find((pattern) => pattern.words.some((word) => lowered.includes(word.toLowerCase())))
  return matched?.intent ?? 'other'
}

function similarityScore(query: string, text: string): number {
  const q = query.trim().toLowerCase()
  if (!q) return 0
  const words = q.split(/\s+/).filter(Boolean)
  if (words.length === 0) return 0
  const lowered = text.toLowerCase()
  const hits = words.reduce((acc, word) => (lowered.includes(word) ? acc + 1 : acc), 0)
  return hits / words.length
}

export function retrieveKnowledgeCandidates(params: {
  query: string
  sourceSite: SourceSite
  category: string
  faqs: FAQItem[]
  guides: GuideItem[]
  statusSummary: PublicStatusResponse | null
}): HelpKnowledgeCandidate[] {
  const query = params.query.trim()
  if (!query) return []

  const faqCandidates = params.faqs
    .filter((item) => item.isPublic !== false)
    .filter((item) => item.sourceSite === 'all' || item.sourceSite === params.sourceSite)
    .filter((item) => params.category === 'all' || item.category === params.category || item.subcategory === params.category)
    .map((item) => ({
      id: `faq-${item.id}`,
      type: 'faq' as const,
      title: item.question,
      summary: item.answer,
      category: item.category,
      score: similarityScore(query, [item.question, item.answer, ...(item.tags ?? []), ...(item.keywords ?? [])].join(' ')),
      slug: '/faq',
    }))

  const guideCandidates = params.guides
    .filter((item) => item.sourceSite === 'all' || item.sourceSite === params.sourceSite)
    .filter((item) => params.category === 'all' || item.category === params.category)
    .map((item) => ({
      id: `guide-${item.id}`,
      type: 'guide' as const,
      title: item.title,
      summary: item.summary ?? '',
      category: item.category,
      score: similarityScore(query, [item.title, item.summary ?? '', item.body ?? '', ...(item.tags ?? [])].join(' ')),
      slug: `/support/guides/${item.slug}`,
    }))

  const knownIssueCandidates = (params.statusSummary?.activeIncidentCommunications ?? [])
    .filter((incident) => {
      const sourceSite = String((incident as Record<string, unknown>).sourceSite ?? 'all')
      return sourceSite === 'all' || sourceSite === params.sourceSite
    })
    .map((incident, index) => ({
      id: `known-${index}`,
      type: 'known_issue' as const,
      title: String((incident as Record<string, unknown>).title ?? 'Known issue'),
      summary: String((incident as Record<string, unknown>).summary ?? ''),
      category: String((incident as Record<string, unknown>).category ?? 'incident'),
      score: similarityScore(query, [String((incident as Record<string, unknown>).title ?? ''), String((incident as Record<string, unknown>).summary ?? ''), String((incident as Record<string, unknown>).statusState ?? '')].join(' ')),
      slug: '/status',
    }))

  return [...faqCandidates, ...guideCandidates, ...knownIssueCandidates]
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}

export function resolveSemanticRetrievalState(candidates: HelpKnowledgeCandidate[]): {
  semanticRetrievalState: SemanticRetrievalState
  retrievalConfidenceState: RetrievalConfidenceState
} {
  if (candidates.length === 0) return { semanticRetrievalState: 'no_results', retrievalConfidenceState: 'low' }
  const top = candidates[0]?.score ?? 0
  if (top >= 0.75) return { semanticRetrievalState: 'results_found', retrievalConfidenceState: 'high' }
  if (top >= 0.45) return { semanticRetrievalState: 'results_found', retrievalConfidenceState: 'medium' }
  if (candidates.length >= 2 && Math.abs((candidates[0]?.score ?? 0) - (candidates[1]?.score ?? 0)) < 0.1) {
    return { semanticRetrievalState: 'ambiguous', retrievalConfidenceState: 'low' }
  }
  return { semanticRetrievalState: 'low_confidence', retrievalConfidenceState: 'low' }
}

export function buildTroubleshootingSteps(intent: AssistantIntentState): string[] {
  const map: Record<AssistantIntentState, string[]> = {
    unknown: ['状況の再確認', '再現手順の整理', '必要ならサポートに引き継ぎ'],
    account: ['ログイン状態を確認', 'ブラウザ再読み込み', 'パスワード再設定を試す'],
    billing: ['決済手段の有効期限確認', '別決済手段で再試行', '請求明細スクリーンショット準備'],
    order: ['注文番号を確認', '配送ステータスを確認', '配送/返品ガイドの該当項目を試す'],
    fanclub: ['会員ステータス同期を確認', '会員限定ページ再ログイン', '権限反映の待機を試す'],
    event: ['対象イベントの状態ページ確認', '参加条件を再確認', '購入履歴と日時を手元に準備'],
    technical: ['ブラウザキャッシュ削除', '別端末/回線で再現確認', 'エラー画面の時刻を記録'],
    policy: ['該当規約ページの確認', 'FAQで補足ルール確認', '個別条件はサポートへ相談'],
    other: ['状況の再確認', 'FAQとガイドの候補を確認', '必要ならサポートに引き継ぎ'],
  }
  return map[intent]
}

export function buildCasePrefill(params: {
  sourceSite: SourceSite
  category: string
  query: string
  summary: ConversationalHelpSummary
  candidates: HelpKnowledgeCandidate[]
  attemptedSteps: string[]
}): { subject: string; message: string } {
  const primary = params.candidates[0]
  const title = primary ? `${primary.type.toUpperCase()}: ${primary.title}` : '会話型ヘルプからの引き継ぎ'
  return {
    subject: `[${params.sourceSite}] ${title}`,
    message: [
      '会話型ヘルプから引き継ぎます。',
      `カテゴリ: ${params.category}`,
      `ユーザーの質問: ${params.query}`,
      `assistantSessionState: ${params.summary.assistantSessionState}`,
      `semanticRetrievalState: ${params.summary.semanticRetrievalState}`,
      `retrievalConfidenceState: ${params.summary.retrievalConfidenceState}`,
      `troubleshootingState: ${params.summary.troubleshootingState}`,
      `handoffState: ${params.summary.handoffState}`,
      `提案した記事: ${params.candidates.map((item) => item.title).join(' / ') || '-'}`,
      `試した手順: ${params.attemptedSteps.join(' / ') || '-'}`,
      `handoffReason: ${params.summary.handoffReason || 'user_requested_human_support'}`,
    ].join('\n'),
  }
}
