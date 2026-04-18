export type SourceSite = 'main' | 'store' | 'fc' | 'all'

export interface FormDefinition {
  formType: string
  formKey: string
  formTitle: Record<string, string>
  formDescription: Record<string, string>
  sourceSite: SourceSite
  isPublic: boolean
  requiresAuth: boolean
  fields: Array<Record<string, unknown>>
  confirmEnabled: boolean
  attachmentEnabled: boolean
  allowedMimeTypes: string[]
  maxFiles: number
  maxFileSize: number
  notificationTarget: string[]
  autoReplyEnabled: boolean
  successMessage: Record<string, string>
  failureMessage: Record<string, string>
  locale: string[]
  displayPriority: number
  isActive: boolean
  defaultCategory: string
  initialStatus?: string
  initialPriority?: string
}

const COMMON_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

export const DEFAULT_FORM_DEFINITIONS: FormDefinition[] = [
  {
    formType: 'contact',
    formKey: 'main-general-contact',
    formTitle: { ja: '一般お問い合わせ', en: 'General Contact', ko: '일반 문의' },
    formDescription: { ja: 'お仕事・コラボ・その他のお問い合わせはこちら。', en: 'Use this form for general inquiries.', ko: '일반 문의는 여기에서 접수합니다.' },
    sourceSite: 'main', isPublic: true, requiresAuth: false, fields: [], confirmEnabled: true, attachmentEnabled: true,
    allowedMimeTypes: COMMON_ALLOWED_MIME_TYPES, maxFiles: 5, maxFileSize: 10 * 1024 * 1024, notificationTarget: ['main-contact'], autoReplyEnabled: true,
    successMessage: { ja: 'お問い合わせを受け付けました。', en: 'Your inquiry has been submitted.', ko: '문의가 접수되었습니다.' },
    failureMessage: { ja: '送信に失敗しました。時間をおいて再試行してください。', en: 'Failed to submit. Please retry.', ko: '전송에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
    locale: ['ja', 'en', 'ko'], displayPriority: 10, isActive: true, defaultCategory: 'general', initialStatus: 'new', initialPriority: 'normal',
  },
  {
    formType: 'request',
    formKey: 'main-project-request',
    formTitle: { ja: '仕事依頼', en: 'Project Request', ko: '업무 의뢰' },
    formDescription: { ja: '見積もり・制作依頼・RFPの相談。', en: 'Quotes and project requests.', ko: '견적/제작 의뢰 접수.' },
    sourceSite: 'main', isPublic: true, requiresAuth: false, fields: [], confirmEnabled: true, attachmentEnabled: true,
    allowedMimeTypes: COMMON_ALLOWED_MIME_TYPES, maxFiles: 5, maxFileSize: 10 * 1024 * 1024, notificationTarget: ['main-request'], autoReplyEnabled: true,
    successMessage: { ja: '依頼を受け付けました。', en: 'Your request has been submitted.', ko: '의뢰가 접수되었습니다.' },
    failureMessage: { ja: '送信に失敗しました。', en: 'Failed to submit.', ko: '전송에 실패했습니다.' },
    locale: ['ja', 'en', 'ko'], displayPriority: 20, isActive: true, defaultCategory: 'project_request', initialStatus: 'in_review', initialPriority: 'high',
  },
  {
    formType: 'collaboration',
    formKey: 'main-collaboration',
    formTitle: { ja: 'コラボ依頼', en: 'Collaboration Request', ko: '콜라보 제안' },
    formDescription: { ja: 'コラボ企画の提案はこちら。', en: 'Submit collaboration proposals.', ko: '콜라보 제안을 접수합니다.' },
    sourceSite: 'main', isPublic: true, requiresAuth: false, fields: [], confirmEnabled: true, attachmentEnabled: true,
    allowedMimeTypes: COMMON_ALLOWED_MIME_TYPES, maxFiles: 5, maxFileSize: 10 * 1024 * 1024, notificationTarget: ['main-collaboration'], autoReplyEnabled: true,
    successMessage: { ja: 'コラボ依頼を受け付けました。', en: 'Collaboration request submitted.', ko: '콜라보 요청이 접수되었습니다.' },
    failureMessage: { ja: '送信に失敗しました。', en: 'Failed to submit.', ko: '전송에 실패했습니다.' },
    locale: ['ja', 'en', 'ko'], displayPriority: 30, isActive: true, defaultCategory: 'collaboration', initialStatus: 'in_review', initialPriority: 'high',
  },
  {
    formType: 'event',
    formKey: 'main-event-contact',
    formTitle: { ja: 'イベント関連問い合わせ', en: 'Event Inquiry', ko: '이벤트 문의' },
    formDescription: { ja: 'イベント出演・参加・運営に関する問い合わせ。', en: 'Event related inquiries.', ko: '이벤트 관련 문의.' },
    sourceSite: 'main', isPublic: true, requiresAuth: false, fields: [], confirmEnabled: true, attachmentEnabled: false,
    allowedMimeTypes: [], maxFiles: 0, maxFileSize: 0, notificationTarget: ['main-event'], autoReplyEnabled: true,
    successMessage: { ja: 'イベント問い合わせを受け付けました。', en: 'Event inquiry submitted.', ko: '이벤트 문의가 접수되었습니다.' },
    failureMessage: { ja: '送信に失敗しました。', en: 'Failed to submit.', ko: '전송에 실패했습니다.' },
    locale: ['ja', 'en', 'ko'], displayPriority: 40, isActive: true, defaultCategory: 'event',
  },
  {
    formType: 'store_support',
    formKey: 'store-support',
    formTitle: { ja: 'ストア問い合わせ', en: 'Store Support', ko: '스토어 문의' },
    formDescription: { ja: '商品・注文・配送・返品について。', en: 'Product/order/shipping support.', ko: '상품/주문/배송 문의.' },
    sourceSite: 'store', isPublic: true, requiresAuth: false, fields: [], confirmEnabled: true, attachmentEnabled: true,
    allowedMimeTypes: COMMON_ALLOWED_MIME_TYPES, maxFiles: 3, maxFileSize: 5 * 1024 * 1024, notificationTarget: ['store-support'], autoReplyEnabled: true,
    successMessage: { ja: 'ストア問い合わせを受け付けました。', en: 'Store inquiry submitted.', ko: '스토어 문의가 접수되었습니다.' },
    failureMessage: { ja: '送信に失敗しました。', en: 'Failed to submit.', ko: '전송에 실패했습니다.' },
    locale: ['ja', 'en', 'ko'], displayPriority: 50, isActive: true, defaultCategory: 'order',
  },
  {
    formType: 'fc_support',
    formKey: 'fanclub-support',
    formTitle: { ja: 'FC問い合わせ', en: 'Fanclub Support', ko: '팬클럽 문의' },
    formDescription: { ja: '会員登録・決済・特典・コンテンツ関連。', en: 'Membership and fanclub support.', ko: '회원/결제/혜택 문의.' },
    sourceSite: 'fc', isPublic: true, requiresAuth: false, fields: [], confirmEnabled: true, attachmentEnabled: false,
    allowedMimeTypes: [], maxFiles: 0, maxFileSize: 0, notificationTarget: ['fc-support'], autoReplyEnabled: true,
    successMessage: { ja: 'FC問い合わせを受け付けました。', en: 'Fanclub inquiry submitted.', ko: '팬클럽 문의가 접수되었습니다.' },
    failureMessage: { ja: '送信に失敗しました。', en: 'Failed to submit.', ko: '전송에 실패했습니다.' },
    locale: ['ja', 'en', 'ko'], displayPriority: 60, isActive: true, defaultCategory: 'membership',
  },
]

export function mergeWithDefaults(definitions: FormDefinition[] = []): FormDefinition[] {
  const merged = new Map<string, FormDefinition>()
  for (const def of DEFAULT_FORM_DEFINITIONS) merged.set(def.formKey, def)
  for (const def of definitions) {
    if (!def?.formKey) continue
    merged.set(def.formKey, { ...merged.get(def.formKey), ...def } as FormDefinition)
  }
  return Array.from(merged.values()).filter((def) => def.isActive).sort((a, b) => a.displayPriority - b.displayPriority)
}

export function selectFormDefinition(formType: string, sourceSite: string, definitions: FormDefinition[]): FormDefinition | null {
  const normalizedSite = sourceSite === 'main' || sourceSite === 'store' || sourceSite === 'fc' ? sourceSite : 'unknown'
  return definitions.find((def) => def.formType === formType && (def.sourceSite === normalizedSite || def.sourceSite === 'all'))
    ?? definitions.find((def) => def.formType === formType)
    ?? null
}
