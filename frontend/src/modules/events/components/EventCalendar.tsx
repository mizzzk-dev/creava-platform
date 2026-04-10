import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { detailPath } from '@/lib/routeConstants'
import { trackCtaClick } from '@/modules/analytics/tracking'
import type { Event } from '@/types'

interface EventCalendarProps {
  events: Event[]
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function eventSpansDay(event: Event, day: Date): boolean {
  if (!event.startAt) return false
  const start = new Date(event.startAt)
  const end = event.endAt ? new Date(event.endAt) : start
  // normalize to midnight
  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(day)
  dayEnd.setHours(23, 59, 59, 999)
  return start <= dayEnd && end >= dayStart
}

function getEventStatus(event: Event): 'upcoming' | 'now' | 'ended' {
  const now = new Date()
  const start = event.startAt ? new Date(event.startAt) : null
  const end = event.endAt ? new Date(event.endAt) : null
  if (end && now > end) return 'ended'
  if (start && now >= start) return 'now'
  return 'upcoming'
}

const STATUS_COLORS = {
  upcoming: 'bg-blue-500',
  now: 'bg-emerald-500',
  ended: 'bg-gray-400',
}

export default function EventCalendar({ events }: EventCalendarProps) {
  const { t, i18n } = useTranslation()
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const locale = i18n.resolvedLanguage ?? 'ja'

  const monthLabel = useMemo(
    () =>
      new Date(currentYear, currentMonth, 1).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
      }),
    [currentYear, currentMonth, locale],
  )

  const weekdayLabels = useMemo(() => {
    const days: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(2024, 0, i + 7) // 2024-01-07 is Sunday
      days.push(d.toLocaleDateString(locale, { weekday: 'short' }))
    }
    return days
  }, [locale])

  // Calendar grid: all days in the current month view (including leading/trailing blanks)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const startDow = firstDay.getDay() // 0 = Sunday
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

    const cells: Array<Date | null> = []
    for (let i = 0; i < startDow; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(currentYear, currentMonth, d))
    // pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [currentYear, currentMonth])

  const eventsForDay = (day: Date) => events.filter((e) => eventSpansDay(e, day))

  const selectedEvents = useMemo(
    () => (selectedDay ? eventsForDay(selectedDay) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDay, events],
  )

  const goToPrevMonth = () => {
    if (currentMonth === 0) { setCurrentYear((y) => y - 1); setCurrentMonth(11) }
    else setCurrentMonth((m) => m - 1)
    setSelectedDay(null)
    trackCtaClick('event_calendar', 'prev_month')
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) { setCurrentYear((y) => y + 1); setCurrentMonth(0) }
    else setCurrentMonth((m) => m + 1)
    setSelectedDay(null)
    trackCtaClick('event_calendar', 'next_month')
  }

  const handleDayClick = (day: Date) => {
    if (eventsForDay(day).length === 0) return
    setSelectedDay((prev) => (prev && isSameDay(prev, day) ? null : day))
    trackCtaClick('event_calendar', 'day_click', { date: day.toISOString().slice(0, 10) })
  }

  return (
    <div className="space-y-4">
      {/* ── Calendar header ── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goToPrevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition hover:border-gray-400 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
          aria-label={t('events.calendar.prevMonth', { defaultValue: '前の月' })}
        >
          ←
        </button>

        <h2 className="text-sm font-semibold tracking-wide text-gray-900 dark:text-gray-100">
          {monthLabel}
        </h2>

        <button
          type="button"
          onClick={goToNextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition hover:border-gray-400 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
          aria-label={t('events.calendar.nextMonth', { defaultValue: '次の月' })}
        >
          →
        </button>
      </div>

      {/* ── Weekday row ── */}
      <div className="grid grid-cols-7 text-center">
        {weekdayLabels.map((label, i) => (
          <div
            key={i}
            className={`py-1 font-mono text-[9px] uppercase tracking-widest ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* ── Day grid ── */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {calendarDays.map((day, idx) => {
          if (!day) {
            return <div key={`blank-${idx}`} className="bg-white dark:bg-gray-900/50 h-10 sm:h-12" />
          }

          const dayEvents = eventsForDay(day)
          const hasEvents = dayEvents.length > 0
          const isToday = isSameDay(day, today)
          const isSelected = selectedDay !== null && isSameDay(day, selectedDay)
          const isOtherMonth = day.getMonth() !== currentMonth

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => handleDayClick(day)}
              disabled={!hasEvents}
              className={`relative flex flex-col items-center justify-start gap-0.5 p-1.5 h-10 sm:h-12 transition-colors ${
                isOtherMonth
                  ? 'bg-gray-50 dark:bg-gray-900/30'
                  : 'bg-white dark:bg-gray-900'
              } ${
                isSelected
                  ? 'ring-2 ring-inset ring-gray-800 dark:ring-cyan-400'
                  : hasEvents
                    ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'
                    : 'cursor-default'
              }`}
              aria-label={day.toLocaleDateString(locale, { month: 'long', day: 'numeric' })}
            >
              <span
                className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium leading-none transition-colors ${
                  isToday
                    ? 'bg-gray-900 text-white dark:bg-cyan-400 dark:text-gray-900'
                    : isSelected
                      ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white'
                      : hasEvents
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-300 dark:text-gray-600'
                }`}
              >
                {day.getDate()}
              </span>
              {hasEvents && (
                <div className="flex gap-0.5">
                  {dayEvents.slice(0, 3).map((e, i) => (
                    <span
                      key={i}
                      className={`h-1 w-1 rounded-full ${STATUS_COLORS[getEventStatus(e)]}`}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-3 text-[10px] text-gray-400">
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{t('events.statusNow', { defaultValue: '開催中' })}</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />{t('events.statusUpcoming', { defaultValue: '予定' })}</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-gray-400" />{t('events.statusEnded', { defaultValue: '終了' })}</span>
      </div>

      {/* ── Selected day panel ── */}
      <AnimatePresence>
        {selectedDay && selectedEvents.length > 0 && (
          <motion.div
            key={selectedDay.toISOString()}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/60"
          >
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-gray-400">
              {selectedDay.toLocaleDateString(locale, { month: 'long', day: 'numeric', weekday: 'short' })}
            </p>
            <ul className="space-y-2">
              {selectedEvents.map((event) => {
                const status = getEventStatus(event)
                return (
                  <li key={event.id}>
                    <Link
                      to={detailPath.event(event.slug)}
                      onClick={() => trackCtaClick('event_calendar', 'event_detail_click', { slug: event.slug })}
                      className="group flex items-start gap-2.5 text-sm"
                    >
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_COLORS[status]}`} />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 transition-colors group-hover:text-gray-600 dark:text-gray-100 dark:group-hover:text-gray-300">
                          {event.title}
                          <span className="ml-1 opacity-0 transition-opacity group-hover:opacity-100">→</span>
                        </p>
                        {event.venue && (
                          <p className="mt-0.5 font-mono text-[11px] text-gray-400">@ {event.venue}</p>
                        )}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
