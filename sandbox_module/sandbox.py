import subprocess
import tempfile
import os
import resource
import signal

def run_python_code(code, timeout=10):
    """Run Python code with resource limits (no Docker)"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(code)
        fname = f.name
    try:
        # Set memory limit (256MB) and CPU time limit
        def set_limits():
            resource.setrlimit(resource.RLIMIT_AS, (256 * 1024 * 1024, 256 * 1024 * 1024))
            resource.setrlimit(resource.RLIMIT_CPU, (timeout, timeout))
        proc = subprocess.run(
            ['python', fname],
            capture_output=True,
            text=True,
            timeout=timeout,
            preexec_fn=set_limits if hasattr(os, 'preexec_fn') else None
        )
        return proc.stdout + proc.stderr
    except subprocess.TimeoutExpired:
        return "Timeout (10s)"
    except Exception as e:
        return f"Error: {e}"
    finally:
        os.unlink(fname)
