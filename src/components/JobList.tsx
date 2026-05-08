import { priorityLabels, statusLabels, type ContractorUser, type Job } from '../domain/jobs';

type JobListProps = {
  jobs: Job[];
  contractors: ContractorUser[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

export const JobList = ({ jobs, contractors, selectedJobId, onSelectJob }: JobListProps) => {
  const contractorMap = new Map(contractors.map((contractor) => [contractor.id, contractor]));

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Active Queue</p>
          <h2>Jobs</h2>
        </div>
      </div>

      <div className="job-table">
        <div className="job-table-head">
          <span>Job</span>
          <span>Status</span>
          <span>Priority</span>
          <span>Contractor</span>
          <span>Scheduled</span>
        </div>

        {jobs.length > 0 ? (
          jobs.map((job) => {
            const contractor = job.contractorId ? contractorMap.get(job.contractorId) : undefined;
            const isSelected = job.id === selectedJobId;

            return (
              <button
                key={job.id}
                className={`job-row${isSelected ? ' selected' : ''}`}
                type="button"
                onClick={() => onSelectJob(job.id)}
              >
                <span>
                  <strong>{job.address}</strong>
                  <small>
                    {job.id} · {job.description}
                  </small>
                </span>
                <span className={`status-badge status-${job.status}`}>{statusLabels[job.status]}</span>
                <span className={`priority-badge priority-${job.priority}`}>
                  {priorityLabels[job.priority]}
                </span>
                <span>{contractor?.name ?? 'Unassigned'}</span>
                <span>{formatDate(job.scheduledFor)}</span>
              </button>
            );
          })
        ) : (
          <div className="job-empty-state">
            <strong>No jobs match these filters.</strong>
            <p>Try clearing one or more filters to bring jobs back into view.</p>
          </div>
        )}
      </div>
    </section>
  );
};
