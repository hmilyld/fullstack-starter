import asyncio
import secrets
import time
from dataclasses import dataclass
from typing import Literal

ImportStatus = Literal["queued", "running", "success", "failed"]

# Keep finished jobs around long enough for the client to read the final status.
JOB_RETENTION_SECONDS = 60 * 60


@dataclass
class ImportJob:
    id: str
    token: str
    owner_id: int
    status: ImportStatus = "queued"
    message: str = "等待导入"
    progress: int = 0
    finished_at: float = 0.0

    def public(self) -> dict:
        return {
            "id": self.id,
            "status": self.status,
            "message": self.message,
            "progress": self.progress,
        }


class DataOperationState:
    def __init__(self) -> None:
        self.frozen = False
        self.jobs: dict[str, ImportJob] = {}
        self.tasks: set[asyncio.Task] = set()

    def begin_job(self, owner_id: int) -> ImportJob | None:
        """原子地抢占导入锁；若已有导入进行中则返回 None。"""
        if self.frozen:
            return None
        self._evict_finished_jobs()
        job = ImportJob(
            id=secrets.token_hex(16),
            token=secrets.token_urlsafe(32),
            owner_id=owner_id,
        )
        self.jobs[job.id] = job
        self.frozen = True
        return job

    def get_job(self, job_id: str, token: str) -> ImportJob | None:
        job = self.jobs.get(job_id)
        if job is None or not secrets.compare_digest(job.token, token):
            return None
        return job

    def finish_job(self, job: ImportJob, *, status: ImportStatus, message: str) -> None:
        job.status = status
        job.message = message
        job.progress = 100
        job.finished_at = time.monotonic()
        self.frozen = False

    def _evict_finished_jobs(self) -> None:
        cutoff = time.monotonic() - JOB_RETENTION_SECONDS
        for job_id in [
            job_id
            for job_id, job in self.jobs.items()
            if job.finished_at > 0 and job.finished_at < cutoff
        ]:
            self.jobs.pop(job_id, None)

    def add_task(self, task: asyncio.Task) -> None:
        self.tasks.add(task)
        task.add_done_callback(self.tasks.discard)


data_operation_state = DataOperationState()
