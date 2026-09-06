import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Play,
  Sparkles,
  Mail,
  MessageSquare,
  MessageCircle,
  FileSpreadsheet,
  GitBranch,
  Cpu,
} from 'lucide-react';

const iconMap = {
  trigger: Play,
  ai_prompt: Sparkles,
  gmail: Mail,
  slack: MessageSquare,
  discord: MessageCircle,
  'google-sheets': FileSpreadsheet,
  condition: GitBranch,
};

const colorMap = {
  trigger: {
    border: 'border-amber-500/60',
    bg: 'bg-amber-500/10',
    accent: 'from-amber-500 to-orange-600',
    badge: 'bg-amber-500/20 text-amber-300',
  },
  ai_prompt: {
    border: 'border-purple-500/60',
    bg: 'bg-purple-500/10',
    accent: 'from-purple-500 to-indigo-600',
    badge: 'bg-purple-500/20 text-purple-300',
  },
  gmail: {
    border: 'border-red-500/60',
    bg: 'bg-red-500/10',
    accent: 'from-red-500 to-rose-600',
    badge: 'bg-red-500/20 text-red-300',
  },
  slack: {
    border: 'border-emerald-500/60',
    bg: 'bg-emerald-500/10',
    accent: 'from-emerald-500 to-teal-600',
    badge: 'bg-emerald-500/20 text-emerald-300',
  },
  discord: {
    border: 'border-indigo-500/60',
    bg: 'bg-indigo-500/10',
    accent: 'from-indigo-500 to-blue-600',
    badge: 'bg-indigo-500/20 text-indigo-300',
  },
  'google-sheets': {
    border: 'border-green-500/60',
    bg: 'bg-green-500/10',
    accent: 'from-green-500 to-emerald-600',
    badge: 'bg-green-500/20 text-green-300',
  },
  condition: {
    border: 'border-cyan-500/60',
    bg: 'bg-cyan-500/10',
    accent: 'from-cyan-500 to-blue-600',
    badge: 'bg-cyan-500/20 text-cyan-300',
  },
};

export const CustomNodeComponent = memo(({ id, data, type, selected }) => {
  const Icon = iconMap[type] || Cpu;
  const colors = colorMap[type] || {
    border: 'border-blue-500/50',
    bg: 'bg-blue-500/10',
    accent: 'from-blue-500 to-indigo-600',
    badge: 'bg-blue-500/20 text-blue-300',
  };

  return (
    <div
      className={`w-64 rounded-2xl p-4 bg-slate-900/90 backdrop-blur-xl border transition-all duration-200 shadow-xl ${
        selected ? 'ring-2 ring-blue-400 border-transparent shadow-blue-500/20' : colors.border
      } hover:border-slate-400/80`}
    >
      {/* Incoming Connection Handle */}
      {type !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-blue-400 !border-2 !border-slate-900"
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl bg-gradient-to-br ${colors.accent} text-white shadow-md`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white tracking-wide truncate max-w-[130px]">
              {data.label || 'Step'}
            </span>
            <span className="text-[10px] text-slate-400 capitalize">{type.replace('_', ' ')}</span>
          </div>
        </div>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${colors.badge}`}>
          {data.action || 'run'}
        </span>
      </div>

      {/* Body / Description */}
      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
        {data.description || data.params?.prompt || (data.params?.to ? `To: ${data.params.to}` : 'Configured automation step')}
      </p>

      {/* Outgoing Connection Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-slate-900"
      />
    </div>
  );
});

CustomNodeComponent.displayName = 'CustomNodeComponent';

export const nodeTypes = {
  trigger: CustomNodeComponent,
  ai_prompt: CustomNodeComponent,
  gmail: CustomNodeComponent,
  slack: CustomNodeComponent,
  discord: CustomNodeComponent,
  'google-sheets': CustomNodeComponent,
  condition: CustomNodeComponent,
};
