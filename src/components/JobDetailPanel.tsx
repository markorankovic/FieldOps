import { useEffect, useState } from 'react';
import {
  type ContractorUser,
  priorityLabels,
  statusLabels,
  type Job,
  type JobStatus,
  type UserRole,
} from '../domain/jobs';
import { getAllowedTransitions } from '../domain/workflow';

type JobDetailPanelProps = {
  job: Job | null;
  contractors: ContractorUser[];
  currentUserRole: UserRole;
  isAssigning: boolean;
  isUpdatingStatus: boolean;
  onAssignJob: (jobId: string, contractorId: string) => void;
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
  currentUserRole,
  isAssigning,
  isUpdatingStatus,
  onAssignJob,
  onChangeStatus,
}: JobDetailPanelProps) => {
  const [selectedContractorId, setSelectedContractorId] = useState(job?.contractorId ?? '');

  useEffect(() => {
    setSelectedContractorId(job?.contractorId ?? '');
  }, [job?.contractorId, job?.id]);

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
  const canAssignJobs = currentUserRole === 'ADMIN';
  const assignmentChanged = selectedContractorId !== (job.contractorId ?? '');
  const isMutating = isAssigning || isUpdatingStatus;

  return (
    <aside className="panel detail-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Job Detail</p>
          <h2>{job.address}</h2>
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
          <p>{contractor ? contractor.name : 'Unassigned'}</p>
        </div>
        <div>
          <span className="detail-label">Scheduled</span>
          <p>{formatDateTime(job.scheduledFor)}</p>
        </div>
        <div>
          <span className="detail-label">Last Updated</span>
          <p>{formatDateTime(job.updatedAt)}</p>
        </div>
        <div>
          <span className="detail-label">Assigned Role</span>
          <p>{contractor?.role ?? 'None'}</p>
        </div>
      </div>

      <div className="detail-section">
        <span className="detail-label">Description</span>
        <p>{job.description}</p>
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
                disabled={isMutating}
                onClick={() => onChangeStatus(job.id, status)}
              >
                {isUpdatingStatus ? 'Updating...' : `Move to ${statusLabels[status]}`}
              </button>
            ))
          ) : (
            <p className="muted-text">This job is in a terminal state.</p>
          )}
        </div>
        {isUpdatingStatus ? <p className="muted-text">Saving status change...</p> : null}
      </div>

      {canAssignJobs ? (
        <div className="detail-section">
          <span className="detail-label">Assignment</span>
          <div className="assignment-controls">
            <select
              aria-label="Assign contractor"
              disabled={isMutating}
              value={selectedContractorId}
              onChange={(event) => setSelectedContractorId(event.target.value)}
            >
              <option value="">Select contractor</option>
              {contractors.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>

            <button
              className="secondary-button"
              type="button"
              disabled={!selectedContractorId || !assignmentChanged || isMutating}
              onClick={() => onAssignJob(job.id, selectedContractorId)}
            >
              {isAssigning ? 'Saving assignment...' : 'Save assignment'}
            </button>
          </div>
          {isAssigning ? <p className="muted-text">Updating assignment...</p> : null}
        </div>
      ) : null}

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
