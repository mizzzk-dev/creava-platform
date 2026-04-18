import { getSourceSite } from './submit'

export type FieldType = 'text' | 'textarea' | 'email' | 'tel' | 'select' | 'radio' | 'checkbox' | 'file' | 'consent' | 'hidden'

export interface FormFieldDefinition {
  fieldType: FieldType
  name: string
  label: Record<string, string>
  placeholder?: Record<string, string>
  required: boolean
  validationRule?: 'email' | 'min10'
  helperText?: Record<string, string>
  options?: Array<{ value: string; label: Record<string, string> }>
  visibilityCondition?: string
  order: number
}

export interface FormDefinition {
  formType: string
  formKey: string
  formTitle: Record<string, string>
  formDescription: Record<string, string>
  sourceSite: 'main' | 'store' | 'fc' | 'all'
  isPublic: boolean
  requiresAuth: boolean
  fields: FormFieldDefinition[]
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
}

const commonFields: FormFieldDefinition[] = [
  { fieldType: 'text', name: 'name', label: { ja: 'お名前', en: 'Name', ko: '이름' }, required: true, order: 10 },
  { fieldType: 'email', name: 'email', label: { ja: 'メールアドレス', en: 'Email', ko: '이메일' }, required: true, validationRule: 'email', order: 20 },
  { fieldType: 'tel', name: 'phone', label: { ja: '電話番号', en: 'Phone', ko: '전화번호' }, required: false, order: 30 },
]

