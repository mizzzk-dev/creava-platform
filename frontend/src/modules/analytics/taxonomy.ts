export type EventType =
  | 'page_view'
  | 'section_view'
  | 'cta_click'
  | 'conversion'
  | 'state_change'
  | 'delivery_event'
  | 'support_event'
  | 'experiment_event'
  | 'ops_event'
  | 'security_event'
  | 'privacy_event'

export type EventCategory =
  | 'navigation'
  | 'commerce'
  | 'membership'
  | 'support'
  | 'notifications'
  | 'privacy'
  | 'security'
  | 'experimentation'
  | 'operations'

const EVENT_META: Record<string, { eventType: EventType; eventCategory: EventCategory }> = {
  page_view: { eventType: 'page_view', eventCategory: 'navigation' },
  section_view: { eventType: 'section_view', eventCategory: 'navigation' },
  cta_click: { eventType: 'cta_click', eventCategory: 'navigation' },
  nav_click: { eventType: 'cta_click', eventCategory: 'navigation' },
  hero_view: { eventType: 'section_view', eventCategory: 'navigation' },
  hero_cta_click: { eventType: 'cta_click', eventCategory: 'navigation' },
  header_nav_click: { eventType: 'cta_click', eventCategory: 'navigation' },
  footer_nav_click: { eventType: 'cta_click', eventCategory: 'navigation' },
  theme_toggle: { eventType: 'state_change', eventCategory: 'operations' },
  locale_switch: { eventType: 'state_change', eventCategory: 'operations' },
  form_submit_success: { eventType: 'conversion', eventCategory: 'membership' },
  login_success: { eventType: 'conversion', eventCategory: 'membership' },
  login_attempt: { eventType: 'conversion', eventCategory: 'membership' },
  sign_up_attempt: { eventType: 'conversion', eventCategory: 'membership' },
  sign_up_success: { eventType: 'conversion', eventCategory: 'membership' },
  member_gate_encounter: { eventType: 'state_change', eventCategory: 'membership' },
  join_page_view: { eventType: 'page_view', eventCategory: 'membership' },
  join_cta_click: { eventType: 'cta_click', eventCategory: 'membership' },
  cart_click: { eventType: 'cta_click', eventCategory: 'commerce' },
  view_item_list: { eventType: 'section_view', eventCategory: 'commerce' },
  view_item: { eventType: 'section_view', eventCategory: 'commerce' },
  select_item: { eventType: 'cta_click', eventCategory: 'commerce' },
  add_to_cart: { eventType: 'conversion', eventCategory: 'commerce' },
  remove_from_cart: { eventType: 'conversion', eventCategory: 'commerce' },
  view_cart: { eventType: 'section_view', eventCategory: 'commerce' },
  begin_checkout: { eventType: 'conversion', eventCategory: 'commerce' },
  purchase: { eventType: 'conversion', eventCategory: 'commerce' },
  help_center_search: { eventType: 'support_event', eventCategory: 'support' },
  article_view: { eventType: 'support_event', eventCategory: 'support' },
  article_helpful: { eventType: 'support_event', eventCategory: 'support' },
  article_not_helpful: { eventType: 'support_event', eventCategory: 'support' },
  contact_form_start: { eventType: 'support_event', eventCategory: 'support' },
  contact_form_confirm: { eventType: 'support_event', eventCategory: 'support' },
  contact_submit_success: { eventType: 'support_event', eventCategory: 'support' },
  contact_submit_fail: { eventType: 'support_event', eventCategory: 'support' },
  support_thread_view: { eventType: 'support_event', eventCategory: 'support' },
  handoff_to_human_start: { eventType: 'support_event', eventCategory: 'support' },
  support_cta_click: { eventType: 'support_event', eventCategory: 'support' },
  error_404_view: { eventType: 'state_change', eventCategory: 'operations' },
  error_500_view: { eventType: 'state_change', eventCategory: 'operations' },
  error_503_view: { eventType: 'state_change', eventCategory: 'operations' },
  error_page_cta_click: { eventType: 'cta_click', eventCategory: 'operations' },
  fallback_shown: { eventType: 'state_change', eventCategory: 'operations' },
  stale_content_fallback_shown: { eventType: 'state_change', eventCategory: 'operations' },
  notification_open: { eventType: 'delivery_event', eventCategory: 'notifications' },
  notification_click: { eventType: 'delivery_event', eventCategory: 'notifications' },
  support_search: { eventType: 'support_event', eventCategory: 'support' },
  privacy_consent_update: { eventType: 'privacy_event', eventCategory: 'privacy' },
  password_reset_complete: { eventType: 'security_event', eventCategory: 'security' },
  flag_dashboard_view: { eventType: 'ops_event', eventCategory: 'experimentation' },
  experiment_start: { eventType: 'experiment_event', eventCategory: 'experimentation' },
  experiment_pause: { eventType: 'experiment_event', eventCategory: 'experimentation' },
  experiment_complete: { eventType: 'experiment_event', eventCategory: 'experimentation' },
  experiment_stop: { eventType: 'experiment_event', eventCategory: 'experimentation' },
  experiment_assignment_logged: { eventType: 'experiment_event', eventCategory: 'experimentation' },
  exposure_event_logged: { eventType: 'experiment_event', eventCategory: 'experimentation' },
  experiment_decision_logged: { eventType: 'experiment_event', eventCategory: 'experimentation' },
}

export function inferEventMeta(eventName: string): { eventType: EventType; eventCategory: EventCategory } {
  return EVENT_META[eventName] ?? { eventType: 'state_change', eventCategory: 'operations' }
}
