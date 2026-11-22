/*
 * ChartBox: a chart container. React must not draw the chart, charts.js draws into the div after it is on screen.
 *
 *   <ChartBox label="Savings over 12 months"
 *             draw={(el, still) => renderLine(el, { values: savings, labels: MONTHS, color: '#0F4C47', fmtAxis: fAx('M'), fmtTip: fTipM }, still)}
 *             deps={[savings]} />
 *
 * `deps` lists the data the chart depends on, so it redraws (with animation) when that data changes.
 * It also redraws, without animation, when the window width changes.
 */
import { useEffect, useRef } from 'react';
import { mountChart, unmountChart } from '../lib/charts.js';

export default function ChartBox({ draw, deps = [], label, className = '', style }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    mountChart(el, draw);
    return () => unmountChart(el);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return <div ref={ref} className={`chart ${className}`.trim()} role="img" aria-label={label} style={style} />;
}
