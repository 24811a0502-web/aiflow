import { GitFork, Activity, CheckCircle2, XCircle, TrendingUp, Zap } from 'lucide-react';

export default function MetricGrid({ metrics = {} }) {
  const {
    totalWorkflows = 0,
    activeWorkflows = 0,
    totalExecutions = 0,
    successRate = 100,
    completedExecutions = 0,
    failedExecutions = 0,
  } = metrics;

  const cards = [
    {
      title: 'Active Workflows',
      value: `${activeWorkflows} / ${totalWorkflows}`,
      subtitle: `${totalWorkflows - activeWorkflows} draft or paused`,
      icon: GitFork,
      color: 'from-blue-500/20 to-cyan-500/20',
      textColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/30',
    },
    {
      title: 'Total Executions',
      value: totalExecutions,
      subtitle: 'Recorded across agent runs',
      icon: Activity,
      color: 'from-indigo-500/20 to-purple-500/20',
      textColor: 'text-indigo-400',
      borderColor: 'border-indigo-500/30',
    },
    {
      title: 'Success Rate',
      value: `${successRate}%`,
      subtitle: `${completedExecutions} completed runs`,
      icon: TrendingUp,
      color: 'from-emerald-500/20 to-teal-500/20',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
    },
    {
      title: 'Recovered / Failed',
      value: `${failedExecutions}`,
      subtitle: 'Escalated to recovery agent',
      icon: XCircle,
      color: 'from-rose-500/20 to-amber-500/20',
      textColor: 'text-rose-400',
      borderColor: 'border-rose-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`p-5 rounded-2xl bg-slate-900/60 border ${card.borderColor} backdrop-blur-md relative overflow-hidden transition-all duration-200 hover:scale-[1.01]`}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${card.color} rounded-full blur-2xl pointer-events-none -mr-10 -mt-10`}></div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl bg-slate-800/80 ${card.textColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-white mb-1">
              {card.value}
            </div>
            <div className="text-xs text-slate-400">{card.subtitle}</div>
          </div>
        );
      })}
    </div>
  );
}
