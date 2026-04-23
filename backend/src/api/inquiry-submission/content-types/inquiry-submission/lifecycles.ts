const ACTIVE_STATUSES = new Set(['in_review', 'waiting_reply', 'replied', 'closed'])

export default {
  async beforeCreate(event: any) {
    const data = event.params.data ?? {}
    const now = new Date().toISOString()
    if (!data.submittedAt) data.submittedAt = now
    if (!data.lastActionAt) data.lastActionAt = now
    if (!data.priority) data.priority = 'normal'
    if (!data.replyStatus) data.replyStatus = data.formType === 'restock' ? 'not_required' : 'pending'
    if (typeof data.spamFlag !== 'boolean') data.spamFlag = data.status === 'spam'
    if (!data.triageState) data.triageState = 'not_triaged'
    if (!data.slaState) data.slaState = 'not_started'
    if (!data.overdueState) data.overdueState = 'none'
    if (!data.escalationState) data.escalationState = 'none'
    if (!data.autoClassificationState) data.autoClassificationState = 'none'
    if (!data.templateReplyState) data.templateReplyState = 'none'
    if (!data.suggestedReplyState) data.suggestedReplyState = 'none'
    if (!data.assigneeState) data.assigneeState = 'none'
    if (!data.supportOpsVisibilityState) data.supportOpsVisibilityState = 'default'
    if (!data.supportOpsActionState) data.supportOpsActionState = 'triage_required'
    if (!data.attachmentCount) {
      const attachments = Array.isArray(data.attachments) ? data.attachments : []
      data.attachmentCount = attachments.length
    }
  },

  async beforeUpdate(event: any) {
    const data = event.params.data ?? {}
    const now = new Date().toISOString()
    data.lastActionAt = now

    if (typeof data.status === 'string' && ACTIVE_STATUSES.has(data.status) && !data.handledAt) {
      data.handledAt = now
    }

    if (data.status === 'replied' && !data.repliedAt) {
      data.repliedAt = now
      data.replyStatus = 'replied'
    }

    if (data.status === 'spam') {
      data.spamFlag = true
    }

    if (Array.isArray(data.attachments)) {
      data.attachmentCount = data.attachments.length
    }
  },
}
