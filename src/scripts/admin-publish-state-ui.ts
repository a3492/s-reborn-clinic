const IR101_EDIT_PATH = '/admin/posts/edit';

const STATUS_LABELS: Record<string, string> = {
  queued: '대기',
  pending: '대기',
  processing: '처리 중 (legacy)',
  validating: '검증 중',
  build_pending: '빌드 대기',
  deploying: '배포 중',
  success: '공개 완료 (legacy)',
  live: 'Verified Live',
  failed: '실패',
  rolled_back: '롤백',
  idle: '대기 없음',
};

const formatDate = (value: unknown) => {
  if (!value) return '-';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const statusLabel = (status: unknown) => {
  const key = String(status || 'idle');
  return STATUS_LABELS[key] || key;
};

const statusClass = (status: unknown) => {
  const key = String(status || 'idle');
  if (key === 'live' || key === 'success') return 'success';
  if (key === 'failed') return 'failed';
  if (key === 'rolled_back') return 'draft';
  if (key === 'build_pending' || key === 'deploying' || key === 'validating' || key === 'processing') {
    return 'scheduled';
  }
  return key;
};

const inferDeployStatus = (post: any, latestJob: any) => {
  if (post?.deploy_status) return String(post.deploy_status);
  const jobStatus = String(latestJob?.status || '');
  if (jobStatus === 'success') return 'live';
  if (jobStatus) return jobStatus;
  if (post?.status === 'published') return 'live';
  return 'idle';
};

async function loadPost(supabase: any, slug: string) {
  const modern = await supabase
    .from('posts')
    .select('id, slug, status, category, published_at, canonical_url, content_version, deploy_status, publish_requested_at, public_verified_at, public_url, last_publish_result')
    .eq('slug', slug)
    .maybeSingle();

  if (!modern.error) return modern.data;

  const legacy = await supabase
    .from('posts')
    .select('id, slug, status, category, published_at, canonical_url, content_version')
    .eq('slug', slug)
    .maybeSingle();

  if (legacy.error) throw legacy.error;
  return legacy.data;
}

async function loadJobs(supabase: any, postId: string) {
  const modern = await supabase
    .from('publish_jobs')
    .select('id, status, commit_sha, error_message, created_at, completed_at, target_path, content_version, public_url, public_verified_at, live_check')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!modern.error) return modern.data ?? [];

  const legacy = await supabase
    .from('publish_jobs')
    .select('id, status, commit_sha, error_message, created_at, completed_at, target_path')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (legacy.error) throw legacy.error;
  return legacy.data ?? [];
}

function renderReleaseState(post: any, jobs: any[]) {
  const root = document.querySelector('[data-admin-release-state]');
  if (!(root instanceof HTMLElement) || !post) return;

  const latest = jobs[0] ?? null;
  const deployStatus = inferDeployStatus(post, latest);
  const verifiedAt = post.public_verified_at || latest?.public_verified_at || (deployStatus === 'live' ? post.published_at : null);
  const publicUrl = post.public_url || latest?.public_url || post.canonical_url || '-';
  const commit = latest?.commit_sha || '-';
  const contentVersion = latest?.content_version ?? post.content_version ?? '-';
  const signature = JSON.stringify([
    post.status,
    deployStatus,
    verifiedAt,
    publicUrl,
    commit,
    contentVersion,
  ]);

  if (root.dataset.ir101Signature === signature) return;
  root.dataset.ir101Signature = signature;

  root.innerHTML = `
    <li class="admin-list-row">
      <div>
        <p class="admin-item-title">Editorial status</p>
        <p class="admin-item-meta">DB 편집·검토 상태</p>
      </div>
      <div><span class="admin-status ${escapeHtml(statusClass(post.status))}">${escapeHtml(post.status || 'draft')}</span></div>
    </li>
    <li class="admin-list-row">
      <div>
        <p class="admin-item-title">Deploy status</p>
        <p class="admin-item-meta">commit과 public live를 분리해서 표시합니다.</p>
      </div>
      <div><span class="admin-status ${escapeHtml(statusClass(deployStatus))}">${escapeHtml(statusLabel(deployStatus))}</span></div>
    </li>
    <li class="admin-list-row">
      <div>
        <p class="admin-item-title">Public verification</p>
        <p class="admin-item-meta">${verifiedAt ? formatDate(verifiedAt) : '아직 Verified Live 증거 없음'}</p>
      </div>
    </li>
    <li class="admin-list-row">
      <div>
        <p class="admin-item-title">Public URL</p>
        <p class="admin-item-meta">${escapeHtml(publicUrl)}</p>
      </div>
    </li>
    <li class="admin-list-row">
      <div>
        <p class="admin-item-title">Latest artifact</p>
        <p class="admin-item-meta admin-cell-mono">version ${escapeHtml(contentVersion)} · commit ${escapeHtml(commit)}</p>
      </div>
    </li>
  `;
}