export const FALLBACK_FORM_DEFINITIONS: FormDefinition[] = [
  {
    formType: 'contact', formKey: 'main-general-contact', formTitle: { ja: '一般お問い合わせ', en: 'General Contact', ko: '일반 문의' },
    formDescription: { ja: 'お仕事・コラボ・その他のご連絡はこちら。', en: 'Use this for general contact.', ko: '일반 문의를 접수합니다.' },
    sourceSite: 'main', isPublic: true, requiresAuth: false,
    fields: [...commonFields, { fieldType: 'text', name: 'subject', label: { ja: '件名', en: 'Subject', ko: '제목' }, required: true, order: 40 }, { fieldType: 'textarea', name: 'message', label: { ja: '本文', en: 'Message', ko: '내용' }, required: true, validationRule: 'min10', order: 50 }, { fieldType: 'consent', name: 'policyAgree', label: { ja: 'プライバシーポリシーと利用規約に同意する', en: 'Agree to policy and terms', ko: '개인정보 및 약관 동의' }, required: true, order: 90 }],
    confirmEnabled: true, attachmentEnabled: true, allowedMimeTypes: [], maxFiles: 5, maxFileSize: 10 * 1024 * 1024, notificationTarget: ['main-contact'], autoReplyEnabled: true,
    successMessage: { ja: 'お問い合わせを受け付けました。', en: 'Submitted successfully.', ko: '문의가 접수되었습니다.' },
    failureMessage: { ja: '送信に失敗しました。時間をおいて再試行してください。', en: 'Submission failed.', ko: '전송에 실패했습니다.' },
    locale: ['ja', 'en', 'ko'], displayPriority: 10, isActive: true, defaultCategory: 'general',
  },
  {
    formType: 'request', formKey: 'main-project-request', formTitle: { ja: '仕事依頼', en: 'Project Request', ko: '업무 의뢰' },
    formDescription: { ja: '制作依頼・見積り相談。', en: 'Production request and quote.', ko: '제작/견적 문의.' }, sourceSite: 'main', isPublic: true, requiresAuth: false,
    fields: [...commonFields, { fieldType: 'text', name: 'companyOrOrganization', label: { ja: '会社名・組織名', en: 'Company / Organization', ko: '회사 / 조직' }, required: false, order: 35 }, { fieldType: 'select', name: 'requestType', label: { ja: '依頼種別', en: 'Request Type', ko: '의뢰 종류' }, required: true, options: [{ value: 'video', label: { ja: '映像', en: 'Video', ko: '영상' } }, { value: 'photo', label: { ja: '写真', en: 'Photo', ko: '사진' } }, { value: 'music', label: { ja: '音楽', en: 'Music', ko: '음악' } }, { value: 'web', label: { ja: 'Web', en: 'Web', ko: '웹' } }, { value: 'other', label: { ja: 'その他', en: 'Other', ko: '기타' } }], order: 40 }, { fieldType: 'textarea', name: 'message', label: { ja: '依頼詳細', en: 'Details', ko: '상세 내용' }, required: true, validationRule: 'min10', order: 50 }, { fieldType: 'text', name: 'budget', label: { ja: '予算', en: 'Budget', ko: '예산' }, required: false, order: 60 }, { fieldType: 'text', name: 'deadline', label: { ja: '納期', en: 'Deadline', ko: '마감일' }, required: false, order: 70 }, { fieldType: 'consent', name: 'policyAgree', label: { ja: 'プライバシーポリシーと利用規約に同意する', en: 'Agree to policy and terms', ko: '개인정보 및 약관 동의' }, required: true, order: 90 }],
    confirmEnabled: true, attachmentEnabled: true, allowedMimeTypes: [], maxFiles: 5, maxFileSize: 10 * 1024 * 1024, notificationTarget: ['main-request'], autoReplyEnabled: true,
    successMessage: { ja: '依頼を受け付けました。', en: 'Request submitted.', ko: '의뢰가 접수되었습니다.' },
    failureMessage: { ja: '送信に失敗しました。', en: 'Submission failed.', ko: '전송에 실패했습니다.' },
    locale: ['ja', 'en', 'ko'], displayPriority: 20, isActive: true, defaultCategory: 'project_request',
  },
  {
    formType: 'collaboration', formKey: 'main-collaboration', formTitle: { ja: 'コラボ依頼', en: 'Collaboration Request', ko: '콜라보 요청' },
    formDescription: { ja: 'コラボ企画の相談', en: 'Collaboration proposals.', ko: '콜라보 제안 문의' }, sourceSite: 'main', isPublic: true, requiresAuth: false,
    fields: [...commonFields, { fieldType: 'text', name: 'subject', label: { ja: '企画名', en: 'Proposal Title', ko: '제안명' }, required: true, order: 40 }, { fieldType: 'textarea', name: 'message', label: { ja: '提案内容', en: 'Proposal Detail', ko: '제안 내용' }, required: true, validationRule: 'min10', order: 50 }, { fieldType: 'consent', name: 'policyAgree', label: { ja: '同意する', en: 'Agree', ko: '동의' }, required: true, order: 90 }],
    confirmEnabled: true, attachmentEnabled: true, allowedMimeTypes: [], maxFiles: 5, maxFileSize: 10 * 1024 * 1024, notificationTarget: ['main-collaboration'], autoReplyEnabled: true,
    successMessage: { ja: 'コラボ依頼を受け付けました。', en: 'Submitted.', ko: '접수되었습니다.' }, failureMessage: { ja: '送信に失敗しました。', en: 'Failed.', ko: '실패했습니다.' },
    locale: ['ja', 'en', 'ko'], displayPriority: 30, isActive: true, defaultCategory: 'collaboration',
  },
  {
    formType: 'event', formKey: 'main-event-contact', formTitle: { ja: 'イベント関連問い合わせ', en: 'Event Inquiry', ko: '이벤트 문의' },
    formDescription: { ja: 'イベントに関する問い合わせ', en: 'Event related inquiry', ko: '이벤트 관련 문의' }, sourceSite: 'main', isPublic: true, requiresAuth: false,
    fields: [...commonFields, { fieldType: 'text', name: 'subject', label: { ja: 'イベント名', en: 'Event Name', ko: '이벤트명' }, required: true, order: 40 }, { fieldType: 'textarea', name: 'message', label: { ja: 'お問い合わせ内容', en: 'Message', ko: '문의 내용' }, required: true, validationRule: 'min10', order: 50 }, { fieldType: 'consent', name: 'policyAgree', label: { ja: '同意する', en: 'Agree', ko: '동의' }, required: true, order: 90 }],
    confirmEnabled: true, attachmentEnabled: false, allowedMimeTypes: [], maxFiles: 0, maxFileSize: 0, notificationTarget: ['main-event'], autoReplyEnabled: true,
    successMessage: { ja: 'イベント問い合わせを受け付けました。', en: 'Submitted.', ko: '접수되었습니다.' }, failureMessage: { ja: '送信に失敗しました。', en: 'Failed.', ko: '실패했습니다.' },
    locale: ['ja', 'en', 'ko'], displayPriority: 40, isActive: true, defaultCategory: 'event',
  },
]

function getStrapiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_STRAPI_API_URL as string | undefined
  if (!baseUrl) throw new Error('VITE_STRAPI_API_URL is not set')
  return baseUrl.replace(/\/$/, '')
}

export async function fetchFormDefinitions(locale: string): Promise<FormDefinition[]> {
  const sourceSite = getSourceSite()
  try {
    const res = await fetch(`${getStrapiBaseUrl()}/api/form-definitions/public?sourceSite=${sourceSite}&locale=${locale}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as { data?: FormDefinition[] }
    const rows = Array.isArray(json.data) ? json.data : []
    if (rows.length > 0) return rows
  } catch {
    // fallback
  }

  return FALLBACK_FORM_DEFINITIONS.filter((item) => item.isActive && item.isPublic && (item.sourceSite === sourceSite || item.sourceSite === 'all'))
}
