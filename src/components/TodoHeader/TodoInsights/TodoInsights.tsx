import './TodoInsights.css';

interface Insights {
  totalTodos: number;
  completionRate: number;
  completedTodos: number;
  completedLast7Days: number;
  overdueTodos: number;
  highPriorityPendingTodos: number;
}

interface TodoInsightsProps {
  insights: Insights | null;
  loading?: boolean;
}

function TodoInsights({ insights, loading }: TodoInsightsProps) {
  if (loading || !insights?.totalTodos) {
    return null;
  }

  const items = [
    {
      label: 'Progreso',
      value: `${insights.completionRate}%`,
      detail: `${insights.completedTodos} de ${insights.totalTodos} tareas`,
    },
    {
      label: 'Ultimos 7 dias',
      value: insights.completedLast7Days,
      detail: 'completadas',
    },
    {
      label: 'Vencidas',
      value: insights.overdueTodos,
      detail: 'pendientes',
    },
    {
      label: 'Alta prioridad',
      value: insights.highPriorityPendingTodos,
      detail: 'pendientes',
    },
  ];

  return (
    <section className="TodoInsights" aria-label="Metricas locales">
      {items.map(item => (
        <article className="TodoInsights-card" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <small>{item.detail}</small>
        </article>
      ))}
    </section>
  );
}

export { TodoInsights };
