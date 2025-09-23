const activeHandlers = new Map();

self.addEventListener("message", (event) => {
  const { type, id, payload } = event.data || {};
  switch (type) {
    case "init":
      self.postMessage({ type: "ready" });
      break;
    case "forecast":
      self.postMessage({
        type: "forecast",
        id,
        forecast: buildForecast(payload)
      });
      break;
    case "traffic-analysis":
      self.postMessage({
        type: "traffic-analysis",
        id,
        report: buildTrafficAnalysis(payload)
      });
      break;
    default:
      console.warn("simulation-worker: unknown message", type);
  }
});

function buildForecast(metrics = {}) {
  const horizonHours = metrics.horizonHours ?? 72;
  const steps = Math.max(1, Math.floor(horizonHours / 6));
  const projections = [];

  let population = metrics.population ?? 1000;
  let satisfaction = metrics.satisfaction ?? 0.6;
  let capacity = metrics.capacity ?? population * 1.1;
  let gdp = metrics.gdp ?? 1000;
  let trend = metrics.trend ?? 0;

  for (let step = 1; step <= steps; step += 1) {
    const deltaHours = horizonHours / steps;
    const growthCapacity = Math.max(0, capacity - population);
    const organicGrowth = population * (metrics.growthRate ?? 0.015) * satisfaction * (deltaHours / 24);
    const migration = (satisfaction - 0.5) * 40 * (deltaHours / 24);
    population = Math.max(200, population + Math.min(growthCapacity, organicGrowth + migration));
    satisfaction = Math.max(0.1, Math.min(1, satisfaction + (Math.random() - 0.5) * 0.05));

    trend = trend * 0.94 + ((population / Math.max(1, capacity)) - 0.6) * 0.03;
    gdp = gdp * (1 + trend * 0.02 + 0.001 * (deltaHours / 24));

    projections.push({
      hour: step * deltaHours,
      population,
      satisfaction,
      gdp,
      trend
    });
  }

  return {
    horizonHours,
    projections,
    final: projections[projections.length - 1] ?? null
  };
}

function buildTrafficAnalysis(state = {}) {
  const incidents = (state.incidents ?? []).map((incident) => ({
    id: incident.id,
    severity: incident.severity,
    affectedRoads: incident.affectedRoads ?? []
  }));

  const congestionScore = Math.max(0, Math.min(1, (state.vehicles ?? 0) / Math.max(1, state.roadCapacity ?? 1)));
  const recommendedActions = [];

  if (congestionScore > 0.7) {
    recommendedActions.push("Increase public transit frequency");
    recommendedActions.push("Consider congestion pricing during rush hour");
  } else if (congestionScore < 0.3) {
    recommendedActions.push("Traffic flowing normally");
  } else {
    recommendedActions.push("Monitor arterial roads for slowdowns");
  }

  if ((state.transitUsage ?? 0) < 0.2) {
    recommendedActions.push("Promote public transit incentives");
  }

  return {
    congestionScore,
    incidents,
    recommendedActions
  };
}
