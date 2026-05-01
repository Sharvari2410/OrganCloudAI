export function buildPredictiveInsights({ demandByState, organDemand, organsAvailable, activeRequests, averageScore, delayedTransports }) {
  const topDemand = demandByState[0];
  const topOrganDemand = organDemand[0];

  const demandSupplyRatio = organsAvailable > 0 ? (activeRequests / organsAvailable) : activeRequests;
  const pressure = demandSupplyRatio >= 1.5 ? "Critical" : demandSupplyRatio >= 1 ? "High" : "Moderate";

  const insights = [];

  if (topDemand) {
    insights.push({
      title: "Regional Demand Spike",
      message: `High demand for ${topDemand.organ_type} in ${topDemand.state}`,
      severity: "high",
      metric: topDemand.total,
    });
  }

  if (topOrganDemand) {
    insights.push({
      title: "Most Requested Organ",
      message: `${topOrganDemand.label} leads current waitlist demand`,
      severity: "medium",
      metric: topOrganDemand.value,
    });
  }

  insights.push({
    title: "Demand vs Supply Pressure",
    message: `Demand-supply pressure is ${pressure} (${demandSupplyRatio.toFixed(2)}x)` ,
    severity: pressure === "Critical" ? "high" : pressure === "High" ? "medium" : "low",
    metric: Number(demandSupplyRatio.toFixed(2)),
  });

  insights.push({
    title: "Compatibility Quality",
    message: `Average compatibility score is ${averageScore || 0}%`,
    severity: averageScore >= 85 ? "low" : averageScore >= 70 ? "medium" : "high",
    metric: averageScore || 0,
  });

  insights.push({
    title: "Logistics Risk",
    message: `${delayedTransports} active delayed transports impacting SLAs`,
    severity: delayedTransports >= 3 ? "high" : delayedTransports >= 1 ? "medium" : "low",
    metric: delayedTransports,
  });

  return insights;
}
