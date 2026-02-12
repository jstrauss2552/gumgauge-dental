import React, { useState } from "react";
import { Link } from "react-router-dom";
import type { AppointmentEvent } from "../types/appointments";
import { formatDisplayDate } from "../utils/dateFormat";
import { timeToMinutes, minutesToTime } from "../utils/appointmentEvents";

type CalendarViewMode = "day" | "week" | "month";

const HOURS = Array.from({ length: 10 }, (_, i) => i + 8); // 8am-5pm
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekDates(centerDate: string): string[] {
  const d = new Date(centerDate + "T12:00:00");
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(start);
    x.setDate(start.getDate() + i);
    return x.toISOString().slice(0, 10);
  });
}

function getMonthDates(yearMonth: string): { date: string; isCurrentMonth: boolean }[] {
  const [y, m] = yearMonth.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const result: { date: string; isCurrentMonth: boolean }[] = [];
  const before = new Date(first);
  before.setDate(1 - startPad);
  for (let i = 0; i < startPad; i++) {
    const d = new Date(before);
    d.setDate(before.getDate() + i);
    result.push({ date: d.toISOString().slice(0, 10), isCurrentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    result.push({ date: `${y}-${String(m).padStart(2, "0")}-${String(i).padStart(2, "0")}`, isCurrentMonth: true });
  }
  const remaining = 42 - result.length;
  const nextStart = new Date(y, m, 1);
  for (let i = 0; i < remaining; i++) {
    const d = new Date(nextStart);
    d.setDate(nextStart.getDate() + i);
    result.push({ date: d.toISOString().slice(0, 10), isCurrentMonth: false });
  }
  return result;
}

interface AppointmentCalendarProps {
  events: AppointmentEvent[];
  currentDate: string; // YYYY-MM-DD
  viewMode: CalendarViewMode;
  onDateChange: (date: string) => void;
  onReschedule: (eventId: string, newDate: string, newTime: string) => void;
}

export default function AppointmentCalendar({
  events,
  currentDate,
  viewMode,
  onDateChange,
  onReschedule,
}: AppointmentCalendarProps) {
  const [draggedEvent, setDraggedEvent] = useState<AppointmentEvent | null>(null);
  const [dropTarget, setDropTarget] = useState<{ date: string; time: string } | null>(null);

  const handleDragStart = (e: React.DragEvent, event: AppointmentEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.setData("text/plain", event.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedEvent(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, date: string, time: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget({ date, time });
  };

  const handleDrop = (e: React.DragEvent, date: string, time: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) onReschedule(id, date, time);
    setDraggedEvent(null);
    setDropTarget(null);
  };

  const eventsOnDate = (date: string) => events.filter((ev) => ev.date === date).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  const prev = () => {
    const d = new Date(currentDate + "T12:00:00");
    if (viewMode === "day") d.setDate(d.getDate() - 1);
    else if (viewMode === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    onDateChange(d.toISOString().slice(0, 10));
  };

  const next = () => {
    const d = new Date(currentDate + "T12:00:00");
    if (viewMode === "day") d.setDate(d.getDate() + 1);
    else if (viewMode === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    onDateChange(d.toISOString().slice(0, 10));
  };

  const title =
    viewMode === "day"
      ? formatDisplayDate(currentDate)
      : viewMode === "week"
        ? (() => {
            const week = getWeekDates(currentDate);
            return `${formatDisplayDate(week[0])} – ${formatDisplayDate(week[6])}`;
          })()
        : (() => {
            const [y, m] = currentDate.split("-").map(Number);
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            return `${months[m - 1]} ${y}`;
          })();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={prev} className="px-3 py-1.5 border border-sky/60 rounded-lg text-sm font-medium">
            ←
          </button>
          <span className="font-medium text-navy min-w-[200px]">{title}</span>
          <button type="button" onClick={next} className="px-3 py-1.5 border border-sky/60 rounded-lg text-sm font-medium">
            →
          </button>
        </div>
      </div>

      {viewMode === "day" && (
        <div className="border border-sky/40 rounded-lg overflow-hidden bg-white">
          <div className="grid grid-cols-[60px_1fr]">
            <div className="bg-sky/5 border-b border-sky/30 p-1 text-xs text-navy/70 font-medium" />
            <div className="border-b border-sky/30 p-1 text-sm font-medium text-navy">{formatDisplayDate(currentDate)}</div>
            {HOURS.map((hour) => {
              const time = minutesToTime(hour * 60);
              const slotEvents = eventsOnDate(currentDate).filter((ev) => {
                const start = timeToMinutes(ev.time);
                const end = start + (ev.durationMinutes ?? 60);
                return start < (hour + 1) * 60 && end > hour * 60;
              });
              const isDrop = dropTarget?.date === currentDate && dropTarget?.time === time;
              return (
                <React.Fragment key={hour}>
                  <div className="bg-sky/5 border-b border-sky/20 p-1 text-xs text-navy/70">
                    {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                  </div>
                  <div
                    className={`min-h-[48px] border-b border-sky/20 p-1 ${isDrop ? "bg-green-100" : ""}`}
                    onDragOver={(e) => handleDragOver(e, currentDate, time)}
                    onDrop={(e) => handleDrop(e, currentDate, time)}
                  >
                    {slotEvents.map((ev) => (
                      <div
                        key={ev.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, ev)}
                        onDragEnd={handleDragEnd}
                        className={`mb-1 rounded px-2 py-1 text-xs border border-sky/40 bg-white cursor-grab active:cursor-grabbing ${draggedEvent?.id === ev.id ? "opacity-50" : ""}`}
                      >
                        <Link to={`/dashboard/patients/${ev.patientId}`} className="font-medium text-sky-dark hover:underline" onClick={(e) => e.stopPropagation()}>
                          {ev.patientName}
                        </Link>
                        <span className="text-navy/70 ml-1">{ev.time}</span>
                        {ev.durationMinutes && <span className="text-navy/50 ml-1">{ev.durationMinutes} min</span>}
                        {ev.room && <span className="ml-1 text-navy/50">· {ev.room}</span>}
                      </div>
                    ))}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === "week" && (
        <div className="border border-sky/40 rounded-lg overflow-hidden bg-white overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-sky/5">
                <th className="w-14 p-1 text-xs text-navy/70 font-medium border-r border-sky/30">Time</th>
                {getWeekDates(currentDate).map((d) => (
                  <th key={d} className="p-1 text-xs font-medium text-navy border-r border-sky/30 last:border-r-0">
                    {DAYS_OF_WEEK[new Date(d + "T12:00:00").getDay()]} {d.slice(8)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => {
                const time = minutesToTime(hour * 60);
                return (
                  <tr key={hour} className="border-t border-sky/20">
                    <td className="p-1 text-xs text-navy/70 border-r border-sky/30">
                      {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                    </td>
                    {getWeekDates(currentDate).map((d) => {
                      const slotEvents = eventsOnDate(d).filter((ev) => {
                        const start = timeToMinutes(ev.time);
                        const end = start + (ev.durationMinutes ?? 60);
                        return start < (hour + 1) * 60 && end > hour * 60;
                      });
                      const isDrop = dropTarget?.date === d && dropTarget?.time === time;
                      return (
                        <td
                          key={d}
                          className={`min-w-[100px] min-h-[40px] p-1 align-top border-r border-sky/20 last:border-r-0 ${isDrop ? "bg-green-100" : ""}`}
                          onDragOver={(e) => handleDragOver(e, d, time)}
                          onDrop={(e) => handleDrop(e, d, time)}
                        >
                          {slotEvents.map((ev) => (
                            <div
                              key={ev.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, ev)}
                              onDragEnd={handleDragEnd}
                              className={`rounded px-1 py-0.5 text-xs border border-sky/40 bg-white cursor-grab ${draggedEvent?.id === ev.id ? "opacity-50" : ""}`}
                            >
                              <Link to={`/dashboard/patients/${ev.patientId}`} className="text-sky-dark hover:underline" onClick={(e) => e.stopPropagation()}>
                                {ev.patientName}
                              </Link>
                              {ev.room && <span className="text-navy/50"> {ev.room}</span>}
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === "month" && (
        <div className="border border-sky/40 rounded-lg overflow-hidden bg-white">
          <div className="grid grid-cols-7">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="p-1 text-center text-xs font-medium text-navy bg-sky/5 border-b border-r border-sky/30 last:border-r-0">
                {d}
              </div>
            ))}
            {getMonthDates(currentDate.slice(0, 7)).map(({ date, isCurrentMonth }) => {
              const dayEvents = eventsOnDate(date);
              const isDrop = dropTarget?.date === date;
              return (
                <div
                  key={date}
                  className={`min-h-[80px] p-1 border-b border-r border-sky/20 last:border-r-0 ${!isCurrentMonth ? "bg-sky/5" : ""} ${isDrop ? "bg-green-100" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropTarget({ date, time: "09:00" });
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/plain");
                    if (id) onReschedule(id, date, "09:00");
                    setDropTarget(null);
                  }}
                >
                  <span className={`text-sm ${isCurrentMonth ? "text-navy" : "text-navy/50"}`}>{date.slice(8)}</span>
                  <div className="mt-0.5 space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, ev)}
                        onDragEnd={handleDragEnd}
                        className={`rounded px-1 py-0.5 text-xs border border-sky/40 bg-white cursor-grab truncate ${draggedEvent?.id === ev.id ? "opacity-50" : ""}`}
                        title={`${ev.patientName} ${ev.time}`}
                      >
                        <Link to={`/dashboard/patients/${ev.patientId}`} className="text-sky-dark hover:underline" onClick={(e) => e.stopPropagation()}>
                          {ev.time} {ev.patientName}
                        </Link>
                      </div>
                    ))}
                    {dayEvents.length > 3 && <span className="text-xs text-navy/60">+{dayEvents.length - 3} more</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-navy/60">Drag an appointment to reschedule. Drop on a day/time to update.</p>
    </div>
  );
}
