"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

const ITEM_HEIGHT = 40;
const VISIBLE_ROWS = 5;
const CENTER_OFFSET = ITEM_HEIGHT * Math.floor(VISIBLE_ROWS / 2);
const DATE_HORIZON_DAYS = 120;

type IosDateTimePickerProps = {
  id: string;
  name: string;
  min: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  required?: boolean;
};

type WheelColumnProps<T extends string | number> = {
  idPrefix: string;
  label: string;
  items: T[];
  value: T;
  format: (item: T) => string;
  disabled?: boolean;
  onChange: (next: T) => void;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function parseLocalDateTime(value: string): Date | null {
  if (!value) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const [, y, m, d, h, min] = match;
  const date = new Date(
    Number(y),
    Number(m) - 1,
    Number(d),
    Number(h),
    Number(min),
    0,
    0,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

function toLocalDateTimeValue(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function civilKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatDateOption(date: Date) {
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(date)
    .replace(".", "");
  const day = new Intl.DateTimeFormat("pt-BR", { day: "numeric" }).format(date);
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(date)
    .replace(".", "");
  return `${weekday} ${day} ${month}`;
}

function formatSummary(date: Date) {
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(date)
    .replace(".", "");
  const day = new Intl.DateTimeFormat("pt-BR", { day: "numeric" }).format(date);
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(date)
    .replace(".", "");
  return `${weekday}, ${day} ${month} · ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function clampToMin(date: Date, minDate: Date) {
  return date.getTime() < minDate.getTime() ? new Date(minDate) : date;
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="4.5"
        width="14"
        height="12"
        rx="2.2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M3 8h14M7 2.5v3M13 2.5v3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
      <path
        d="M5.25 7.5 10 12.25 14.75 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WheelColumn<T extends string | number>({
  idPrefix,
  label,
  items,
  value,
  format,
  disabled,
  onChange,
}: WheelColumnProps<T>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    origin: number;
    moved: boolean;
  } | null>(null);
  const skipClick = useRef(false);
  const selectedIndex = Math.max(0, items.indexOf(value));
  const selectedIndexRef = useRef(selectedIndex);
  const itemsRef = useRef(items);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const visualIndex = selectedIndex - offset / ITEM_HEIGHT;
  const translateY = CENTER_OFFSET + offset - selectedIndex * ITEM_HEIGHT;

  function clampIndex(index: number, length: number) {
    return Math.min(length - 1, Math.max(0, index));
  }

  function commitIndex(index: number) {
    const list = itemsRef.current;
    const nextIndex = clampIndex(index, list.length);
    const next = list[nextIndex];
    offsetRef.current = 0;
    setOffset(0);
    setDragging(false);
    if (next !== undefined && next !== value) {
      onChange(next);
    }
  }

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
    itemsRef.current = items;
  }, [selectedIndex, items]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || disabled) {
      return;
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      event.stopPropagation();
      const list = itemsRef.current;
      if (list.length === 0 || dragRef.current) {
        return;
      }
      const direction = event.deltaY > 0 ? 1 : event.deltaY < 0 ? -1 : 0;
      if (direction === 0) {
        return;
      }
      const nextIndex = clampIndex(
        selectedIndexRef.current + direction,
        list.length,
      );
      const next = list[nextIndex];
      offsetRef.current = 0;
      setOffset(0);
      setDragging(false);
      if (next !== undefined && next !== value) {
        onChange(next);
      }
    }

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [disabled, onChange, value]);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || event.button !== 0) {
      return;
    }
    event.preventDefault();
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      origin: offsetRef.current,
      moved: false,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    const delta = event.clientY - drag.startY;
    if (Math.abs(delta) > 3) {
      drag.moved = true;
    }
    const currentSelected = selectedIndexRef.current;
    const length = itemsRef.current.length;
    const minOffset = (currentSelected - (length - 1)) * ITEM_HEIGHT;
    const maxOffset = currentSelected * ITEM_HEIGHT;
    const next = Math.min(maxOffset, Math.max(minOffset, drag.origin + delta));
    offsetRef.current = next;
    setOffset(next);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    skipClick.current = drag.moved;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    commitIndex(
      Math.round(selectedIndexRef.current - offsetRef.current / ITEM_HEIGHT),
    );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const delta = event.key === "ArrowUp" ? -1 : 1;
      commitIndex(selectedIndex + delta);
    }
  }

  return (
    <div
      ref={rootRef}
      className="ios-dt__column"
      role="listbox"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-activedescendant={`${idPrefix}-${String(value)}`}
      data-lenis-prevent
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className={
          dragging ? "ios-dt__track ios-dt__track--dragging" : "ios-dt__track"
        }
        style={{ transform: `translate3d(0, ${translateY}px, 0)` }}
      >
        {items.map((item, index) => {
          const distance = Math.abs(index - visualIndex);
          const active = Math.round(visualIndex) === index;
          return (
            <div
              key={String(item)}
              id={`${idPrefix}-${String(item)}`}
              role="option"
              aria-selected={item === value}
              className={
                active ? "ios-dt__item ios-dt__item--active" : "ios-dt__item"
              }
              style={{
                opacity: Math.max(0.18, 1 - distance * 0.32),
                transform: `scale(${Math.max(0.8, 1 - distance * 0.07)})`,
              }}
              onClick={() => {
                if (disabled || skipClick.current) {
                  skipClick.current = false;
                  return;
                }
                commitIndex(index);
              }}
            >
              {format(item)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function IosDateTimePicker({
  id,
  name,
  min,
  value,
  onChange,
  disabled = false,
  required = false,
}: IosDateTimePickerProps) {
  const panelId = useId();
  const wheelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const [fallbackMin] = useState(() => new Date(Date.now() + 60_000));
  const minDate = useMemo(() => {
    return parseLocalDateTime(min) ?? fallbackMin;
  }, [min, fallbackMin]);

  const dateOptions = useMemo(() => {
    const start = startOfLocalDay(minDate);
    return Array.from({ length: DATE_HORIZON_DAYS }, (_, index) =>
      addDays(start, index),
    );
  }, [minDate]);

  const selectedDate = useMemo(() => {
    const parsed = parseLocalDateTime(value);
    if (!parsed) {
      return null;
    }
    return clampToMin(parsed, minDate);
  }, [value, minDate]);

  const selectedDayKey = selectedDate
    ? civilKey(selectedDate)
    : civilKey(minDate);
  const selectedHour = selectedDate?.getHours() ?? minDate.getHours();
  const selectedMinute = selectedDate?.getMinutes() ?? minDate.getMinutes();

  const hourOptions = useMemo(() => {
    const day = dateOptions.find((d) => civilKey(d) === selectedDayKey);
    if (!day) {
      return Array.from({ length: 24 }, (_, h) => h);
    }
    const isMinDay = civilKey(day) === civilKey(minDate);
    const startHour = isMinDay ? minDate.getHours() : 0;
    return Array.from({ length: 24 - startHour }, (_, i) => startHour + i);
  }, [dateOptions, selectedDayKey, minDate]);

  const minuteOptions = useMemo(() => {
    const day = dateOptions.find((d) => civilKey(d) === selectedDayKey);
    if (!day) {
      return Array.from({ length: 60 }, (_, m) => m);
    }
    const isMinDay = civilKey(day) === civilKey(minDate);
    const isMinHour = isMinDay && selectedHour === minDate.getHours();
    const startMinute = isMinHour ? minDate.getMinutes() : 0;
    return Array.from({ length: 60 - startMinute }, (_, i) => startMinute + i);
  }, [dateOptions, selectedDayKey, selectedHour, minDate]);

  const emit = useCallback(
    (dayKey: string, hour: number, minute: number) => {
      const [y, m, d] = dayKey.split("-").map(Number);
      const next = clampToMin(
        new Date(y, m - 1, d, hour, minute, 0, 0),
        minDate,
      );
      const nextValue = toLocalDateTimeValue(next);
      if (nextValue !== value) {
        onChange(nextValue);
      }
    },
    [minDate, onChange, value],
  );

  useEffect(() => {
    if (!value) {
      return;
    }
    const parsed = parseLocalDateTime(value);
    if (!parsed) {
      return;
    }
    const clamped = toLocalDateTimeValue(clampToMin(parsed, minDate));
    if (clamped !== value) {
      onChange(clamped);
    }
  }, [value, minDate, onChange]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function ensureValue() {
    if (!value) {
      onChange(toLocalDateTimeValue(minDate));
    }
  }

  function openPicker() {
    if (disabled) {
      return;
    }
    ensureValue();
    setOpen(true);
  }

  function clearValue() {
    onChange("");
    setOpen(false);
  }

  const safeHour = hourOptions.includes(selectedHour)
    ? selectedHour
    : (hourOptions[0] ?? 0);
  const safeMinute = minuteOptions.includes(selectedMinute)
    ? selectedMinute
    : (minuteOptions[0] ?? 0);

  const summary = selectedDate
    ? formatSummary(selectedDate)
    : "Escolher data e hora";

  return (
    <div className="ios-dt" ref={rootRef}>
      <input
        type="hidden"
        id={id}
        name={name}
        value={value}
        required={required}
      />

      {open ? (
        <div
          id={panelId}
          className="ios-dt__panel"
          role="dialog"
          aria-label="Selecionar data e hora"
          data-lenis-prevent
        >
          <button
            type="button"
            className="ios-dt__header"
            disabled={disabled}
            aria-expanded="true"
            aria-controls={panelId}
            onClick={() => setOpen(false)}
          >
            <span className="ios-dt__trigger-icon">
              <CalendarIcon />
            </span>
            <span className="ios-dt__trigger-text">{summary}</span>
            <span className="ios-dt__trigger-chevron ios-dt__trigger-chevron--open">
              <ChevronIcon />
            </span>
          </button>

          <div className="ios-dt__wheels">
            <div className="ios-dt__highlight" aria-hidden="true" />
            <div className="ios-dt__fade ios-dt__fade--top" aria-hidden="true" />
            <div
              className="ios-dt__fade ios-dt__fade--bottom"
              aria-hidden="true"
            />

            <WheelColumn
              idPrefix={`${wheelId}-date`}
              label="Data"
              items={dateOptions.map(civilKey)}
              value={selectedDayKey}
              format={(key) => {
                const date = dateOptions.find((d) => civilKey(d) === key);
                return date ? formatDateOption(date) : key;
              }}
              disabled={disabled}
              onChange={(dayKey) => {
                emit(dayKey, safeHour, safeMinute);
              }}
            />

            <WheelColumn
              idPrefix={`${wheelId}-hour`}
              label="Hora"
              items={hourOptions}
              value={safeHour}
              format={pad2}
              disabled={disabled}
              onChange={(hour) => {
                emit(selectedDayKey, hour, safeMinute);
              }}
            />

            <WheelColumn
              idPrefix={`${wheelId}-minute`}
              label="Minuto"
              items={minuteOptions}
              value={safeMinute}
              format={pad2}
              disabled={disabled}
              onChange={(minute) => {
                emit(selectedDayKey, safeHour, minute);
              }}
            />
          </div>

          <div className="ios-dt__actions">
            <button
              type="button"
              className="ios-dt__action"
              disabled={disabled || !value}
              onClick={clearValue}
            >
              Limpar
            </button>
            <button
              type="button"
              className="ios-dt__action ios-dt__action--primary"
              disabled={disabled}
              onClick={() => setOpen(false)}
            >
              OK
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="ios-dt__trigger"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded="false"
          aria-controls={panelId}
          onClick={openPicker}
        >
          <span className="ios-dt__trigger-icon">
            <CalendarIcon />
          </span>
          <span className="ios-dt__trigger-text">{summary}</span>
          <span className="ios-dt__trigger-chevron">
            <ChevronIcon />
          </span>
        </button>
      )}
    </div>
  );
}
