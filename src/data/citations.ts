import { SITE } from "../config/site";

export type CitationId = "software" | "solarpilot" | "copylot";

export interface CitationEntry {
  id: CitationId;
  label: string;
  note: string;
  slug: string;
  text: string;
}

export interface CitationFormat {
  id: "apa" | "mla" | "chicago" | "ieee" | "bibtex" | "ris";
  label: string;
  extension: "txt" | "bib" | "ris";
  mime: string;
  entries: CitationEntry[];
}

const repository = SITE.repository.url;

const softwareEntry = (
  text: string,
): CitationEntry => ({
  id: "software",
  label: "CoPylot-Accelerated",
  note: "Software citation",
  slug: "copylot-accelerated",
  text,
});

const solarPilotEntry = (text: string): CitationEntry => ({
  id: "solarpilot",
  label: "SolarPILOT",
  note: "Wagner & Wendelin (2018)",
  slug: "wagner2018solarpilot",
  text,
});

const copylotEntry = (text: string): CitationEntry => ({
  id: "copylot",
  label: "CoPylot",
  note: "Hamilton, Wagner & Zolan (2022)",
  slug: "hamilton2022copylot",
  text,
});

const solarPilotApa =
  "Wagner, M. J., & Wendelin, T. (2018). SolarPILOT: A power tower solar field layout and characterization tool. Solar Energy, 171, 185–196. https://doi.org/10.1016/j.solener.2018.06.063";

const copylotApa =
  "Hamilton, W. T., Wagner, M. J., & Zolan, A. J. (2022). Demonstrating SolarPILOT's Python application programmable interface through heliostat optimal aimpoint strategy use case. Journal of Solar Energy Engineering, 144(3), 030906. https://doi.org/10.1115/1.4053973";

const solarPilotMla =
  'Wagner, Michael J., and Tim Wendelin. "SolarPILOT: A Power Tower Solar Field Layout and Characterization Tool." Solar Energy, vol. 171, 2018, pp. 185–196, https://doi.org/10.1016/j.solener.2018.06.063.';

const copylotMla =
  'Hamilton, William T., et al. "Demonstrating SolarPILOT\'s Python Application Programmable Interface Through Heliostat Optimal Aimpoint Strategy Use Case." Journal of Solar Energy Engineering, vol. 144, no. 3, 2022, article 030906, https://doi.org/10.1115/1.4053973.';

const solarPilotChicago =
  'Wagner, Michael J., and Tim Wendelin. 2018. "SolarPILOT: A Power Tower Solar Field Layout and Characterization Tool." Solar Energy 171: 185–196. https://doi.org/10.1016/j.solener.2018.06.063.';

const copylotChicago =
  'Hamilton, William T., Michael J. Wagner, and Alexander J. Zolan. 2022. "Demonstrating SolarPILOT\'s Python Application Programmable Interface Through Heliostat Optimal Aimpoint Strategy Use Case." Journal of Solar Energy Engineering 144 (3): 030906. https://doi.org/10.1115/1.4053973.';

const solarPilotIeee =
  'M. J. Wagner and T. Wendelin, "SolarPILOT: A power tower solar field layout and characterization tool," Solar Energy, vol. 171, pp. 185–196, 2018, doi: 10.1016/j.solener.2018.06.063.';

const copylotIeee =
  'W. T. Hamilton, M. J. Wagner, and A. J. Zolan, "Demonstrating SolarPILOT\'s Python application programmable interface through heliostat optimal aimpoint strategy use case," Journal of Solar Energy Engineering, vol. 144, no. 3, Art. no. 030906, 2022, doi: 10.1115/1.4053973.';

const solarPilotBibtex = `@article{wagner2018solarpilot,
  author  = {Wagner, Michael J. and Wendelin, Tim},
  title   = {{SolarPILOT}: A power tower solar field layout and characterization tool},
  journal = {Solar Energy},
  volume  = {171},
  pages   = {185--196},
  year    = {2018},
  doi     = {10.1016/j.solener.2018.06.063}
}`;

