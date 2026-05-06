import type { Job } from '../domain/jobs';

type SummaryStripProps = {
  jobs: Job[];
};

type SummaryCard = {
  label: string;
  value: number;
  tone: 'neutral' | 'urgent' | 'warning' | 'success';
};

export const SummaryStrip = ({ jobs }: SummaryStripProps) => {
  const cards: SummaryCard[] = [
    { label: 'Shown', value: jobs.length, tone: 'neutral' },
    {
      label: 'Urgent',
      value: jobs.filter((job) => job.priority === 'urgent').length,
      tone: 'urgent',
    },
    {
      label: 'Blocked',
      value: jobs.filter((job) => job.status === 'blocked').length,
      tone: 'warning',
    },
    {
      label: 'Completed',
      value: jobs.filter((job) => job.status === 'completed').length,
      tone: 'success',
    },
  ];

  return (
    <section className="summary-strip" aria-label="Job summary">
      {cards.map((card) => (
        <article key={card.label} className={`summary-card tone-${card.tone}`}>
          <span className="summary-label">{card.label}</span>
          <strong className="summary-value">{card.value}</strong>
        </article>
      ))}
    </section>
  );
};
