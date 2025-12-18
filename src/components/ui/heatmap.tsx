import { useMemo, type ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HeatmapData<T = unknown> {
  date: string; // yyyy-mm-dd
  count: number;
  meta?: T;
}

interface HeatmapProps<T = unknown> {
  data: HeatmapData<T>[];
  startDate: Date;
  endDate: Date;
  colors: string[];
  emptyColor?: string;
  cellSize?: number;
  cellGap?: number;
  getColorIndex?: (count: number, maxCount: number) => number;
  renderTooltip?: (date: string, count: number, meta?: T) => ReactNode;
  className?: string;
}

const DAYS_IN_WEEK = 7;
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getWeekStart(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  return result;
}

function defaultGetColorIndex(
  count: number,
  maxCount: number,
  colorsLength: number
): number {
  if (count === 0) return -1;
  if (maxCount === 0) return 0;
  const ratio = count / maxCount;
  return Math.min(Math.floor(ratio * colorsLength), colorsLength - 1);
}

function defaultRenderTooltip(date: string, count: number): ReactNode {
  const d = new Date(date);
  const formatted = d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return `${formatted}: ${count}`;
}

export function Heatmap<T = unknown>({
  data,
  startDate,
  endDate,
  colors,
  emptyColor = "#ebedf0",
  cellSize = 12,
  cellGap = 3,
  getColorIndex,
  renderTooltip = defaultRenderTooltip,
  className,
}: HeatmapProps<T>) {
  const { weeks, dataMap, maxCount, monthLabels } = useMemo(() => {
    // Build data map
    const map = new Map<string, { count: number; meta?: T }>();
    let max = 0;
    data.forEach((d) => {
      map.set(d.date, { count: d.count, meta: d.meta });
      if (d.count > max) max = d.count;
    });

    // Generate weeks
    const weekStart = getWeekStart(startDate);
    const weeksArr: Date[][] = [];
    const monthLabelArr: { label: string; weekIndex: number }[] = [];

    let currentDate = weekStart;
    let currentMonth = -1;

    while (currentDate <= endDate) {
      const week: Date[] = [];
      for (let i = 0; i < DAYS_IN_WEEK; i++) {
        week.push(new Date(currentDate));
        currentDate = addDays(currentDate, 1);
      }
      weeksArr.push(week);

      // Track month labels - use first day in range within this week
      const firstInRangeDay = week.find((d) => d >= startDate && d <= endDate);
      if (firstInRangeDay) {
        const month = firstInRangeDay.getMonth();
        if (month !== currentMonth) {
          currentMonth = month;
          monthLabelArr.push({
            label: MONTH_LABELS[month],
            weekIndex: weeksArr.length - 1,
          });
        }
      }
    }

    return {
      weeks: weeksArr,
      dataMap: map,
      maxCount: max,
      monthLabels: monthLabelArr,
    };
  }, [data, startDate, endDate]);

  const getCellColor = (date: Date): string => {
    const dateStr = formatDateStr(date);
    const entry = dataMap.get(dateStr);
    const count = entry?.count ?? 0;

    if (count === 0) return emptyColor;

    if (getColorIndex) {
      const idx = getColorIndex(count, maxCount);
      return colors[Math.min(idx, colors.length - 1)] ?? emptyColor;
    }

    const idx = defaultGetColorIndex(count, maxCount, colors.length);
    if (idx < 0) return emptyColor;
    return colors[idx];
  };

  const isInRange = (date: Date): boolean => {
    return date >= startDate && date <= endDate;
  };

  const totalWidth = weeks.length * (cellSize + cellGap);
  const weekdayLabelWidth = 28; // Width for weekday labels

  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn("relative", className)} style={{ minWidth: totalWidth + weekdayLabelWidth }}>
        <div className="flex">
          {/* Weekday labels column */}
          <div
            className="flex flex-col text-xs text-muted-foreground shrink-0"
            style={{ width: weekdayLabelWidth, marginTop: 18 }}
          >
            {WEEKDAY_LABELS.map((day, i) => (
              <div
                key={day}
                style={{ height: cellSize + cellGap }}
                className={cn(
                  "flex items-center justify-end pr-1",
                  i % 2 === 1 ? "opacity-0" : ""
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Month labels + Heatmap grid */}
          <div className="flex flex-col">
            {/* Month labels */}
            <div className="relative text-xs text-muted-foreground mb-1" style={{ height: 14 }}>
              {monthLabels.map(({ label, weekIndex }, i) => (
                <span
                  key={`${label}-${i}`}
                  className="absolute"
                  style={{
                    left: weekIndex * (cellSize + cellGap),
                  }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="flex" style={{ gap: cellGap }}>
            {weeks.map((week, weekIndex) => (
              <div
                key={weekIndex}
                className="flex flex-col"
                style={{ gap: cellGap }}
              >
                {week.map((date, dayIndex) => {
                  const dateStr = formatDateStr(date);
                  const entry = dataMap.get(dateStr);
                  const count = entry?.count ?? 0;
                  const meta = entry?.meta;
                  const inRange = isInRange(date);

                  if (!inRange) {
                    return (
                      <div
                        key={dayIndex}
                        style={{
                          width: cellSize,
                          height: cellSize,
                        }}
                      />
                    );
                  }

                  return (
                    <Tooltip key={dayIndex}>
                      <TooltipTrigger asChild>
                        <div
                          className="cursor-pointer transition-all hover:ring-2 hover:ring-foreground/20"
                          style={{
                            width: cellSize,
                            height: cellSize,
                            backgroundColor: getCellColor(date),
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs max-w-xs">
                        {renderTooltip(dateStr, count, meta)}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>Less</span>
          <div
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: emptyColor,
            }}
          />
          {colors.map((color, i) => (
            <div
              key={i}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: color,
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