const copylotBibtex = `@article{hamilton2022copylot,
  author  = {Hamilton, William T. and Wagner, Michael J. and Zolan, Alexander J.},
  title   = {Demonstrating {SolarPILOT}'s Python application programmable interface through heliostat optimal aimpoint strategy use case},
  journal = {Journal of Solar Energy Engineering},
  volume  = {144},
  number  = {3},
  pages   = {030906},
  year    = {2022},
  doi     = {10.1115/1.4053973}
}`;

const solarPilotRis = `TY  - JOUR
AU  - Wagner, Michael J.
AU  - Wendelin, Tim
TI  - SolarPILOT: A power tower solar field layout and characterization tool
JO  - Solar Energy
VL  - 171
SP  - 185
EP  - 196
PY  - 2018
DO  - 10.1016/j.solener.2018.06.063
UR  - https://doi.org/10.1016/j.solener.2018.06.063
ER  -`;

const copylotRis = `TY  - JOUR
AU  - Hamilton, William T.
AU  - Wagner, Michael J.
AU  - Zolan, Alexander J.
TI  - Demonstrating SolarPILOT's Python application programmable interface through heliostat optimal aimpoint strategy use case
JO  - Journal of Solar Energy Engineering
VL  - 144
IS  - 3
SP  - 030906
PY  - 2022
DO  - 10.1115/1.4053973
UR  - https://doi.org/10.1115/1.4053973
ER  -`;

export function getCitationFormats(version: string): CitationFormat[] {
  const softwareApa = `Bonilla, J. (2026). CoPylot-Accelerated (Version ${version}) [Computer software]. ${repository}`;
  const softwareMla = `Bonilla, Javier. CoPylot-Accelerated. Version ${version}, 2026. GitHub, ${repository}.`;
  const softwareChicago = `Bonilla, Javier. 2026. CoPylot-Accelerated. Version ${version}. ${repository}.`;
  const softwareIeee = `J. Bonilla, "CoPylot-Accelerated," Version ${version}, 2026. [Online]. Available: ${repository}`;
  const softwareBibtex = `@misc{bonilla2026copylotaccelerated,
  author       = {Bonilla, Javier},
  title        = {{CoPylot-Accelerated}},
  year         = {2026},
  version      = {${version}},
  howpublished = {Computer software},
  url          = {${repository}}
}`;
  const softwareRis = `TY  - COMP
AU  - Bonilla, Javier
TI  - CoPylot-Accelerated
PY  - 2026
ET  - ${version}
N1  - Computer software.
UR  - ${repository}
ER  -`;

  return [
    {
      id: "apa",
      label: "APA 7",
      extension: "txt",
      mime: "text/plain",
      entries: [
        softwareEntry(softwareApa),
        solarPilotEntry(solarPilotApa),
        copylotEntry(copylotApa),
      ],
    },
    {
      id: "mla",
      label: "MLA 9",
      extension: "txt",
      mime: "text/plain",
      entries: [
        softwareEntry(softwareMla),
        solarPilotEntry(solarPilotMla),
        copylotEntry(copylotMla),
      ],
    },
    {
      id: "chicago",
      label: "Chicago",
      extension: "txt",
      mime: "text/plain",
      entries: [
        softwareEntry(softwareChicago),
        solarPilotEntry(solarPilotChicago),
        copylotEntry(copylotChicago),
      ],
    },
    {
      id: "ieee",
      label: "IEEE",
      extension: "txt",
      mime: "text/plain",
      entries: [
        softwareEntry(softwareIeee),
        solarPilotEntry(solarPilotIeee),
        copylotEntry(copylotIeee),
      ],
    },
    {
      id: "bibtex",
      label: "BibTeX",
      extension: "bib",
      mime: "application/x-bibtex",
      entries: [
        softwareEntry(softwareBibtex),
        solarPilotEntry(solarPilotBibtex),
        copylotEntry(copylotBibtex),
      ],
    },
    {
      id: "ris",
      label: "RIS",
      extension: "ris",
      mime: "application/x-research-info-systems",
      entries: [
        softwareEntry(softwareRis),
        solarPilotEntry(solarPilotRis),
        copylotEntry(copylotRis),
      ],
    },
  ];
}
