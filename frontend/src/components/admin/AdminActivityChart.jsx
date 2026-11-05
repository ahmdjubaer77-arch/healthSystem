const SERIES = [
  { key: 'users', label: 'New users', color: '#0f766e' },
  { key: 'bloodRequests', label: 'Blood requests', color: '#f59e0b' },
  { key: 'emergencyRequests', label: 'Emergency requests', color: '#e11d48' },
  { key: 'complaints', label: 'Complaints', color: '#6366f1' },
]

const CHART = { width: 680, height: 224, left: 38, right: 12, top: 12, bottom: 34 }

function formatDay(value) {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date)
}

function AdminActivityChart({ activity = [] }) {
  const rows = Array.isArray(activity) ? activity : []
  const values = rows.map((row) => SERIES.reduce((total, series) => total + Math.max(0, Number(row[series.key]) || 0), 0))
  const maxValue = Math.max(1, ...values)
  const plotHeight = CHART.height - CHART.top - CHART.bottom
  const plotWidth = CHART.width - CHART.left - CHART.right
  const slotWidth = rows.length ? plotWidth / rows.length : plotWidth
  const barWidth = Math.min(42, slotWidth * 0.58)

  return (
    <div className="admin-activity-chart">
      {rows.length ? (
        <svg
          className="admin-activity-chart-svg"
          viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          role="img"
          aria-label="Stacked daily activity chart for new users, blood requests, emergency requests, and complaints during the last seven days"
        >
          {[0, 1, 2, 3].map((step) => {
            const y = CHART.top + (plotHeight * step) / 3
            const tick = Math.ceil(maxValue * (1 - step / 3))
            return (
              <g key={step}>
                <line x1={CHART.left} x2={CHART.width - CHART.right} y1={y} y2={y} className="admin-chart-gridline" />
                <text x={CHART.left - 8} y={y + 4} textAnchor="end" className="admin-chart-axis-label">{tick}</text>
              </g>
            )
          })}
          {rows.map((row, index) => {
            const total = values[index]
            const x = CHART.left + (slotWidth * index) + ((slotWidth - barWidth) / 2)
            let stackedHeight = 0

            return (
              <g key={row.date}>
                {SERIES.map((series) => {
                  const count = Math.max(0, Number(row[series.key]) || 0)
                  const height = total ? (count / maxValue) * plotHeight : 0
                  const y = CHART.top + plotHeight - stackedHeight - height
                  stackedHeight += height
                  if (!count) return null

                  return (
                    <rect
                      key={series.key}
                      x={x}
                      y={y}
                      width={barWidth}
                      height={height}
                      rx="5"
                      fill={series.color}
                    >
                      <title>{`${formatDay(row.date)}: ${count} ${series.label.toLowerCase()}`}</title>
                    </rect>
                  )
                })}
                <text
                  x={x + (barWidth / 2)}
                  y={CHART.height - 9}
                  textAnchor="middle"
                  className="admin-chart-axis-label"
                >
                  {formatDay(row.date)}
                </text>
              </g>
            )
          })}
        </svg>
      ) : (
        <p className="admin-chart-empty">Activity data is not available yet.</p>
      )}
      <ul className="admin-chart-legend" aria-label="Activity chart legend">
        {SERIES.map((series) => (
          <li key={series.key}>
            <span style={{ backgroundColor: series.color }} aria-hidden="true" />
            {series.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AdminActivityChart
