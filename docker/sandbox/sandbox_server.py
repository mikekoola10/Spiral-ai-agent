from flask import Flask, request, jsonify
import subprocess, tempfile, os
app = Flask(__name__)
@app.route('/run', methods=['POST'])
def run():
    code = request.json.get('code', '')
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(code)
        fname = f.name
    try:
        proc = subprocess.run(['python', fname], capture_output=True, text=True, timeout=10)
        out = proc.stdout + proc.stderr
        return jsonify({"output": out})
    except subprocess.TimeoutExpired:
        return jsonify({"output": "Timeout (10s)"})
    finally:
        os.unlink(fname)
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)