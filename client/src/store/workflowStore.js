import { create } from 'zustand';

export const useWorkflowStore = create((set, get) => ({
  workflow: null,
  nodes: [],
  edges: [],
  selectedNode: null,
  isDirty: false,

  setWorkflow: (workflow) => {
    set({
      workflow,
      nodes: workflow?.nodes || [],
      edges: workflow?.edges || [],
      selectedNode: null,
      isDirty: false,
    });
  },

  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),

  selectNode: (node) => set({ selectedNode: node }),

  updateSelectedNodeData: (updatedData) => {
    const { selectedNode, nodes } = get();
    if (!selectedNode) return;

    const newNodes = nodes.map((node) => {
      if (node.id === selectedNode.id) {
        return {
          ...node,
          data: {
            ...node.data,
            ...updatedData,
          },
        };
      }
      return node;
    });

    const updatedNode = newNodes.find((n) => n.id === selectedNode.id);
    set({
      nodes: newNodes,
      selectedNode: updatedNode,
      isDirty: true,
    });
  },

  addNode: (type, position = { x: 250, y: 200 }) => {
    const { nodes } = get();
    const id = `node-${Date.now()}`;
    const labels = {
      trigger: 'Trigger Event',
      ai_prompt: 'AI Reasoning Step',
      gmail: 'Gmail Action',
      slack: 'Slack Notification',
      discord: 'Discord Dispatch',
      'google-sheets': 'Google Sheets Append',
      condition: 'Condition Branch',
    };

    const newNode = {
      id,
      type,
      position,
      data: {
        label: labels[type] || 'New Step',
        action: type === 'trigger' ? 'manual' : type === 'ai_prompt' ? 'generate' : 'postMessage',
        params: {},
      },
    };

    set({
      nodes: [...nodes, newNode],
      selectedNode: newNode,
      isDirty: true,
    });
    return newNode;
  },

  deleteSelectedNode: () => {
    const { selectedNode, nodes, edges } = get();
    if (!selectedNode) return;

    set({
      nodes: nodes.filter((n) => n.id !== selectedNode.id),
      edges: edges.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id),
      selectedNode: null,
      isDirty: true,
    });
  },
}));
