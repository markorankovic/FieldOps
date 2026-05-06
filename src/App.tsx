import { useEffect, useMemo, useState } from 'react';
import { FilterBar } from './components/FilterBar';
import { JobDetailPanel } from './components/JobDetailPanel';
import { JobList } from './components/JobList';
import { contractors, mockJobs } from './data/mockJobs';
import { filterJobs } from './domain/filters';
import type { Job, JobFilters, JobStatus } from './domain/jobs';
import { updateJobStatus } from './domain/workflow';

const defaultFilters: JobFilters = {
  status: 'all',
  priority: 'all',
  contractorId: 'all',
  searchText: '',
};

function App() {
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [filters, setFilters] = useState<JobFilters>(defaultFilters);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(mockJobs[0]?.id ?? null);

  const filteredJobs = useMemo(
    () => filterJobs(jobs, filters, contractors),
    [jobs, filters],
  );

  const selectedJob =
    filteredJobs.find((job) => job.id === selectedJobId) ??
    jobs.find((job) => job.id === selectedJobId) ??
    null;

  useEffect(() => {
    if (filteredJobs.length === 0) {
      setSelectedJobId(null);
      return;
    }

    const selectedStillVisible = filteredJobs.some((job) => job.id === selectedJobId);
    if (!selectedStillVisible) {
      setSelectedJobId(filteredJobs[0].id);
    }
  }, [filteredJobs, selectedJobId]);

  const handleStatusChange = (jobId: string, nextStatus: JobStatus) => {
    setJobs((currentJobs) =>
      currentJobs.map((job) => (job.id === jobId ? updateJobStatus(job, nextStatus) : job)),
    );
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Contractor Workflow Dashboard</p>
        <h1>FieldOps</h1>
        <p className="hero-copy">
          A compact frontend portfolio slice for modelling job workflow, state transitions,
          filtering, and operator visibility.
        </p>
      </section>

      <FilterBar contractors={contractors} filters={filters} onFiltersChange={setFilters} />

      <section className="dashboard-grid">
        <JobList
          contractors={contractors}
          jobs={filteredJobs}
          selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId}
        />
        <JobDetailPanel
          contractors={contractors}
          job={selectedJob}
          onChangeStatus={handleStatusChange}
        />
      </section>
    </main>
  );
}

export default App;