function renderHistory(jobs: any[]) {
  const root = document.querySelector('[data-admin-publish-history-summary]');
  if (!(root instanceof HTMLElement)) return;

  if (!jobs.length) {
    if (root.dataset.ir101Signature === 'empty') return;
    root.dataset.ir101Signature = 'empty';
    root.innerHTML = '<p class="admin-help">이력 없음</p>';
    return;
  }

  const latest = jobs[0];
  const latestLive = jobs.find((job) => job.status === 'live' || job.status === 'success') ?? null;
  const latestFailure = jobs.find((job) => job.status === 'failed') ?? null;
  const liveSha = latestLive?.commit_sha ? String(latestLive.commit_sha).slice(0, 8) : null;
  const latestSha = latest?.commit_sha ? String(latest.commit_sha).slice(0, 8) : null;
  const failureMessage = latestFailure?.error_message ? String(latestFailure.error_message) : '';
  const failureShort = failureMessage ? failureMessage.split('\n')[0].slice(0, 80) : '';
  const signature = JSON.stringify(jobs.map((job) => [
    job.id,
    job.status,
    job.commit_sha,
    job.error_message,
    job.public_verified_at,
    job.content_version,
  ]));

  if (root.dataset.ir101Signature === signature) return;
  root.dataset.ir101Signature = signature;

  root.innerHTML = `
    <div class="admin-change-row">
      <span class="admin-cell-subtle">최근 job${latestSha ? ` · <code>${escapeHtml(latestSha)}</code>` : ''}</span>
      <span class="admin-cell-date admin-cell-subtle">${formatDate(latest.created_at)}</span>
      <span class="admin-status ${escapeHtml(statusClass(latest.status))}">${escapeHtml(statusLabel(latest.status))}</span>
    </div>
    <div class="admin-change-row">
      <span class="admin-cell-subtle">Verified Live${liveSha ? ` · <code>${escapeHtml(liveSha)}</code>` : ': 없음'}</span>
      <span class="admin-cell-date admin-cell-subtle">${latestLive?.public_verified_at ? formatDate(latestLive.public_verified_at) : latestLive ? formatDate(latestLive.completed_at || latestLive.created_at) : '-'}</span>
      ${latestLive ? '<span class="admin-status success">live</span>' : '<span class="admin-status draft">-</span>'}
    </div>
    <div class="admin-change-row">
      <span class="admin-cell-subtle" title="${escapeHtml(failureMessage)}">${failureShort ? escapeHtml(failureShort) : '최근 실패 없음'}</span>
      <span class="admin-cell-date admin-cell-subtle">${latestFailure ? formatDate(latestFailure.completed_at || latestFailure.created_at) : '-'}</span>
      ${latestFailure ? '<span class="admin-status failed">failed</span><button type="button" class="admin-btn admin-btn-sm" data-admin-history-retry>Retry</button>' : '<span class="admin-status success">✓</span><span></span>'}
    </div>
  `;
}

export function installPublishStateUi() {
  if (window.location.pathname.replace(/\/$/, '') !== IR101_EDIT_PATH) return;

  let refreshInFlight = false;
  let refreshQueued = false;
  let observer: MutationObserver | null = null;

  const refresh = async () => {
    if (refreshInFlight) {
      refreshQueued = true;
      return;
    }

    const supabase = (window as any).__adminSupabase;
    const slug = new URLSearchParams(window.location.search).get('slug')?.trim() || '';
    if (!supabase || !slug) return;

    refreshInFlight = true;
    try {
      const post = await loadPost(supabase, slug);
      if (!post?.id) return;
      const jobs = await loadJobs(supabase, post.id);
      renderReleaseState(post, jobs);
      renderHistory(jobs);
    } catch (error) {
      console.warn('[IR-101 publish UI] state refresh failed', error);
    } finally {
      refreshInFlight = false;
      if (refreshQueued) {
        refreshQueued = false;
        queueMicrotask(() => void refresh());
      }
    }
  };

  const attachObserver = () => {
    if (observer) return;
    const history = document.querySelector('[data-admin-publish-history-summary]');
    const release = document.querySelector('[data-admin-release-state]');
    if (!history && !release) return;

    observer = new MutationObserver(() => {
      window.setTimeout(() => void refresh(), 0);
    });
    if (history) observer.observe(history, { childList: true, subtree: true });
    if (release) observer.observe(release, { childList: true, subtree: true });
  };

  const start = () => {
    attachObserver();
    void refresh();
  };

  document.addEventListener('admin:session-ready', start, { once: true });
  if ((window as any).__adminSupabase && document.body.dataset.adminUserId) start();

  // Publish request completion may update the page without a navigation.
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest('[data-admin-publish-live], [data-admin-history-retry]')) return;
    window.setTimeout(() => void refresh(), 1200);
  });
}
