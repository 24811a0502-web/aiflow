/**
 * Planner Agent: Analyzes workflow graph, determines topological execution sequence,
 * and emits a confidence score. Pure domain agent without HTTP knowledge.
 */
class PlannerAgent {
  async plan(workflow) {
    const nodes = workflow.nodes || [];
    const edges = workflow.edges || [];

    if (!nodes.length) {
      throw new Error('Workflow has no nodes to execute');
    }

    // Build adjacency list and in-degree map for topological sort (Kahn's algorithm)
    const inDegree = new Map();
    const adjList = new Map();

    nodes.forEach((node) => {
      inDegree.set(node.id, 0);
      adjList.set(node.id, []);
    });

    edges.forEach((edge) => {
      if (adjList.has(edge.source) && inDegree.has(edge.target)) {
        adjList.get(edge.source).push(edge.target);
        inDegree.set(edge.target, inDegree.get(edge.target) + 1);
      }
    });

    // Find root nodes (inDegree === 0)
    const queue = [];
    inDegree.forEach((deg, nodeId) => {
      if (deg === 0) {
        queue.push(nodeId);
      }
    });

    const executionOrder = [];
    while (queue.length > 0) {
      const current = queue.shift();
      executionOrder.push(current);

      const neighbors = adjList.get(current) || [];
      for (const neighbor of neighbors) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    // If cycle detected or not all nodes reached, append remaining nodes gracefully
    let cycleDetected = false;
    if (executionOrder.length < nodes.length) {
      cycleDetected = true;
      nodes.forEach((node) => {
        if (!executionOrder.includes(node.id)) {
          executionOrder.push(node.id);
        }
      });
    }

    // Calculate planning confidence score
    let confidenceScore = 0.98;
    if (cycleDetected) confidenceScore -= 0.25;
    if (nodes.length > 10) confidenceScore -= 0.05;

    const orderedNodes = executionOrder
      .map((id) => nodes.find((n) => n.id === id))
      .filter(Boolean);

    return {
      agent: 'planner',
      confidenceScore: Math.max(0.5, Math.min(1.0, confidenceScore)),
      totalSteps: orderedNodes.length,
      cycleDetected,
      executionOrder,
      orderedNodes,
      reasoning: `Planned ${orderedNodes.length} steps in optimal topological dependency order.`,
    };
  }
}

module.exports = new PlannerAgent();
