import { useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  assignJob,
  getContractors,
  getCurrentUser,
  getJobs,
  login,
  updateJobStatus,
} from './api/fieldops';
import { FilterBar } from './components/FilterBar';
import { JobDetailPanel } from './components/JobDetailPanel';
import { JobList } from './components/JobList';
import { LoginScreen } from './components/LoginScreen';
import { SummaryStrip } from './components/SummaryStrip';
import { filterJobs } from './domain/filters';
import { clearAccessToken, getBrowserStorage, loadAccessToken, saveAccessToken } from './domain/auth';
import type { ContractorUser, Job, JobFilters, JobStatus, UserSummary } from './domain/jobs';
import { loadFilters, saveFilters } from './domain/persistence';

const defaultFilters: JobFilters = {
  status: 'all',
  priority: 'all',
  contractorId: 'all',
  searchText: '',
};

const toErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const isContractorUser = (user: UserSummary): user is ContractorUser => user.role === 'CONTRACTOR';

function App() {
  const storage = getBrowserStorage();
  const [accessToken, setAccessToken] = useState<string | null>(() => loadAccessToken(storage));
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [contractors, setContractors] = useState<ContractorUser[]>([]);
  const [filters, setFilters] = useState<JobFilters>(() => loadFilters(storage, defaultFilters));
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAssigningJob, setIsAssigningJob] = useState(false);

  const filteredJobs = useMemo(
    () => filterJobs(jobs, filters, contractors),
    [jobs, filters, contractors],
  );

  useEffect(() => {
    saveFilters(storage, filters);
  }, [filters, storage]);

  useEffect(() => {
    if (!accessToken) {
      setCurrentUser(null);
      setJobs([]);
      setContractors([]);
      setSelectedJobId(null);
      setAuthChecked(true);
      return;
    }

    let active = true;

    const loadSession = async () => {
      setIsLoadingDashboard(true);
      setDashboardError(null);

      try {
        const user = await getCurrentUser(accessToken);
        const [nextJobs, nextContractors] = await Promise.all([
          getJobs(accessToken),
          user.role === 'ADMIN'
            ? getContractors(accessToken)
            : Promise.resolve(isContractorUser(user) ? [user] : []),
        ]);

        if (!active) {
          return;
        }

        setCurrentUser(user);
        setJobs(nextJobs);
        setContractors(nextContractors);
      } catch (error) {
        if (!active) {
          return;
        }

        clearAccessToken(storage);
        setAccessToken(null);
        setCurrentUser(null);
        setJobs([]);
        setContractors([]);
        setSelectedJobId(null);
        setAuthError(
          error instanceof ApiError && error.status === 401
            ? 'Your session expired. Sign in again.'
            : toErrorMessage(error, 'Unable to load your session.'),
        );
      } finally {
        if (active) {
          setAuthChecked(true);
          setIsLoadingDashboard(false);
        }
      }
    };

    void loadSession();

    return () => {
      active = false;
    };
  }, [accessToken, storage]);

  const selectedJob =
    filteredJobs.find((job) => job.id === selectedJobId) ??
    jobs.find((job) => job.id === selectedJobId) ??
    null;

  useEffect(() => {
    if (jobs.length === 0) {
      setSelectedJobId(null);
      return;
    }

    const selectedJobExists = selectedJobId
      ? jobs.some((job) => job.id === selectedJobId)
      : false;

    if (!selectedJobExists) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

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

  const replaceJob = (nextJob: Job) => {
    setJobs((currentJobs) =>
      currentJobs.map((job) => (job.id === nextJob.id ? nextJob : job)),
    );
  };

  const handleLogin = async (email: string, password: string) => {
    setIsLoggingIn(true);
    setAuthError(null);

    try {
      const session = await login(email, password);
      saveAccessToken(storage, session.accessToken);
      setAccessToken(session.accessToken);
    } catch (error) {
      setAuthError(toErrorMessage(error, 'Unable to sign in.'));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    clearAccessToken(storage);
    setAccessToken(null);
    setCurrentUser(null);
    setJobs([]);
    setContractors([]);
    setDashboardError(null);
  };

  const handleStatusChange = async (jobId: string, nextStatus: JobStatus) => {
    if (!accessToken) {
      return;
    }

    setIsUpdatingStatus(true);
    setDashboardError(null);

    try {
      const updatedJob = await updateJobStatus(accessToken, jobId, nextStatus);
      replaceJob(updatedJob);
    } catch (error) {
      setDashboardError(toErrorMessage(error, 'Unable to update the job status.'));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignJob = async (jobId: string, contractorId: string) => {
    if (!accessToken) {
      return;
    }

    setIsAssigningJob(true);
    setDashboardError(null);

    try {
      const updatedJob = await assignJob(accessToken, jobId, contractorId);
      replaceJob(updatedJob);
    } catch (error) {
      setDashboardError(toErrorMessage(error, 'Unable to assign this job.'));
    } finally {
      setIsAssigningJob(false);
    }
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  if (!authChecked || (accessToken && !currentUser)) {
    return (
      <main className="auth-shell">
        <section className="auth-card panel">
          <p className="eyebrow">FieldOps Full-Stack Demo</p>
          <h1>Loading session...</h1>
          <p className="hero-copy">Connecting the dashboard to the backend API.</p>
        </section>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <LoginScreen
        error={authError}
        isSubmitting={isLoggingIn}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <main className="app-shell">
      <section className="hero hero-surface">
        <div>
          <p className="eyebrow">Contractor Workflow Dashboard</p>
          <h1>FieldOps</h1>
          <p className="hero-copy">
            Backend-connected demo showing auth, role-aware access, workflow transitions, and
            audit visibility on top of the original frontend slice.
          </p>
        </div>

        <div className="session-card">
          <span className="detail-label">Signed in</span>
          <strong>{currentUser.name}</strong>
          <p>
            {currentUser.role === 'ADMIN' ? 'Admin / Dispatcher' : 'Contractor'} ·{' '}
            {currentUser.email}
          </p>
          <button className="secondary-button" type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </section>

      {dashboardError ? <p className="error-banner">{dashboardError}</p> : null}

      <FilterBar
        contractors={contractors}
        filters={filters}
        onFiltersChange={setFilters}
        onResetFilters={handleResetFilters}
      />

      <SummaryStrip jobs={filteredJobs} />

      {isLoadingDashboard ? (
        <section className="panel loading-panel">
          <p className="eyebrow">Loading</p>
          <h2>Fetching jobs...</h2>
          <p className="hero-copy">The backend is the source of truth on this branch.</p>
        </section>
      ) : (
        <section className="dashboard-grid">
          <JobList
            contractors={contractors}
            jobs={filteredJobs}
            selectedJobId={selectedJobId}
            onSelectJob={setSelectedJobId}
          />
          <JobDetailPanel
            contractors={contractors}
            currentUserRole={currentUser.role}
            isAssigning={isAssigningJob}
            isUpdatingStatus={isUpdatingStatus}
            job={selectedJob}
            onAssignJob={handleAssignJob}
            onChangeStatus={handleStatusChange}
          />
        </section>
      )}
    </main>
  );
}

export default App;
