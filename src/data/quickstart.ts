export const linuxInstallCommands = `python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python example.py --mode refactored`;

export const windowsInstallCommands = `py -3.12 -m venv .venv
.\\.venv\\Scripts\\python.exe -m pip install -r requirements.txt
.\\.venv\\Scripts\\python.exe example.py --mode refactored`;
