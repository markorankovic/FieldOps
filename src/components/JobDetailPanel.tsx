import {
  priorityLabels,
  statusLabels,
  type Contractor,
  type Job,
  type JobStatus,
} from '../domain/jobs';
import { getAllowedTransitions } from '../domain/workflow';

type JobDetailPanelProps = {
  job: Job | null;
  contractors: Contractor[];
  onChangeStatus: (jobId: string, nextStatus: JobStatus) => void;
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export const JobDetailPanel = ({
  job,
  contractors,
  onChangeStatus,
}: JobDetailPanelProps) => {
  if (!job) {
    return (
      <aside className="panel detail-panel empty-state">
        <p className="eyebrow">Job Detail</p>
        <h2>Select a job</h2>
        <p>Choose a row from the dashboard to inspect the workflow and audit history.</p>
      </aside>
    );
  }

  const contractor = contractors.find((entry) => entry.id === job.contractorId);
  const allowedTransitions = getAllowedTransitions(job.status);

  return (
    <aside className="panel detail-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Job Detail</p>
          <h2>{job.title}</h2>
        </div>
        <span className={`status-badge status-${job.status}`}>{statusLabels[job.status]}</span>
      </div>

      <div className="detail-grid">
        <div>
          <span className="detail-label">Job ID</span>
          <p>{job.id}</p>
        </div>
        <div>
          <span className="detail-label">Priority</span>
          <p>{priorityLabels[job.priority]}</p>
        </div>
        <div>
          <span className="detail-label">Contractor</span>
          <p>{contractor ? `${contractor.name} · ${contractor.trade}` : 'Unassigned'}</p>
        </div>
        <div>
          <span className="detail-label">Scheduled</span>
          <p>{formatDateTime(job.scheduledFor)}</p>
        </div>
        <div>
          <span className="detail-label">Customer</span>
          <p>{job.customer}</p>
        </div>
        <div>
          <span className="detail-label">Site</span>
          <p>{job.site}</p>
        </div>
      </div>

      <div className="detail-section">
        <span className="detail-label">Scope</span>
        <p>{job.summary}</p>
      </div>

      <div className="detail-section">
        <span className="detail-label">Valid Next Status</span>
        <div className="transition-actions">
          {allowedTransitions.length > 0 ? (
            allowedTransitions.map((status) => (
              <button
                key={status}
                className="secondary-button"
                type="button"
                onClick={() => onChangeStatus(job.id, status)}
              >
                Move to {statusLabels[status]}
              </button>
            ))
          ) : (
            <p className="muted-text">This job is in a terminal state.</p>
          )}
        </div>
      </div>

      <div className="detail-section">
        <span className="detail-label">Audit Timeline</span>
        <div className="timeline">
          {job.audit.map((entry) => (
            <article key={entry.id} className="timeline-entry">
              <div>
                <strong>{entry.message}</strong>
                <p>
                  {entry.actor} · {entry.type.replace('_', ' ')}
                </p>
              </div>
              <time dateTime={entry.timestamp}>{formatDateTime(entry.timestamp)}</time>
            </article>
          ))}
        </div>
      </div>
    </aside>
  );
};
