import GlassCard from '../common/GlassCard'

const groupSections = [
  ['A+', 'A-'],
  ['B+', 'B-'],
  ['AB+', 'AB-'],
  ['O+', 'O-'],
]

function BloodGroupSelector({ selectedGroup, onSelect }) {
  return (
    <GlassCard className="p-4 sm:p-5 lg:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Blood group</p>
        <h2 className="mt-2 text-2xl font-bold text-white">Select blood group</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {groupSections.map((groupSet, groupIndex) => (
          <div key={groupIndex} className="rounded-[24px] border border-white/10 bg-slate-950/20 p-3">
            <div className="mb-3 text-[10px] uppercase tracking-[0.16em] text-slate-400">
              {groupSet[0].startsWith('AB') ? 'AB Group' : groupSet[0].startsWith('A') ? 'A Group' : groupSet[0].startsWith('B') ? 'B Group' : 'O Group'}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {groupSet.map((group) => {
                const selected = group === selectedGroup
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => onSelect(group)}
                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${
                      selected
                        ? 'border-cyan-300/50 bg-cyan-400/15 text-white shadow-[0_0_0_1px_rgba(125,211,252,0.3)]'
                        : 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10'
                    }`}
                  >
                    {group}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

export default BloodGroupSelector
