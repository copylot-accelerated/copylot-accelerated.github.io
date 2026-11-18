export interface InstallCommands {
  linux: string;
  windows: string;
}

export const legacyInstallCommands: InstallCommands = {
  linux: `python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python example.py --mode refactored`,
  windows: `py -3.12 -m venv .venv
.\\.venv\\Scripts\\python.exe -m pip install -r requirements.txt
.\\.venv\\Scripts\\python.exe example.py --mode refactored`,
};

export const examplesInstallCommands: InstallCommands = {
  linux: `python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python quickstart.py`,
  windows: `py -3.12 -m venv .venv
.\\.venv\\Scripts\\python.exe -m pip install -r requirements.txt
.\\.venv\\Scripts\\python.exe quickstart.py`,
};

export const commercialDemoCommands: InstallCommands = {
  linux: `.venv/bin/python -m pip install -r commercial_demo/requirements.txt
.venv/bin/python commercial_demo/commercial_demo.py --no-open`,
  windows: `.\\.venv\\Scripts\\python.exe -m pip install -r commercial_demo\\requirements.txt
.\\.venv\\Scripts\\python.exe commercial_demo\\commercial_demo.py --no-open`,
};

export const quickStartExpectedOutput = `CoPylot-Accelerated Quick Start
Heliostats simulated: 12
Solar-field optical efficiency: 86.52%
Receiver absorbed power: 1,268.1 kW
Peak incident receiver flux: 52.35 kW/m²
Receiver flux map: 25 rows × 25 columns`;

export const quickStartNote =
  "This is one synthetic optical operating point using explicit solar position and DNI.";
